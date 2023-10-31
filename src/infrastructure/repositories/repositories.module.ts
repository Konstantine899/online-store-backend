import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BrandModel } from '../../domain/models/brand.model';
import { ProductModel } from '../../modules/product/product.model';
import { BrandRepository } from './brand/brand.repository';
import { CartModel } from '../../domain/models/cart.model';
import { CartProductModel } from '../../domain/models/cart-product.model';
import { CartRepository } from './cart/cart.repository';
import { CategoryModel } from '../../domain/models/category-model';
import { CategoryRepository } from './category/category.repository';

@Module({
    imports: [
        SequelizeModule.forFeature([
            BrandModel,
            ProductModel,
            CartModel,
            ProductModel,
            CartProductModel,
            CategoryModel,
            ProductModel,
        ]),
    ],
    providers: [BrandRepository, CartRepository, CategoryRepository],
    exports: [BrandRepository, CartRepository, CategoryRepository],
})
export class RepositoriesModule {}
