import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BasketModel } from './basket.model';
import { BasketProductModel } from './basket-product.model';
import { ProductModel } from '../product/product.model';

@Module({
  imports: [
	SequelizeModule.forFeature([BasketModel, ProductModel, BasketProductModel]),
  ],
})
export class BasketModule {}
