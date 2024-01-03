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

async function bootstrap(): Promise<void> {
    const PORT = process.env.PORT || 5000;
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('online-store');
    app.useGlobalPipes(...[new CustomValidationPipe()]);
    app.useGlobalFilters(
        ...[
            new SequelizeUniqueConstraintExceptionFilter(),
            new SequelizeDatabaseErrorExceptionFilter(),
            new CustomNotFoundExceptionFilter(),
        ],
    );
    app.enableCors({
        credentials: true,
        origin: ['http://localhost:3000/online-store/*'],
        allowedHeaders: ['Content-Type', 'Authorization'], // Настраивает заголовок CORS Access-Control-Allow-Headers.
        exposedHeaders: ['Content-Range', 'X-Content-Range'], // Настраивает заголовок CORS Access-Control-Expose-Headers
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    });
    app.use(cookieParser(process.env.COOKIE_PARSER_SECRET_KEY));
    swaggerConfig(app);
    await app.listen(PORT, () => {
        return console.log(`Server started on port = ${PORT}`);
    });
}

bootstrap();
