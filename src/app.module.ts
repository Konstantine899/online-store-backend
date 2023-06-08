import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './product/product.module';
import * as process from 'process';
import { FileModule } from './file/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CategoryModule } from './category/category.module';
import * as path from 'path';
import { BrandModule } from './brand/brand.module';
import { ProductPropertyModule } from './product-property/product-property.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { AuthModule } from './auth/auth.module';
import { TokenModule } from './token/token.module';
import { CartModule } from './cart/cart.module';
import { RatingModule } from './rating/rating.module';
import { OrderModule } from './order/order.module';
import { OrderItemModule } from './order-item/order-item.module';
import { PaymentModule } from './payment/payment.module';
import { SequelizeConfigService } from './config/sequelize/sequelize.config.service';
import { databaseConfig } from './config/sequelize/config';

@Module({
  imports: [
	ServeStaticModule.forRoot({ rootPath: path.resolve(__dirname, 'static') }),

	SequelizeModule.forRootAsync({
		imports: [ConfigModule],
		useClass: SequelizeConfigService,
	}),
	ConfigModule.forRoot({
		envFilePath: `.${process.env.NODE_ENV}.env`,
		load: [databaseConfig],
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
	CartModule,
	RatingModule,
	OrderModule,
	OrderItemModule,
	PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
