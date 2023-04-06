import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BasketModel } from './basket.model';
import { BasketProductModel } from './basket-product.model';
import { ProductModel } from '../product/product.model';
import { BasketController } from './basket.controller';
import { BasketService } from './basket.service';
import { BasketRepository } from './basket.repository';

@Module({
  imports: [
	SequelizeModule.forFeature([BasketModel, ProductModel, BasketProductModel]),
  ],
  providers: [BasketService, BasketRepository],
  controllers: [BasketController],
})
export class BasketModule {}
