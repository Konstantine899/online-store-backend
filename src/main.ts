import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';
import { CustomValidationPipe } from '@app/infrastructure/pipes';
import {
    SequelizeUniqueConstraintExceptionFilter,
    SequelizeDatabaseErrorExceptionFilter,
    CustomNotFoundExceptionFilter,
} from '@app/infrastructure/exceptions';

import * as cookieParser from 'cookie-parser';
import { swaggerConfig } from '@app/infrastructure/config/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { CorrelationIdMiddleware } from '@app/infrastructure/common/middleware/correlation-id.middleware';
import { getConfig } from '@app/infrastructure/config';
import { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@app/infrastructure/common/utils/logging';

type ReqWithCorrelation = IncomingMessage & {
    correlationId?: string;
    headers: Record<string, string | string[] | undefined>;
};

// Глобальные логгеры (создаются один раз для переиспользования)
const processLogger = createLogger('Bootstrap');
const rateLimiterLogger = createLogger('RateLimiter');

/**
 * Обработчик необработанных Promise rejection
 * Логирует ошибку и корректно завершает приложение
 */
process.on('unhandledRejection', (reason: unknown) => {
        processLogger.error(
            {
                reason:
                    reason instanceof Error ? reason.message : String(reason),
                stack: reason instanceof Error ? reason.stack : undefined,
            },
            'Необработанное Promise rejection',
        );

        // Graceful shutdown после логирования
        process.exit(1);
    },
);

/**
 * Обработчик необработанных исключений
 * Логирует критичную ошибку и завершает приложение
 */
process.on('uncaughtException', (error: Error) => {
    processLogger.error(
        {
            error: error.message,
            stack: error.stack,
            name: error.name,
        },
        'Необработанное исключение',
    );

    // Критичная ошибка - немедленное завершение
    process.exit(1);
});

async function bootstrap(): Promise<void> {
    const cfg = getConfig();
    const PORT = cfg.PORT || 5000;
    const logger = createLogger('Application');

    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    // Скрываю технологический заголовок Express
    app.getHttpAdapter().getInstance().disable('x-powered-by');
    // Доверять прокси в продакшене (корректные IP и secure cookies)
    if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

    app.setGlobalPrefix('online-store');

    app.useStaticAssets(path.join(__dirname, 'static'), {
        prefix: '/online-store/static/',
    });
    app.useGlobalPipes(...[new CustomValidationPipe()]);
    app.useGlobalFilters(
        ...[
            new SequelizeUniqueConstraintExceptionFilter(),
            new SequelizeDatabaseErrorExceptionFilter(),
            new CustomNotFoundExceptionFilter(),
        ],
    );
    if (cfg.SECURITY_HELMET_ENABLED) {
        const cspDirectives = {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            frameAncestors: ["'self'"],
            imgSrc: ["'self'", 'data:', 'blob:'],
            objectSrc: ["'none'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", ...cfg.ALLOWED_ORIGINS],
        } as const;

        app.use(
            helmet({
                crossOriginResourcePolicy: { policy: 'cross-origin' },
                contentSecurityPolicy: cfg.SECURITY_CSP_ENABLED
                    ? { directives: cspDirectives }
                    : false,
            }),
        );
    }

    // Глобальный rate limiter (простое in-memory окно 1s и 60s по IP)
    if (cfg.RATE_LIMIT_ENABLED) {
        const perIpCounters = new Map<
            string,
            { s: number; sTs: number; m: number; mTs: number }
        >();
        const SEC = 1000;
        const MIN = 60 * 1000;
        const CLEANUP_INTERVAL = 5 * 60 * 1000; // Очистка каждые 5 минут
        let lastCleanup = Date.now();

        app.use((req: Request, res: Response, next: NextFunction) => {
            const ts = Date.now();

            // Периодическая очистка старых записей для предотвращения утечки памяти
            if (ts - lastCleanup > CLEANUP_INTERVAL) {
                for (const [ip, ctr] of perIpCounters.entries()) {
                    if (ts - ctr.mTs > MIN) {
                        perIpCounters.delete(ip);
                    }
                }
                lastCleanup = ts;
            }

            const ip =
                (req.headers['x-forwarded-for'] as string) ||
                req.socket.remoteAddress ||
                'unknown';
            let ctr = perIpCounters.get(ip);
            if (!ctr) {
                ctr = { s: 0, sTs: ts, m: 0, mTs: ts };
                perIpCounters.set(ip, ctr);
            }
            if (ts - ctr.sTs >= SEC) {
                ctr.s = 0;
                ctr.sTs = ts;
            }
            if (ts - ctr.mTs >= MIN) {
                ctr.m = 0;
                ctr.mTs = ts;
            }
            ctr.s += 1;
            ctr.m += 1;
            if (
                ctr.s > cfg.RATE_LIMIT_GLOBAL_RPS ||
                ctr.m > cfg.RATE_LIMIT_GLOBAL_RPM
            ) {
                // Используем кэшированный logger для оптимизации
                rateLimiterLogger.warn(
                    {
                        ip,
                        correlationId: (req as ReqWithCorrelation)
                            .correlationId,
                    },
                    'Rate limit exceeded',
                );
                res.status(429).json({
                    statusCode: 429,
                    url: req.url,
                    path: req.url,
                    name: 'TooManyRequests',
                    message: 'Слишком много запросов. Попробуйте позже',
                });
                return;
            }
            next();
        });
    }

    // Используем Set для O(1) проверки origin и минимизации аллокаций
    const corsOriginSet = new Set(cfg.ALLOWED_ORIGINS);

    if (cfg.SECURITY_CORS_ENABLED) {
        app.enableCors({
            origin: (origin, cb) => {
                if (!origin || corsOriginSet.has(origin)) {
                    return cb(null, true);
                }
                return cb(new Error('Not allowed by CORS'), false);
            },
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
            exposedHeaders: [
                'Content-Range',
                'X-Content-Range',
                'x-request-id',
            ],
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        });
    }

    app.use(cookieParser(cfg.COOKIE_PARSER_SECRET_KEY || 'change-me'));

    const correlation = new CorrelationIdMiddleware();
    app.use(correlation.use.bind(correlation));

    // Оптимизация: константы для pinoHttp paths (создаются один раз)
    const PII_REDACT_PATHS = [
        // Токены и авторизация
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        'req.body.password',
        'req.body.token',
        'req.body.refreshToken',
        'req.body.accessToken',
        // PII данные
        'req.body.email',
        'req.body.phone',
        'req.body.firstName',
        'req.body.lastName',
        'req.body.name',
        'req.body.address',
        // Query параметры с PII
        'req.query.email',
        'req.query.phone',
        // Response body (может содержать PII)
        'res.body.email',
        'res.body.phone',
    ] as const;

    // Оптимизация: Set для быстрой проверки URL (O(1) вместо множественных сравнений)
    const IGNORED_LOG_PATHS = new Set(['/health', '/live', '/ready']);

    app.use(
        pinoHttp({
            genReqId: (req: ReqWithCorrelation) =>
                req.correlationId ??
                (req.headers['x-request-id'] as string | undefined) ??
                randomUUID(),
            transport:
                cfg.NODE_ENV === 'development'
                    ? { target: 'pino-pretty' }
                    : undefined,
            // добавляем correlationId в каждую запись лога
            customProps: (req: ReqWithCorrelation) => ({
                correlationId: req.correlationId,
            }),
            // маскируем токены/куки/PII
            redact: {
                paths: PII_REDACT_PATHS as unknown as string[],
                censor: '[REDACTED]',
            },
            // Оптимизация: не логируем успешные health checks (уменьшаем шум)
            autoLogging: {
                ignore: (req: ReqWithCorrelation) => {
                    const url = (req as unknown as { url?: string }).url;
                    // Проверка через Set (O(1)) + проверка префикса для static
                    return !!(
                        (url && IGNORED_LOG_PATHS.has(url)) ||
                        url?.startsWith('/online-store/static/')
                    );
                },
            },
        }),
    );

    // Swagger документация: управляется через SWAGGER_ENABLED (по умолчанию только dev/test)
    if (cfg.SWAGGER_ENABLED) {
        swaggerConfig(app);
        logger.info(
            { port: PORT },
            'Swagger документация доступна на /online-store/docs',
        );
    } else {
        logger.info('Swagger документация отключена (SWAGGER_ENABLED=false)');
    }

    app.enableShutdownHooks();

    // корректное завершение по сигналам SIGINT/SIGTERM
    const shutdown = async (signal: string) => {
        logger.info(
            { signal },
            'Получен сигнал завершения, graceful shutdown...',
        );
        try {
            await app.close();
            logger.info('Приложение корректно завершено');
            process.exit(0);
        } catch (e) {
            logger.error(
                { error: e instanceof Error ? e.message : String(e) },
                'Ошибка при завершении приложения',
            );
            process.exit(1);
        }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    await app.listen(PORT, () => {
        logger.info(
            {
                port: PORT,
                env: cfg.NODE_ENV,
                apiPrefix: '/online-store',
                swaggerEnabled: cfg.SWAGGER_ENABLED,
            },
            'Приложение успешно запущено',
        );
    });
}

bootstrap().catch((error) => {
    processLogger.error(
        {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        },
        'Критичная ошибка при запуске приложения',
    );
    process.exit(1);
});
