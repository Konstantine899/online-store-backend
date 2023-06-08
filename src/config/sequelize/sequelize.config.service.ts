import {
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from '@nestjs/sequelize';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductModel } from '../../product/product.model';
import { CategoryModel } from '../../category/category-model';
import { BrandModel } from '../../brand/brand.model';
import { ProductPropertyModel } from '../../product-property/product-property.model';
import { UserModel } from '../../user/user.model';
import { RoleModel } from '../../role/role.model';
import { UserRoleModel } from '../../role/user-role.model';
import { RefreshTokenModel } from '../../token/refresh-token.model';
import { CartModel } from '../../cart/cart.model';
import { CartProductModel } from '../../cart/cart-product.model';
import { RatingModel } from '../../rating/rating.model';
import { OrderModel } from '../../order/order.model';
import { OrderItemModel } from '../../order-item/order-item.model';

@Injectable()
export class SequelizeConfigService implements SequelizeOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createSequelizeOptions(): SequelizeModuleOptions {
	const {
		sql: { dialect, host, port, username, password, database },
	} = this.configService.get(`online-store`);

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
