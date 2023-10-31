import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BrandModel } from '../../domain/models/brand.model';
import { ProductModel } from '../../modules/product/product.model';
import { BrandRepository } from './brand/brand.repository';
import { CartModel } from '../../domain/models/cart.model';
import { CartProductModel } from '../../domain/models/cart-product.model';
import { CartRepository } from './cart/cart.repository';

@Module({
    imports: [
        SequelizeModule.forFeature([
            BrandModel,
            ProductModel,
            CartModel,
            ProductModel,
            CartProductModel,
        ]),
    ],
    providers: [BrandRepository, CartRepository],
    exports: [BrandRepository, CartRepository],
})
export class RepositoriesModule {}
