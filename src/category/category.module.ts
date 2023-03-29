import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { CategoryModel } from './category-model';
import { ProductModel } from '../product/product.model';

@Module({
  imports: [SequelizeModule.forFeature([CategoryModel, ProductModel])],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
