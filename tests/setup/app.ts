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
