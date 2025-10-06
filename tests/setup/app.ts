import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { TestAppModule } from './test-app.module';
import 'dotenv/config';
import { UserModel } from '@app/domain/models';
import { CustomValidationPipe } from '@app/infrastructure/pipes/custom-validation-pipe';
import cookieParser from 'cookie-parser';
import { BruteforceGuard } from '@app/infrastructure/common/guards';
import helmet from 'helmet';


export async function setupTestApp(): Promise<INestApplication> {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';

    const builder: TestingModuleBuilder = Test.createTestingModule({
        imports: [TestAppModule],
    });

    // Провайдер модели для корректного DI
    builder.overrideProvider(getModelToken(UserModel)).useValue(UserModel);

    // Подмена BruteforceGuard на заглушку для тестов (не требуем ThrottlerModule)
    builder.overrideProvider(BruteforceGuard).useValue({ canActivate: () => true });

    const moduleRef = await builder.compile();
    const app = moduleRef.createNestApplication();

    // Настройка cookieParser для тестов
    app.use(cookieParser(process.env.COOKIE_PARSER_SECRET_KEY || 'test-secret'));

    // Включаем базовый Helmet для тестов (минимальный набор заголовков)
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

    // Глобальная валидация DTO
    app.useGlobalPipes(new CustomValidationPipe());

    // Установка глобального префикса для тестов
    app.setGlobalPrefix('online-store');

    await app.init();
    return app;
}

export async function setupTestAppWithRateLimit(): Promise<INestApplication> {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';

    const builder: TestingModuleBuilder = Test.createTestingModule({
        imports: [TestAppModule],
    });

    // Провайдер модели для корректного DI
    builder.overrideProvider(getModelToken(UserModel)).useValue(UserModel);

    // ВАЖНО: НЕ подменяем BruteforceGuard — хотим реальное ограничение

    const moduleRef = await builder.compile();
    const app = moduleRef.createNestApplication();

    app.use(cookieParser(process.env.COOKIE_PARSER_SECRET_KEY || 'test-secret'));
    app.useGlobalPipes(new CustomValidationPipe());

    // Установка глобального префикса для тестов
    app.setGlobalPrefix('online-store');

    await app.init();
    return app;
}