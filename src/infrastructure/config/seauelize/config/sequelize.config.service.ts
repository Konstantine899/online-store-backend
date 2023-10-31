import {
    SequelizeModuleOptions,
    SequelizeOptionsFactory,
} from '@nestjs/sequelize';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductModel } from '../../../../modules/product/product.model';
import { CategoryModel } from '../../../../domain/models/category-model';
import { BrandModel } from '../../../../domain/models/brand.model';
import { ProductPropertyModel } from '../../../../modules/product-property/product-property.model';
import { UserModel } from '../../../../modules/user/user.model';
import { RoleModel } from '../../../../modules/role/role.model';
import { UserRoleModel } from '../../../../modules/role/user-role.model';
import { RefreshTokenModel } from '../../../../modules/token/refresh-token.model';
import { CartModel } from '../../../../domain/models/cart.model';
import { CartProductModel } from '../../../../domain/models/cart-product.model';
import { RatingModel } from '../../../../modules/rating/rating.model';
import { OrderModel } from '../../../../modules/order/order.model';
import { OrderItemModel } from '../../../../modules/order-item/order-item.model';

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
