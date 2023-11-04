import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BrandRepository } from './brand/brand.repository';
import { CartRepository } from './cart/cart.repository';
import { CategoryRepository } from './category/category.repository';
import {
    RatingModel,
    CategoryModel,
    CartProductModel,
    CartModel,
    ProductModel,
    ProductPropertyModel,
    BrandModel,
    OrderModel,
    OrderItemModel,
    RoleModel,
    UserModel,
    UserRoleModel,
    RefreshTokenModel,
} from '@app/domain/models';
import { ProductRepository } from './product/product.repository';
import { ProductPropertyRepository } from './product-property/product-property.repository';
import { OrderRepository } from './order/order.repository';
import { OrderItemRepository } from './order-item/order-item-repository';
import { RatingRepository } from './rating/rating.repository';
import { RoleRepository } from './role/role.repository';
import { RefreshTokenRepository } from './refresh-token/refresh-token.repository';
import { UserRepository } from './user/user.repository';

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
            OrderModel,
            OrderItemModel,
            RoleModel,
            UserModel,
            UserRoleModel,
            RefreshTokenModel,
        ]),
    ],
    providers: [
        BrandRepository,
        CartRepository,
        CategoryRepository,
        ProductRepository,
        ProductPropertyRepository,
        OrderRepository,
        OrderItemRepository,
        RatingRepository,
        RoleRepository,
        RefreshTokenRepository,
        UserRepository,
    ],
    exports: [
        BrandRepository,
        CartRepository,
        CategoryRepository,
        ProductRepository,
        ProductPropertyRepository,
        OrderRepository,
        OrderItemRepository,
        RatingRepository,
        RoleRepository,
        RefreshTokenRepository,
        UserRepository,
    ],
})
export class RepositoriesModule {}
