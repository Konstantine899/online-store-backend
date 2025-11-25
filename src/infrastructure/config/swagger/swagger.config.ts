import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ControllersModule } from '@app/infrastructure/controllers/controllers.module';
import { HealthModule } from '@app/infrastructure/controllers/health/health.module';

export function swaggerConfig(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('online-store-backend')
        .setDescription('Документация online-store API')
        .addTag('Автор: Атрощенко Константин')
        .setVersion('1.0.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            },
            'JWT-auth', // Это имя важно для сопоставления с @ApiBearerAuth() в контроллере!
        )
        .addCookieAuth('authCookie', {
            type: 'http',
            in: 'header',
            scheme: 'bearer',
        })
        // SAAS-001-12: Global header for multi-tenant isolation
        .addApiKey(
            {
                type: 'apiKey',
                name: 'x-tenant-id',
                in: 'header',
                description:
                    'Tenant ID for multi-tenant data isolation. Required for production. Defaults to 1 if not provided.',
            },
            'tenant-header',
        )
        .build();

    const document = SwaggerModule.createDocument(app, config, {
        include: [ControllersModule, HealthModule],
        deepScanRoutes: true, // Глубокое сканирование маршрутов
    });
    SwaggerModule.setup('/online-store/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true, // Сохранять авторизацию при обновлении страницы
            tagsSorter: 'alpha', // Сортировка тегов по алфавиту
            operationsSorter: 'alpha', // Сортировка операций по алфавиту
        },
    });
}
