import {
    BrandModel,
    CartModel,
    CartProductModel,
    CategoryModel,
    NotificationModel,
    NotificationTemplateModel,
    OrderItemModel,
    OrderModel,
    ProductModel,
    ProductPropertyModel,
    RatingModel,
    RefreshTokenModel,
    RoleModel,
    UserAddressModel,
    UserModel,
    UserRoleModel,
} from '@app/domain/models';
import { dbToken } from '@app/infrastructure/config/sequelize/db-token';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    SequelizeModuleOptions,
    SequelizeOptionsFactory,
} from '@nestjs/sequelize';

@Injectable()
export class SequelizeConfigService implements SequelizeOptionsFactory {
    constructor(private readonly configService: ConfigService) {}

    createSequelizeOptions(): SequelizeModuleOptions {
        const {
            sql: { dialect, host, port, username, password, database, logging },
        } = this.configService.get(dbToken);

        return {
            dialect,
            host,
            port,
            username,
            password,
            database,
            logging, // Используем настройку из ENV переменной SQL_LOGGING
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
                UserAddressModel,
                NotificationModel,
                NotificationTemplateModel,
            ],
            autoLoadModels: true,
            synchronize: false, // отключаю автосинхронизацию

            define: {
                charset: 'utf8mb4',
                collate: 'utf8mb4_0900_ai_ci',
            },
        };
    }
}
