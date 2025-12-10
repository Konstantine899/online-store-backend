import { UserModel } from '@app/domain/models';
import { BruteforceGuard } from '@app/infrastructure/common/guards';
import { RedisService } from '@app/infrastructure/common/redis/redis.service';
import { REDIS_CLIENT } from '@app/infrastructure/common/redis/redis.constants';
import { UserRolesCacheService } from '@app/infrastructure/services/role/user-roles-cache.service';
import { getConfig } from '@app/infrastructure/config';
import { CustomValidationPipe } from '@app/infrastructure/pipes/custom-validation-pipe';
import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { TestingModuleBuilder } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import helmet from 'helmet';
import { Sequelize } from 'sequelize-typescript';
import { TestAppModule } from './test-app.module';

/**
 * Карта активных приложений для предотвращения утечек
 * Используется для graceful shutdown всех connection pools
 */
const activeApps = new Set<INestApplication>();

/**
 * Graceful shutdown всех приложений (вызывается в globalTeardown)
 */
export async function closeAllApps(): Promise<void> {
    const apps = Array.from(activeApps);
    await Promise.all(apps.map((app) => app.close()));
    activeApps.clear();
}

/**
 * Добавляет graceful shutdown для Sequelize connection pool
 * Предотвращает утечки соединений между test suites
 */
function addGracefulShutdown(app: INestApplication): void {
    const sequelize = app.get(Sequelize);
    const originalClose = app.close.bind(app);

    app.close = async (): Promise<void> => {
        try {
            // 1. Закрываем все активные соединения
            await sequelize.connectionManager.close();

            // 2. Закрываем приложение
            await originalClose();

            // 3. Удаляем из трекинга
            activeApps.delete(app);
        } catch (error) {
            console.error('Error closing app:', error);
            throw error;
        }
    };

    // Добавляем в трекинг
    activeApps.add(app);
}

export async function setupTestApp(): Promise<INestApplication> {
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

    const builder: TestingModuleBuilder = Test.createTestingModule({
        imports: [TestAppModule],
    });

    // Провайдер модели для корректного DI
    builder.overrideProvider(getModelToken(UserModel)).useValue(UserModel);

    // Подмена BruteforceGuard на заглушку для тестов (не требуем ThrottlerModule)
    builder
        .overrideProvider(BruteforceGuard)
        .useValue({ canActivate: () => true });

    // Мок RedisService для тестов (Redis не требуется в integration тестах)
    const mockRedisClient = {
        ping: async () => Promise.resolve('PONG'),
        get: async () => Promise.resolve(null),
        setex: async () => Promise.resolve('OK'),
        del: async () => Promise.resolve(1),
        keys: async () => Promise.resolve([]),
        scan: async () => Promise.resolve(['0', []]),
        exists: async () => Promise.resolve(0),
        ttl: async () => Promise.resolve(-1),
        info: async () => Promise.resolve('used_memory_human:0B'),
        quit: async () => Promise.resolve('OK'),
    };

    async function* mockScanKeys(): AsyncGenerator<string[]> {
        yield [];
    }

    builder.overrideProvider(REDIS_CLIENT).useValue(mockRedisClient);
    builder.overrideProvider(RedisService).useValue({
        ping: async () => Promise.resolve(true),
        get: async () => Promise.resolve(null),
        set: async () => Promise.resolve(true),
        del: async () => Promise.resolve(true),
        delPattern: async () => Promise.resolve(0),
        scanKeys: mockScanKeys,
        exists: async () => Promise.resolve(false),
        ttl: async () => Promise.resolve(-1),
        info: async () => Promise.resolve('used_memory_human:0B'),
        disconnect: async () => Promise.resolve(undefined),
        getClient: () => mockRedisClient,
    });

    // Мок UserRolesCacheService для тестов (избегаем проблем с зависимостями Redis)
    builder.overrideProvider(UserRolesCacheService).useValue({
        getUserRoles: async () => Promise.resolve(null),
        setUserRoles: async () => Promise.resolve(true),
        invalidateUserRoles: async () => Promise.resolve(true),
        invalidateAllUserRoles: async () => Promise.resolve(0),
        invalidateByRoleId: async () => Promise.resolve(0),
        getStats: async () =>
            Promise.resolve({ totalKeys: 0, memoryUsage: '0B' }),
    });

    const moduleRef = await builder.compile();
    const app = moduleRef.createNestApplication();

    // Настройка cookieParser для тестов
    app.use(
        cookieParser(process.env.COOKIE_PARSER_SECRET_KEY ?? 'test-secret'),
    );

    // Включаем базовый Helmet для тестов (минимальный набор заголовков)
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

    // Глобальная валидация DTO
    app.useGlobalPipes(new CustomValidationPipe());

    // Установка глобального префикса для тестов
    app.setGlobalPrefix('online-store');

    // Инициализация Swagger для тестов (если SWAGGER_ENABLED=true)
    const cfg = getConfig();
    if (cfg.SWAGGER_ENABLED) {
        const config = new DocumentBuilder()
            .setTitle('Online Store API (Test)')
            .setDescription(
                'REST API для интернет-магазина (тестовое окружение)',
            )
            .setVersion('1.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'Введите JWT токен',
                    in: 'header',
                },
                'JWT-auth',
            )
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('online-store/docs', app, document);
    }

    await app.init();

    // ВАЖНО: Явно получаем стратегии из модуля, чтобы гарантировать их создание и регистрацию в Passport
    // Это необходимо, так как стратегии регистрируются в конструкторе через PassportStrategy
    // и должны быть созданы до использования guards
    try {
        console.log('[setupTestApp] Getting ServicesModule from moduleRef...');
        const { ServicesModule } = await import('@app/infrastructure/services/services.module');
        const servicesModule = moduleRef.get(ServicesModule, { strict: false });
        console.log(`[setupTestApp] ServicesModule obtained: ${!!servicesModule}`);

        // Явно обращаемся к стратегиям через модуль, чтобы гарантировать их создание
        // Это заставит NestJS создать экземпляры стратегий, которые зарегистрируются в Passport
        // Стратегии уже должны быть созданы через инжекцию в конструкторе ServicesModule,
        // но явное обращение гарантирует их создание в тестовом окружении
        const { OAuth2SSOStrategy, SAMLSSOStrategy, OIDCSSOStrategy } = await import('@app/infrastructure/common/strategies/sso');

        // КРИТИЧНО: Явно получаем стратегии из moduleRef, чтобы гарантировать их создание
        // Это заставит NestJS создать экземпляры стратегий, которые зарегистрируются в Passport
        // Стратегии должны быть созданы через инжекцию в конструкторе ServicesModule,
        // но явное получение гарантирует их создание в тестовом окружении
        try {
            console.log('[setupTestApp] Getting SSO strategies from moduleRef...');
            const oauth2Strategy = moduleRef.get(OAuth2SSOStrategy, { strict: false });
            console.log(`[setupTestApp] OAuth2SSOStrategy obtained: ${!!oauth2Strategy}`);

            const samlStrategy = moduleRef.get(SAMLSSOStrategy, { strict: false });
            console.log(`[setupTestApp] SAMLSSOStrategy obtained: ${!!samlStrategy}`);

            const oidcStrategy = moduleRef.get(OIDCSSOStrategy, { strict: false });
            console.log(`[setupTestApp] OIDCSSOStrategy obtained: ${!!oidcStrategy}`);

            // Обращение к стратегиям гарантирует их создание и регистрацию в Passport
            // PassportStrategy регистрирует стратегии в конструкторе через passport.use(name, this)
            // Явно обращаемся к стратегиям, чтобы гарантировать их создание
            void oauth2Strategy;
            void samlStrategy;
            void oidcStrategy;

            // Проверяем, что стратегии зарегистрированы в Passport
            const passport = require('passport');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const registeredStrategies = Object.keys((passport as any)._strategies ?? {});
            const requiredStrategies = ['oauth2', 'saml', 'oidc'];
            const missingStrategies = requiredStrategies.filter(
                (name) => !registeredStrategies.includes(name),
            );

            console.log(
                `[setupTestApp] After getting strategies. Registered: ${registeredStrategies.join(', ')}`,
            );

            if (missingStrategies.length > 0) {
                console.warn(
                    `[setupTestApp] Missing Passport strategies after explicit get: ${missingStrategies.join(', ')}. Registered: ${registeredStrategies.join(', ')}`,
                );
                
                // КРИТИЧНО: Если стратегии не зарегистрированы, попробуем явно зарегистрировать их
                // Это может быть необходимо, если PassportStrategy не регистрирует их автоматически
                console.warn(
                    `[setupTestApp] Attempting to manually register strategies...`,
                );
                
                // Попробуем явно зарегистрировать стратегии в Passport
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (passport as any).use('oauth2', oauth2Strategy);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (passport as any).use('saml', samlStrategy);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (passport as any).use('oidc', oidcStrategy);
                    
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const afterManualRegister = Object.keys((passport as any)._strategies ?? {});
                    console.log(
                        `[setupTestApp] After manual registration. Registered: ${afterManualRegister.join(', ')}`,
                    );
                } catch (e) {
                    console.error(
                        `[setupTestApp] Failed to manually register strategies: ${e}`,
                    );
                }
            }
        } catch (e) {
            // Стратегии могут быть недоступны, но это критическая ошибка
            console.error(`[setupTestApp] Failed to get SSO strategies: ${e}`);
        }

        // Обращение к модулю гарантирует вызов onModuleInit, где стратегии проверяются
        void servicesModule;
    } catch (error) {
        // Игнорируем ошибки, если модуль недоступен
    }

    // Добавляем graceful shutdown для корректного закрытия connection pool
    addGracefulShutdown(app);

    return app;
}

export async function setupTestAppWithRateLimit(): Promise<INestApplication> {
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

    const builder: TestingModuleBuilder = Test.createTestingModule({
        imports: [TestAppModule],
    });

    // Провайдер модели для корректного DI
    builder.overrideProvider(getModelToken(UserModel)).useValue(UserModel);

    // ВАЖНО: НЕ подменяем BruteforceGuard — хотим реальное ограничение

    const moduleRef = await builder.compile();
    const app = moduleRef.createNestApplication();

    app.use(
        cookieParser(process.env.COOKIE_PARSER_SECRET_KEY ?? 'test-secret'),
    );
    app.useGlobalPipes(new CustomValidationPipe());

    // Установка глобального префикса для тестов
    app.setGlobalPrefix('online-store');

    await app.init();

    // Добавляем graceful shutdown для корректного закрытия connection pool
    addGracefulShutdown(app);

    return app;
}
