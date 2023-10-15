import {
    SequelizeModuleOptions,
    SequelizeOptionsFactory,
} from '@nestjs/sequelize';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductModel } from '../../../src/modules/product/product.model';
import { CategoryModel } from '../../../src/modules/category/category-model';
import { BrandModel } from '../../../src/modules/brand/brand.model';
import { ProductPropertyModel } from '../../../src/modules/product-property/product-property.model';
import { UserModel } from '../../../src/modules/user/user.model';
import { RoleModel } from '../../../src/modules/role/role.model';
import { UserRoleModel } from '../../../src/modules/role/user-role.model';
import { RefreshTokenModel } from '../../../src/modules/token/refresh-token.model';
import { CartModel } from '../../../src/modules/cart/cart.model';
import { CartProductModel } from '../../../src/modules/cart/cart-product.model';
import { RatingModel } from '../../../src/modules/rating/rating.model';
import { OrderModel } from '../../../src/modules/order/order.model';
import { OrderItemModel } from '../../../src/modules/order-item/order-item.model';

@Injectable()
export class SequelizeConfigService implements SequelizeOptionsFactory {
    constructor(private readonly configService: ConfigService) {}

    createSequelizeOptions(): SequelizeModuleOptions {
        const {
            sql: { dialect, host, port, username, password, database },
        } = this.configService.get('online-store');

        return {
            dialect,
            host,
            port,
            username,
            password,
            database,
            models: [
                ProductModel,
                CategoryModel,
                BrandModel,
                ProductPropertyModel,
                UserModel,
                RoleModel,
                UserRoleModel,
                RefreshTokenModel,
                CartModel,
                CartProductModel,
                RatingModel,
                OrderModel,
                OrderItemModel,
            ],
            autoLoadModels: true,
            synchronize: true,

            define: {
                charset: 'utf8mb4',
                collate: 'utf8mb4_0900_ai_ci',
            },
        };
    }
}
