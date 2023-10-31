import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

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
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/online-store/docs', app, document);
}
