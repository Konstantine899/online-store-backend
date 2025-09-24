import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import * as process from 'process';
import * as Joi from 'joi';
import {
    SequelizeConfigService,
    databaseConfig,
} from '@app/infrastructure/config/sequelize';
import { ControllersModule } from './infrastructure/controllers/controllers.module';
import { ServicesModule } from './infrastructure/services/services.module';
import { RepositoriesModule } from './infrastructure/repositories/repositories.module';
import { HealthModule } from './infrastructure/controllers/health/health.module';

@Module({
    imports: [
        SequelizeModule.forRootAsync({
            imports: [ConfigModule],
            useClass: SequelizeConfigService,
        }),
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
                SQL_LOGGING: Joi.string().valid('true', 'false').default('false'),
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

        ControllersModule,
        ServicesModule,
        RepositoriesModule,
        HealthModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
