import { getConfig } from '@app/infrastructure/config';
import { Injectable, Logger } from '@nestjs/common';
import {
    ThrottlerException,
    ThrottlerGuard,
    ThrottlerRequest,
} from '@nestjs/throttler';
import { Request } from 'express';

// Расширяем тип Request для добавления нашего флага
interface RequestWithBruteforceFlag extends Request {
    __bruteforceProcessed?: boolean;
}

// Кэшированные конфигурации для избежания повторных вызовов getConfig()
interface CachedConfig {
    loginWindowMs: number;
    loginLimit: number;
    refreshWindowMs: number;
    refreshLimit: number;
    regWindowMs: number;
    regLimit: number;
}

// Предкомпилированные regex для валидации IP
const IPV4_REGEX =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
const IPV4_MASK_REGEX = /^(\d+\.\d+\.\d+)\.\d+$/;

@Injectable()
export class BruteforceGuard extends ThrottlerGuard {
    private readonly logger = new Logger(BruteforceGuard.name);
    private static counters = new Map<
        string,
        { count: number; resetAt: number }
    >();

    // Кэшированная конфигурация для избежания повторных вызовов getConfig()
    private static cachedConfig: CachedConfig | null = null;
    private static configCacheTime = 0;
    private static readonly CONFIG_CACHE_TTL = 30000; // 30 секунд

    public static resetCounters(): void {
        BruteforceGuard.counters.clear();
    }

    protected async handleRequest(
        requestProps: ThrottlerRequest,
    ): Promise<boolean> {
        const { context } = requestProps;
        const request = context
            .switchToHttp()
            .getRequest<RequestWithBruteforceFlag>();

        // В тестовом окружении проверяем флаг для включения rate limiting
        if (
            process.env.NODE_ENV === 'test' &&
            process.env.RATE_LIMIT_ENABLED !== 'true'
        ) {
            return true;
        }

        // Защита от повторных вызовов для одного запроса
        if (request.__bruteforceProcessed) {
            return true;
        }
        request.__bruteforceProcessed = true;

        // Специальная логика для auth роутов с кэшированной конфигурацией
        const config = this.getCachedConfig();

        if (request.url.includes('/auth/login')) {
            return this.checkAndIncrement(
                'login',
                config.loginWindowMs,
                config.loginLimit,
                requestProps,
            );
        }

        if (request.url.includes('/auth/refresh')) {
            return this.checkAndIncrement(
                'refresh',
                config.refreshWindowMs,
                config.refreshLimit,
                requestProps,
            );
        }

        if (request.url.includes('/auth/registration')) {
            return this.checkAndIncrement(
                'registration',
                config.regWindowMs,
                config.regLimit,
                requestProps,
            );
        }

        // Для всех остальных роутов разрешаем проход без ограничений
        return true;
    }

    /**
     * Получение кэшированной конфигурации для избежания повторных вызовов getConfig()
     */
    private getCachedConfig(): CachedConfig {
        const now = Date.now();

        // Проверяем, нужно ли обновить кэш
        if (
            !BruteforceGuard.cachedConfig ||
            now - BruteforceGuard.configCacheTime >
                BruteforceGuard.CONFIG_CACHE_TTL
        ) {
            const cfg = getConfig();

            BruteforceGuard.cachedConfig = {
                loginWindowMs: parseWindowToMs(
                    cfg.RATE_LIMIT_LOGIN_WINDOW,
                    15 * 60 * 1000,
                ),
                loginLimit: cfg.RATE_LIMIT_LOGIN_ATTEMPTS,
                refreshWindowMs: parseWindowToMs(
                    cfg.RATE_LIMIT_REFRESH_WINDOW,
                    5 * 60 * 1000,
                ),
                refreshLimit: cfg.RATE_LIMIT_REFRESH_ATTEMPTS,
                regWindowMs: parseWindowToMs(
                    cfg.RATE_LIMIT_REG_WINDOW,
                    60 * 1000,
                ),
                regLimit: cfg.RATE_LIMIT_REG_ATTEMPTS,
            };

            BruteforceGuard.configCacheTime = now;
        }

        return BruteforceGuard.cachedConfig;
    }

    private checkAndIncrement(
        profile: 'login' | 'refresh' | 'registration',
        windowMs: number,
        limit: number,
        requestProps: ThrottlerRequest,
    ): boolean {
        const request = requestProps.context
            .switchToHttp()
            .getRequest<RequestWithBruteforceFlag>();
        const response = requestProps.context.switchToHttp().getResponse();

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

            // Добавляем Retry-After header (в секундах до сброса счётчика)
            const retryAfterSeconds = Math.ceil((node.resetAt - now) / 1000);
            response.setHeader('Retry-After', retryAfterSeconds.toString());

            throw new ThrottlerException(
                'Слишком много запросов. Попробуйте позже.',
            );
        }

        node.count += 1;
        return true;
    }

    /**
     * Безопасное извлечение IP адреса клиента (оптимизированное)
     */
    private extractClientIP(request: RequestWithBruteforceFlag): string {
        // Проверяем заголовки в порядке приоритета
        const forwardedFor = request.headers['x-forwarded-for'] as string;

        // Если есть x-forwarded-for, берём первый IP (клиент) - самый частый случай
        if (forwardedFor) {
            const firstComma = forwardedFor.indexOf(',');
            const clientIP =
                firstComma > 0
                    ? forwardedFor.substring(0, firstComma).trim()
                    : forwardedFor.trim();
            if (this.isValidIP(clientIP)) {
                return clientIP;
            }
        }

        // Проверяем другие заголовки (менее частые случаи)
        const realIP = request.headers['x-real-ip'] as string;
        if (realIP && this.isValidIP(realIP)) {
            return realIP;
        }

        const clientIP = request.headers['x-client-ip'] as string;
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
     * Валидация IP адреса (оптимизированная)
     */
    private isValidIP(ip: string): boolean {
        if (!ip || typeof ip !== 'string') {
            return false;
        }

        // Используем предкомпилированные regex для лучшей производительности
        return IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip);
    }

    /**
     * Маскирование IP для логирования (оптимизированное)
     */
    private maskIP(ip: string): string {
        if (ip === 'unknown') {
            return ip;
        }

        // Маскируем последний октет для IPv4 (используем предкомпилированный regex)
        const match = ip.match(IPV4_MASK_REGEX);
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

export function parseWindowToMs(value: string, fallback: number): number {
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
