import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BrandModel } from '../../domain/models/brand.model';
import { ProductModel } from '../../domain/models/product.model';
import { BrandRepository } from './brand/brand.repository';
import { CartModel } from '../../domain/models/cart.model';
import { CartProductModel } from '../../domain/models/cart-product.model';
import { CartRepository } from './cart/cart.repository';
import { CategoryModel } from '../../domain/models/category-model';
import { CategoryRepository } from './category/category.repository';
import { ProductPropertyModel } from '../../domain/models/product-property.model';
import { RatingModel } from '../../modules/rating/rating.model';
import { ProductRepository } from './product/product.repository';
import { ProductPropertyRepository } from './product-property/product-property.repository';

@Module({
    imports: [
        SequelizeModule.forFeature([
            ProductModel,
            CartModel,
            CartProductModel,
            CategoryModel,
            BrandModel,
            ProductPropertyModel,
            RatingModel,
        ]),
    ],
    providers: [
        BrandRepository,
        CartRepository,
        CategoryRepository,
        ProductRepository,
        ProductPropertyRepository,
    ],
    exports: [
        BrandRepository,
        CartRepository,
        CategoryRepository,
        ProductRepository,
        ProductPropertyRepository,
    ],
})
export class RepositoriesModule {}
