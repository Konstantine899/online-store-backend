import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { CategoryModel } from './category-model';
import { ProductModel } from '../product/product.model';
import { CategoryRepository } from './category.repository';

@Module({
  imports: [SequelizeModule.forFeature([CategoryModel, ProductModel])],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
