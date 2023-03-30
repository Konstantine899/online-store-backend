import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductModel } from './product.model';
import { FileModule } from '../file/file.module';
import { CategoryModel } from '../category/category-model';
import { BrandModel } from '../brand/brand.model';
import { ProductPropertyModel } from '../product-property/product-property.model';
import { ProductRepository } from './product.repository';

@Module({
  imports: [
	SequelizeModule.forFeature([
		ProductModel,
		CategoryModel,
		BrandModel,
		ProductPropertyModel,
	]),
	FileModule,
  ],
  providers: [ProductService, ProductRepository],
  controllers: [ProductController],
  exports: [ProductService, ProductRepository],
})
export class ProductModule {}
