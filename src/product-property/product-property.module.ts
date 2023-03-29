import { Module } from '@nestjs/common';
import { ProductPropertyService } from './product-property.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductPropertyModel } from './product-property.model';
import { ProductModel } from '../product/product.model';
import { ProductPropertyController } from './product-property.controller';

@Module({
  imports: [SequelizeModule.forFeature([ProductPropertyModel, ProductModel])],
  providers: [ProductPropertyService],
  controllers: [ProductPropertyController],
})
export class ProductPropertyModule {}
