import { Module } from '@nestjs/common';
import { ProductPropertyService } from './product-property.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductPropertyModel } from './product-property.model';
import { ProductModel } from '../product/product.model';
import { ProductPropertyController } from './product-property.controller';

@Module({
  providers: [ProductPropertyService],
  controllers: [ProductPropertyController],
  imports: [SequelizeModule.forFeature([ProductPropertyModel, ProductModel])],
})
export class ProductPropertyModule {}
