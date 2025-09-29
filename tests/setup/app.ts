import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { TestAppModule } from './test-app.module';
import 'dotenv/config';
import { UserModel } from '@app/domain/models';
import { CustomValidationPipe } from '@app/infrastructure/pipes/custom-validation-pipe';
import cookieParser from 'cookie-parser';


export async function setupTestApp(): Promise<INestApplication> {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';

    const builder: TestingModuleBuilder = Test.createTestingModule({
        imports: [TestAppModule],
    });

    // Провайдер модели для корректного DI
    builder.overrideProvider(getModelToken(UserModel)).useValue(UserModel);

    const moduleRef = await builder.compile();
    const app = moduleRef.createNestApplication();

    // Настройка cookieParser для тестов
    app.use(cookieParser(process.env.COOKIE_PARSER_SECRET_KEY || 'test-secret'));

    // Глобальная валидация DTO
    app.useGlobalPipes(new CustomValidationPipe());

    await app.init();
    return app;
}