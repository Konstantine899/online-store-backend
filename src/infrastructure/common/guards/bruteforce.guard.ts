import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';
import { getConfig } from '@app/infrastructure/config';

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
        const request = context.switchToHttp().getRequest<Request>();

        // В тестовом окружении проверяем флаг для включения rate limiting
        if (process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT_ENABLED !== 'true') {
            return true;
        }

        // Защита от повторных вызовов для одного запроса
        if ((request as any).__bruteforceProcessed) {
            return true;
        }
        (request as any).__bruteforceProcessed = true;

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
        const request = requestProps.context.switchToHttp().getRequest<Request>();
        const ip = (request.headers['x-forwarded-for'] as string) || request.ip || 'unknown';
        const key = `${profile}:${ip}`;
        const now = Date.now();
        let node = BruteforceGuard.counters.get(key);
        if (!node || now >= node.resetAt) {
            node = { count: 0, resetAt: now + windowMs };
            BruteforceGuard.counters.set(key, node);
        }
        if (node.count >= limit) {
            this.logger.warn(`${profile} rate limit exceeded`, {
                route: request.url,
                method: request.method,
                correlationId: request.headers['x-request-id'],
            });
            throw new ThrottlerException('Слишком много запросов. Попробуйте позже.');
        }
        node.count += 1;
        return true;
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
