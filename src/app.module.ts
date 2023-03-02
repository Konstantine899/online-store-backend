import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './product/product.module';
import * as process from 'process';
import { ProductModel } from './product/product.model';
import { FileModule } from './file/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

@Module({
  imports: [
	ServeStaticModule.forRoot({ rootPath: path.resolve(__dirname, 'static') }),
	ConfigModule.forRoot({ envFilePath: `.${process.env.NODE_ENV}.env` }),
	SequelizeModule.forRoot({
		dialect: 'mysql',
		host: 'localhost',
		port: 3306,
		username: 'Konstantine899',
		password: '4343',
		database: 'online-store',
		models: [ProductModel],
		autoLoadModels: true, // автоматическая загрузка моделей
	}),
	ProductModule,
	FileModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
