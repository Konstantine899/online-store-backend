import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';
import { CustomValidationPipe } from './pipes/custom-validation-pipe';
import { SequelizeUniqueConstraintExceptionFilter } from './exceptions/sequelize-unique-constraint.exception.filter';
import { CustomNotFoundExceptionFilter } from './exceptions/custom-not-found.exception.filter';
import { SequelizeDatabaseErrorExceptionFilter } from './exceptions/sequelize-database-error.exception.filter';
import * as cookieParser from 'cookie-parser';
import { swaggerConfig } from './config/swagger.config';

async function bootstrap() {
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule, { cors: true });
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
	origin: [
		`http://localhost:5000/online-store`,
		`http://localhost:3000/online-store`,
	],
  });
  app.use(cookieParser(process.env.COOKIE_PARSER_SECRET_KEY));
  swaggerConfig(app);
  await app.listen(PORT, () => console.log(`Server started on port = ${PORT}`));
}

bootstrap();
