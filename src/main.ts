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

type ReqWithCorrelation = IncomingMessage & {
    correlationId?: string;
    headers: Record<string, string | string[] | undefined>;
};

async function bootstrap(): Promise<void> {
    const cfg = getConfig();
    const PORT = cfg.PORT || 5000;
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
        const perIpCounters = new Map<string, { s: number; sTs: number; m: number; mTs: number }>();
        const nowMs = () => Date.now();
        const sec = 1000;
        const min = 60 * 1000;
        app.use((req: Request, res: Response, next: NextFunction) => {
            const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
            const ts = nowMs();
            let ctr = perIpCounters.get(ip);
            if (!ctr) {
                ctr = { s: 0, sTs: ts, m: 0, mTs: ts };
                perIpCounters.set(ip, ctr);
            }
            if (ts - ctr.sTs >= sec) {
                ctr.s = 0;
                ctr.sTs = ts;
            }
            if (ts - ctr.mTs >= min) {
                ctr.m = 0;
                ctr.mTs = ts;
            }
            ctr.s += 1;
            ctr.m += 1;
            if (ctr.s > cfg.RATE_LIMIT_GLOBAL_RPS || ctr.m > cfg.RATE_LIMIT_GLOBAL_RPM) {
                if ((req as ReqWithCorrelation).correlationId) {
                    console.warn(
                        JSON.stringify({ level: 'warn', msg: 'Rate limit exceeded', correlationId: (req as ReqWithCorrelation).correlationId }),
                    );
                }
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
            exposedHeaders: ['Content-Range', 'X-Content-Range', 'x-request-id'],
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        });
    }

    app.use(cookieParser(cfg.COOKIE_PARSER_SECRET_KEY || 'change-me'));

    const correlation = new CorrelationIdMiddleware();
    app.use(correlation.use.bind(correlation));

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
                paths: [
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
                ],
                censor: '[REDACTED]',
            },
        }),
    );

    // Swagger документация: управляется через SWAGGER_ENABLED (по умолчанию только dev/test)
    if (cfg.SWAGGER_ENABLED) {
        swaggerConfig(app);
        console.log(`Swagger документация доступна: http://localhost:${PORT}/online-store/docs`);
    } else {
        console.log('Swagger документация отключена (SWAGGER_ENABLED=false)');
    }

    app.enableShutdownHooks();

    // корректное завершение по сигналам SIGINT/SIGTERM
    const shutdown = async (signal: string) => {
        console.log(`Получен сигнал ${signal}, завершаем работу...`);
        try {
            await app.close();
            process.exit(0);
        } catch (e) {
            console.error('Ошибка при завершении приложения:', e);
            process.exit(1);
        }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    await app.listen(PORT, () => {
        console.log(`Приложение запущено на порту ${PORT}`);
        console.log(`Префикс API: /online-store`);
    });
}

bootstrap().catch((error) => {
    console.error('Ошибка при запуске приложения:', error);
    process.exit(1);
});
