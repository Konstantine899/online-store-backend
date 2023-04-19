import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function swaggerConfig(app: INestApplication): void {
  const config = new DocumentBuilder()
	.setTitle(`online-store-backend`)
	.setDescription(`Документация REST API`)
	.addTag(`Автор: Атрощенко Константин`)
	.setVersion(`1.0.0`)
	.build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`/online-store/docs`, app, document);
}
