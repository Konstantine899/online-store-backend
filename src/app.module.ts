import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './product/product.module';
import * as process from 'process';
import { ProductModel } from './product/product.model';
import { FileModule } from './file/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CategoryModule } from './category/category.module';
import * as path from 'path';
import { CategoryModel } from './category/category-model';
import { BrandModule } from './brand/brand.module';
import { BrandModel } from './brand/brand.model';
import { ProductPropertyModule } from './product-property/product-property.module';
import { ProductPropertyModel } from './product-property/product-property.model';
import { UserModule } from './user/user.module';
import { UserModel } from './user/user.model';
import { RoleModule } from './role/role.module';
import { RoleModel } from './role/role.model';
import { UserRoleModel } from './role/user-role.model';
import { AuthModule } from './auth/auth.module';
import { TokenModule } from './token/token.module';

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
		models: [
		ProductModel,
		CategoryModel,
		BrandModel,
		ProductPropertyModel,
		UserModel,
		RoleModel,
		UserRoleModel,
		],
		autoLoadModels: true, // автоматическая загрузка моделей
	}),
	ProductModule,
	FileModule,
	CategoryModule,
	BrandModule,
	ProductPropertyModule,
	UserModule,
	RoleModule,
	AuthModule,
	TokenModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
