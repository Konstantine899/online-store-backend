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
    RoleAutoRenewalConfigModel,
    RoleModel,
    RolePermissionModel,
    TenantModel,
    UserAddressModel,
    UserModel,
    UserRoleModel,
} from '@app/domain/models';
import { TenantContext } from '@app/infrastructure/common/context';
import { RedisModule } from '@app/infrastructure/config/redis/redis.module';
import { CacheService } from '@app/infrastructure/services/cache/cache.service';
import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ServicesModule } from '../services/services.module';
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
import { UserBulkRepository } from './user/user-bulk.repository';
import { UserSearchRepository } from './user/user-search.repository';
import { UserStatsRepository } from './user/user-stats.repository';
import { UserRepository } from './user/user.repository';

@Module({
    imports: [
        RedisModule, // Redis кэширование
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
            RolePermissionModel,
            UserModel,
            UserRoleModel,
            RoleAutoRenewalConfigModel,
            RefreshTokenModel,
            UserAddressModel,
            LoginHistoryModel,
            PasswordResetTokenModel,
        ]),
        forwardRef(() => ServicesModule),
    ],
    providers: [
        TenantContext,
        CacheService, // Сервис для работы с Redis кэшем
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
        UserSearchRepository, // Специализированный репозиторий для поиска пользователей
        UserStatsRepository, // Специализированный репозиторий для статистики пользователей
        UserBulkRepository, // Специализированный репозиторий для bulk операций
        UserAddressRepository,
        LoginHistoryRepository,
        PasswordResetTokenRepository,
    ],
    exports: [
        TenantContext,
        CacheService, // Экспортируем для использования в других модулях
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
        UserSearchRepository, // Экспортируем для использования в тестах
        UserStatsRepository, // Экспортируем для использования в тестах
        UserBulkRepository, // Экспортируем для использования в тестах
        UserAddressRepository,
        LoginHistoryRepository,
        PasswordResetTokenRepository,
    ],
})
export class RepositoriesModule {}
