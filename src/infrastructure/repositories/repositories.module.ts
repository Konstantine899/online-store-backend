import {
    BrandModel,
    CartModel,
    CartProductModel,
    CategoryModel,
    LoginHistoryModel,
    OrderItemModel,
    OrderModel,
    PasswordResetTokenModel,
    ProductModel,
    ProductPropertyModel,
    PromoCodeModel,
    RatingModel,
    RefreshTokenModel,
    RoleModel,
    TenantModel,
    UserAddressModel,
    UserModel,
    UserRoleModel,
} from '@app/domain/models';
import { TenantContext } from '@app/infrastructure/common/context';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BrandRepository } from './brand/brand.repository';
import { CartRepository } from './cart/cart.repository';
import { CategoryRepository } from './category/category.repository';
import { LoginHistoryRepository } from './login-history/login-history.repository';
import { OrderItemRepository } from './order-item/order-item-repository';
import { OrderRepository } from './order/order.repository';
import { PasswordResetTokenRepository } from './password-reset-token/password-reset-token.repository';
import { ProductPropertyRepository } from './product-property/product-property.repository';
import { ProductRepository } from './product/product.repository';
import { PromoCodeRepository } from './promo-code/promo-code.repository';
import { RatingRepository } from './rating/rating.repository';
import { RefreshTokenRepository } from './refresh-token/refresh-token.repository';
import { RoleRepository } from './role/role.repository';
import { UserAddressRepository } from './user-address/user-address.repository';
import { UserRepository } from './user/user.repository';

@Module({
    imports: [
        SequelizeModule.forFeature([
            TenantModel,
            ProductModel,
            CartModel,
            CartProductModel,
            CategoryModel,
            BrandModel,
            ProductPropertyModel,
            PromoCodeModel,
            RatingModel,
            OrderModel,
            OrderItemModel,
            RoleModel,
            UserModel,
            UserRoleModel,
            RefreshTokenModel,
            UserAddressModel,
            LoginHistoryModel,
            PasswordResetTokenModel,
        ]),
    ],
    providers: [
        TenantContext,
        BrandRepository,
        CartRepository,
        CategoryRepository,
        ProductRepository,
        ProductPropertyRepository,
        PromoCodeRepository,
        OrderRepository,
        OrderItemRepository,
        RatingRepository,
        RoleRepository,
        RefreshTokenRepository,
        UserRepository,
        UserAddressRepository,
        LoginHistoryRepository,
        PasswordResetTokenRepository,
    ],
    exports: [
        TenantContext,
        BrandRepository,
        CartRepository,
        CategoryRepository,
        ProductRepository,
        ProductPropertyRepository,
        PromoCodeRepository,
        OrderRepository,
        OrderItemRepository,
        RatingRepository,
        RoleRepository,
        RefreshTokenRepository,
        UserRepository,
        UserAddressRepository,
        LoginHistoryRepository,
        PasswordResetTokenRepository,
    ],
})
export class RepositoriesModule {}
