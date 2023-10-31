import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './modules/product/product.module';
import * as process from 'process';
import { FileModule } from './modules/file/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CategoryModule } from './modules/category/category.module';
import * as path from 'path';
import { ProductPropertyModule } from './modules/product-property/product-property.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { TokenModule } from './modules/token/token.module';
import { CartModule } from './modules/cart/cart.module';
import { RatingModule } from './modules/rating/rating.module';
import { OrderModule } from './modules/order/order.module';
import { OrderItemModule } from './modules/order-item/order-item.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SequelizeConfigService } from '../config/sequelize/config/sequelize.config.service';
import { databaseConfig } from '../config/sequelize/config/config';
import { ControllersModule } from './infrastructure/controllers/controllers.module';
import { ServicesModule } from './infrastructure/services/services.module';
import { RepositoriesModule } from './infrastructure/repositories/repositories.module';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: path.resolve(__dirname, 'static'),
        }),

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
        ProductPropertyModule,
        UserModule,
        RoleModule,
        TokenModule,
        CartModule,
        RatingModule,
        OrderModule,
        OrderItemModule,
        PaymentModule,
        ControllersModule,
        ServicesModule,
        RepositoriesModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
