import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductPropertyModel } from './product-property.model';
import { ProductModel } from '../product/product.model';
import { ProductPropertyController } from './product-property.controller';
import { ProductPropertyRepository } from './product-property.repository';
import { ProductPropertyService } from './product-property.service';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
	SequelizeModule.forFeature([ProductPropertyModel, ProductModel]),
	ProductModule,
  ],
  providers: [ProductPropertyRepository, ProductPropertyService],
  controllers: [ProductPropertyController],
})
export class ProductPropertyModule {}
