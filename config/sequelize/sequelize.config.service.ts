import {
    SequelizeModuleOptions,
    SequelizeOptionsFactory,
} from '@nestjs/sequelize';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductModel } from '../../src/product/product.model';
import { CategoryModel } from '../../src/category/category-model';
import { BrandModel } from '../../src/brand/brand.model';
import { ProductPropertyModel } from '../../src/product-property/product-property.model';
import { UserModel } from '../../src/user/user.model';
import { RoleModel } from '../../src/role/role.model';
import { UserRoleModel } from '../../src/role/user-role.model';
import { RefreshTokenModel } from '../../src/token/refresh-token.model';
import { CartModel } from '../../src/cart/cart.model';
import { CartProductModel } from '../../src/cart/cart-product.model';
import { RatingModel } from '../../src/rating/rating.model';
import { OrderModel } from '../../src/order/order.model';
import { OrderItemModel } from '../../src/order-item/order-item.model';

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
