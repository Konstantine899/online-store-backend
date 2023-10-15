import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CartModel } from './cart.model';
import { CartProductModel } from './cart-product.model';
import { ProductModel } from '../product/product.model';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { ProductModule } from '../product/product.module';

@Module({
    imports: [
        SequelizeModule.forFeature([CartModel, ProductModel, CartProductModel]),
        ProductModule,
    ],
    providers: [CartService, CartRepository],
    controllers: [CartController],
    exports: [CartRepository],
})
export class CartModule {}
