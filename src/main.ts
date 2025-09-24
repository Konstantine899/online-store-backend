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
import { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';

type ReqWithCorrelation = IncomingMessage & {
    correlationId?: string;
    headers: Record<string, string | string[] | undefined>;
};

async function bootstrap(): Promise<void> {
    const PORT = process.env.PORT || 5000;
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

    const corsOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    app.enableCors({
        origin: (origin, cb) => {
            if (!origin || corsOrigins.includes(origin)) {
                return cb(null, true);
            }
            return cb(new Error('Not allowed by CORS'), false);
        },
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'], // Настраивает заголовок CORS Access-Control-Allow-Headers.
        exposedHeaders: ['Content-Range', 'X-Content-Range'], // Настраивает заголовок CORS Access-Control-Expose-Headers
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    });

    app.use(cookieParser(process.env.COOKIE_PARSER_SECRET_KEY || 'change-me'));

    const correlation = new CorrelationIdMiddleware();
    app.use(correlation.use.bind(correlation));

    app.use(
        pinoHttp({
            genReqId: (req: ReqWithCorrelation) =>
                req.correlationId ??
                (req.headers['x-request-id'] as string | undefined) ??
                randomUUID(),
            transport:
                process.env.NODE_ENV === 'development'
                    ? { target: 'pino-pretty' }
                    : undefined,
        }),
    );

    if (process.env.NODE_ENV !== 'production') {
        swaggerConfig(app);
    }

    app.enableShutdownHooks();

    await app.listen(PORT, () => {
        return console.log(`Server started on port = ${PORT}`);
    });
}

bootstrap();
