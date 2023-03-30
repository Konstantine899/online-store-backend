import { Module } from '@nestjs/common';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { BrandModel } from './brand.model';
import { ProductModel } from '../product/product.model';
import { BrandRepository } from './brand.repository';

@Module({
  imports: [SequelizeModule.forFeature([BrandModel, ProductModel])],
  controllers: [BrandController],
  providers: [BrandService, BrandRepository],
})
export class BrandModule {}
