import { SequelizeModuleAsyncOptions } from '@nestjs/sequelize';
import { Dialect } from 'sequelize';
import { ProductModel } from '../product/product.model';
import { CategoryModel } from '../category/category-model';
import { BrandModel } from '../brand/brand.model';
import { ProductPropertyModel } from '../product-property/product-property.model';
import { UserModel } from '../user/user.model';
import { RoleModel } from '../role/role.model';
import { UserRoleModel } from '../role/user-role.model';
import { RefreshTokenModel } from '../token/refresh-token.model';
import * as process from 'process';
import { CartModel } from '../cart/cart.model';
import { CartProductModel } from '../cart/cart-product.model';
import { RatingModel } from '../rating/rating.model';
import { OrderModel } from '../order/order.model';
import { OrderItemModel } from '../order-item/order-item.model';

export const sequelizeConfig: SequelizeModuleAsyncOptions = {
  useFactory: () => {
	return {
		dialect: <Dialect>process.env.DIALECT,
		host: process.env.MYSQL_HOST,
		port: Number(process.env.MYSQL_PORT),
		username: process.env.MYSQL_USER,
		password: process.env.MYSQL_PASSWORD,
		database: process.env.MYSQL_DATABASE,
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
		autoLoadModels: true, // автоматическая загрузка моделей
	};
  },
};
