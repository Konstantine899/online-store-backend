import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { AppModule } from '../../src/app.module';
import 'dotenv/config';
import { UserModel } from '@app/domain/models';
import { AuthGuard } from '@app/infrastructure/common/guards/auth.guard';
import { RoleGuard } from '@app/infrastructure/common/guards/role.guard';
import { UnauthorizedException, HttpStatus } from '@nestjs/common';
import { CustomValidationPipe } from '@app/infrastructure/pipes/custom-validation-pipe';


export async function setupTestApp(): Promise<INestApplication> {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';

    const builder: TestingModuleBuilder = Test.createTestingModule({
        imports: [AppModule],
    });

    // В тестовом контейнере безопасно переопределяем провайдер модели
    builder.overrideProvider(getModelToken(UserModel)).useValue(UserModel);

    // Тестовые Guard'ы: эмулируем аутентификацию по наличию Authorization и подставляем req.user
    builder.overrideGuard(AuthGuard).useValue({
        canActivate: (context: any) => {
            const request = context.switchToHttp().getRequest();
            const authorization: string | undefined = request?.headers?.authorization;
            if (!authorization) {
                throw new UnauthorizedException({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: 'Пользователь не авторизован',
                });
            }
            // Подставляем существующий в сидере id (user@example.com обычно третий вставляемый)
            request.user = { id: 3 };
            return true;
        },
    });
    builder.overrideGuard(RoleGuard).useValue({ canActivate: () => true });

    const moduleRef = await builder.compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    await app.init();
    return app;
}