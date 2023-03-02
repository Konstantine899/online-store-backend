import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';
import { CustomValidationPipe } from './pipes/custom-validation-pipe';

async function bootstrap() {
  const PORT = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('online-store');
  app.useGlobalPipes(...[new CustomValidationPipe()]);
  await app.listen(PORT, () => console.log(`Server started on port = ${PORT}`));
}

bootstrap();
