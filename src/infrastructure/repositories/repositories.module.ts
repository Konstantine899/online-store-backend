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
import { RatingModel } from '../../domain/models/rating.model';
import { ProductRepository } from './product/product.repository';
import { ProductPropertyRepository } from './product-property/product-property.repository';
import { OrderModel } from '../../domain/models/order.model';
import { OrderRepository } from './order/order.repository';
import { OrderItemModel } from '../../domain/models/order-item.model';
import { OrderItemRepository } from './order-item/order-item-repository';
import { RatingRepository } from './rating/rating.repository';
import { RoleModel } from '../../domain/models/role.model';
import { UserModel } from '../../domain/models/user.model';
import { UserRoleModel } from '../../domain/models/user-role.model';
import { RoleRepository } from './role/role.repository';
import { RefreshTokenModel } from '../../domain/models/refresh-token.model';
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
