import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CartModel } from './cart.model';
import { CartProductModel } from './cart-product.model';
import { ProductModel } from '../product/product.model';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';

@Module({
  imports: [
	SequelizeModule.forFeature([CartModel, ProductModel, CartProductModel]),
  ],
  providers: [CartService, CartRepository],
  controllers: [CartController],
})
export class CartModule {}
