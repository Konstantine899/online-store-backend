import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';
import { getConfig } from '@app/infrastructure/config';

// Расширяем тип Request для добавления нашего флага
interface RequestWithBruteforceFlag extends Request {
    __bruteforceProcessed?: boolean;
}

@Injectable()
export class BruteforceGuard extends ThrottlerGuard {
    private readonly logger = new Logger(BruteforceGuard.name);
    private static counters = new Map<string, { count: number; resetAt: number }>();

    public static resetCounters(): void {
        BruteforceGuard.counters.clear();
    }

    protected async handleRequest(
        requestProps: ThrottlerRequest,
    ): Promise<boolean> {
        const { context } = requestProps;
        const request = context.switchToHttp().getRequest<RequestWithBruteforceFlag>();

        // В тестовом окружении проверяем флаг для включения rate limiting
        if (process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT_ENABLED !== 'true') {
            return true;
        }

        // Защита от повторных вызовов для одного запроса
        if (request.__bruteforceProcessed) {
            return true;
        }
        request.__bruteforceProcessed = true;

        // Специальная логика для auth роутов
        if (request.url.includes('/auth/login')) {
            return this.handleLoginAttempt(requestProps);
        }

        if (request.url.includes('/auth/refresh')) {
            return this.handleRefreshAttempt(requestProps);
        }

        if (request.url.includes('/auth/registration')) {
            return this.handleRegistrationAttempt(requestProps);
        }

        // Для всех остальных роутов разрешаем проход без ограничений
        return true;
    }

    private async handleLoginAttempt(
        requestProps: ThrottlerRequest,
    ): Promise<boolean> {
        const cfg = getConfig();
        const ttlMs = parseWindowToMs(cfg.RATE_LIMIT_LOGIN_WINDOW, 15 * 60 * 1000);
        const limit = cfg.RATE_LIMIT_LOGIN_ATTEMPTS;
        return this.checkAndIncrement('login', ttlMs, limit, requestProps);
    }

    private async handleRefreshAttempt(
        requestProps: ThrottlerRequest,
    ): Promise<boolean> {
        const cfg = getConfig();
        const ttlMs = parseWindowToMs(cfg.RATE_LIMIT_REFRESH_WINDOW, 5 * 60 * 1000);
        const limit = cfg.RATE_LIMIT_REFRESH_ATTEMPTS;
        return this.checkAndIncrement('refresh', ttlMs, limit, requestProps);
    }

    private async handleRegistrationAttempt(
        requestProps: ThrottlerRequest,
    ): Promise<boolean> {
        const cfg = getConfig();
        const ttlMs = parseWindowToMs(cfg.RATE_LIMIT_REG_WINDOW, 60 * 1000);
        const limit = cfg.RATE_LIMIT_REG_ATTEMPTS;
        return this.checkAndIncrement('registration', ttlMs, limit, requestProps);
    }

    private checkAndIncrement(
        profile: 'login' | 'refresh' | 'registration',
        windowMs: number,
        limit: number,
        requestProps: ThrottlerRequest,
    ): boolean {
        const request = requestProps.context.switchToHttp().getRequest<RequestWithBruteforceFlag>();
        
        // Безопасное извлечение IP с валидацией
        const ip = this.extractClientIP(request);
        const key = `${profile}:${ip}`;
        const now = Date.now();
        
        // Атомарная операция для избежания race condition
        let node = BruteforceGuard.counters.get(key);
        if (!node || now >= node.resetAt) {
            node = { count: 0, resetAt: now + windowMs };
            BruteforceGuard.counters.set(key, node);
        }
        
        // Проверяем лимит ДО инкремента для корректной логики
        if (node.count >= limit) {
            this.logger.warn(`${profile} rate limit exceeded`, {
                route: request.url,
                method: request.method,
                correlationId: request.headers['x-request-id'],
                ip: this.maskIP(ip), // Маскируем IP в логах
            });
            throw new ThrottlerException('Слишком много запросов. Попробуйте позже.');
        }
        
        node.count += 1;
        return true;
    }

    /**
     * Безопасное извлечение IP адреса клиента
     */
    private extractClientIP(request: RequestWithBruteforceFlag): string {
        // Проверяем заголовки в порядке приоритета
        const forwardedFor = request.headers['x-forwarded-for'] as string;
        const realIP = request.headers['x-real-ip'] as string;
        const clientIP = request.headers['x-client-ip'] as string;
        
        // Если есть x-forwarded-for, берём первый IP (клиент)
        if (forwardedFor) {
            const ips = forwardedFor.split(',').map(ip => ip.trim());
            const clientIP = ips[0];
            if (this.isValidIP(clientIP)) {
                return clientIP;
            }
        }
        
        // Проверяем другие заголовки
        if (realIP && this.isValidIP(realIP)) {
            return realIP;
        }
        
        if (clientIP && this.isValidIP(clientIP)) {
            return clientIP;
        }
        
        // Fallback на socket.remoteAddress
        const socketIP = request.socket?.remoteAddress;
        if (socketIP && this.isValidIP(socketIP)) {
            return socketIP;
        }
        
        // Последний fallback
        return 'unknown';
    }

    /**
     * Валидация IP адреса
     */
    private isValidIP(ip: string): boolean {
        if (!ip || typeof ip !== 'string') {
            return false;
        }
        
        // Простая валидация IPv4 и IPv6
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }

    /**
     * Маскирование IP для логирования (безопасность)
     */
    private maskIP(ip: string): string {
        if (ip === 'unknown') {
            return ip;
        }
        
        // Маскируем последний октет для IPv4
        const ipv4Regex = /^(\d+\.\d+\.\d+)\.\d+$/;
        const match = ip.match(ipv4Regex);
        if (match) {
            return `${match[1]}.xxx`;
        }
        
        // Для IPv6 маскируем последние группы
        if (ip.includes(':')) {
            const parts = ip.split(':');
            if (parts.length >= 4) {
                return parts.slice(0, -2).join(':') + ':xxxx:xxxx';
            }
        }
        
        return 'masked';
    }
}

function parseWindowToMs(value: string, fallback: number): number {
    const match = /^([0-9]+)\s*([smhd])$/.exec(value);
    if (!match) return fallback;
    const amount = Number(match[1]);
    const unit = match[2];
    switch (unit) {
        case 's':
            return amount * 1000;
        case 'm':
            return amount * 60 * 1000;
        case 'h':
            return amount * 60 * 60 * 1000;
        case 'd':
            return amount * 24 * 60 * 60 * 1000;
        default:
            return fallback;
    }
}
