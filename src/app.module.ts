import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SequelizeModule } from '@nestjs/sequelize';
import { ThrottlerModule } from '@nestjs/throttler';
import { TenantContext } from './infrastructure/common/context';
import { BruteforceGuard } from './infrastructure/common/guards';
import { TenantMiddleware } from './infrastructure/common/middleware';

import { TenantModel } from '@app/domain/models';
import {
    SequelizeConfigService,
    databaseConfig,
} from '@app/infrastructure/config/sequelize';
import * as Joi from 'joi';
import * as process from 'process';
import { ControllersModule } from './infrastructure/controllers/controllers.module';
import { HealthModule } from './infrastructure/controllers/health/health.module';
import { RepositoriesModule } from './infrastructure/repositories/repositories.module';
import { ServicesModule } from './infrastructure/services/services.module';

@Module({
    imports: [
        SequelizeModule.forRootAsync({
            imports: [ConfigModule],
            useClass: SequelizeConfigService,
        }),
        SequelizeModule.forFeature([TenantModel]),
        ConfigModule.forRoot({
            envFilePath: `.${process.env.NODE_ENV}.env`,
            load: [databaseConfig],
            isGlobal: true,
            validationSchema: Joi.object({
                NODE_ENV: Joi.string()
                    .valid('development', 'production', 'test')
                    .required(),
                PORT: Joi.number().port().default(5000),

                // CORS / Cookies (используются в main.ts)
                ALLOWED_ORIGINS: Joi.string().required(), // CSV: http://localhost:3000,https://app.example.com
                COOKIE_PARSER_SECRET_KEY: Joi.string().min(10).required(),

                // DB
                DIALECT: Joi.string()
                    .valid('mysql', 'mariadb', 'postgres', 'sqlite', 'mssql')
                    .default('mysql'),
                SQL_LOGGING: Joi.string()
                    .valid('true', 'false')
                    .default('false'),
                MYSQL_HOST: Joi.string().required(),
                MYSQL_PORT: Joi.number().integer().min(1).max(65535).required(),
                MYSQL_DATABASE: Joi.string().required(),
                MYSQL_USER: Joi.string().required(),
                MYSQL_PASSWORD: Joi.string().required(),

                // Для sequelize-cli
                DEV_MYSQL_HOST: Joi.string().optional(),
                DEV_MYSQL_PORT: Joi.number()
                    .integer()
                    .min(1)
                    .max(65535)
                    .optional(),
                DEV_MYSQL_DATABASE: Joi.string().optional(),
                DEV_MYSQL_USER: Joi.string().optional(),
                DEV_MYSQL_PASSWORD: Joi.string().optional(),
                DEV_DIALECT: Joi.string().optional(),

                // JWT (из .development.env)
                JWT_PRIVATE_KEY: Joi.string().hex().length(64).required(),
                JWT_ACCESS_SECRET: Joi.string().min(16).required(),
                JWT_REFRESH_SECRET: Joi.string().min(16).required(),
                // Формат TTL: 15m, 30d, 12h, и т.п.
                JWT_ACCESS_EXPIRES: Joi.string()
                    .regex(/^\d+(ms|s|m|h|d)$/)
                    .required(),
                JWT_REFRESH_EXPIRES: Joi.string()
                    .regex(/^\d+(ms|s|m|h|d)$/)
                    .required(),
            }),
            validationOptions: {
                abortEarly: false, // показать все ошибки разом
                allowUnknown: true, // разрешить системные переменные среды
            },
        }),

        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000, // 1 секунда
                limit: 3, // 3 запроса в секунду
            },
            {
                name: 'medium',
                ttl: 10000, // 10 секунд
                limit: 20, // 20 запросов в 10 секунд
            },
            {
                name: 'long',
                ttl: 60000, // 1 минута
                limit: 100, // 100 запросов в минуту
            },
            {
                name: 'login',
                ttl: 15 * 60 * 1000, // 15 минут
                limit: 5, // 5 попыток логина в 15 минут
            },
            {
                name: 'refresh',
                ttl: 5 * 60 * 1000, // 5 минут
                limit: 10, // 10 попыток refresh в 5 минут
            },
            {
                name: 'registration',
                ttl: 60 * 1000, // 1 минута
                limit: 3, // 3 попытки регистрации в минуту
            },
        ]),

        EventEmitterModule.forRoot({
            // Настройки для event emitter
            wildcard: false,
            delimiter: '.',
            newListener: false,
            removeListener: false,
            maxListeners: 10,
            verboseMemoryLeak: false,
            ignoreErrors: false,
        }),

        ControllersModule,
        ServicesModule,
        RepositoriesModule,
        HealthModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: BruteforceGuard,
        },
        TenantContext, // Request-scoped provider для tenant isolation
    ],
    exports: [TenantContext], // Экспортируем для использования в других модулях
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        // SAAS-001: Multi-tenancy middleware for tenant isolation
        // Extracts tenant_id from x-tenant-id header or subdomain
        // Excluded paths: health checks, API docs, static assets
        consumer
            .apply(TenantMiddleware)
            .exclude(
                '/health',
                '/online-store/health',
                '/online-store/docs*path',
                '/online-store/static*path',
            )
            .forRoutes('*');
    }
}
