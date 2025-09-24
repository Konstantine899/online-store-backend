import * as fs from 'fs';
import * as path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import * as process from 'process';
import config from '../config/database';

// Import all model types
import {
  UserModel,
  RoleModel,
  CategoryModel,
  BrandModel,
  ProductModel,
  RatingModel,
  ProductPropertyModel,
  OrderModel,
  OrderItemModel,
  CartModel,
  CartProductModel,
  UserRoleModel,
  RefreshTokenModel,
} from './types';

// Import all models
import User from './user';
import Role from './role';
import Category from './category';
import Brand from './brand';
import Product from './product';
import Rating from './rating';
import ProductProperty from './product-property';
import Order from './order';
import OrderItem from './order-item';
import Cart from './cart';
import CartProduct from './cart-product';
import UserRole from './user-role';
import RefreshToken from './refresh-token';

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

interface Database {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  user: typeof User;
  role: typeof Role;
  category: typeof Category;
  brand: typeof Brand;
  product: typeof Product;
  rating: typeof Rating;
  property: typeof ProductProperty;
  order: typeof Order;
  item: typeof OrderItem;
  cart: typeof Cart;
  cartProduct: typeof CartProduct;
  userRole: typeof UserRole;
  refreshToken: typeof RefreshToken;
}

const db: Database = {} as Database;

let sequelize: Sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable] as string, dbConfig);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig,
  );
}

// Initialize all models
db.user = User(sequelize, DataTypes);
db.role = Role(sequelize, DataTypes);
db.category = Category(sequelize, DataTypes);
db.brand = Brand(sequelize, DataTypes);
db.product = Product(sequelize, DataTypes);
db.rating = Rating(sequelize, DataTypes);
db.property = ProductProperty(sequelize, DataTypes);
db.order = Order(sequelize, DataTypes);
db.item = OrderItem(sequelize, DataTypes);
db.cart = Cart(sequelize, DataTypes);
db.cartProduct = CartProduct(sequelize, DataTypes);
db.userRole = UserRole(sequelize, DataTypes);
db.refreshToken = RefreshToken(sequelize, DataTypes);

// Set up associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName as keyof Database] && typeof db[modelName as keyof Database] === 'function') {
    const model = db[modelName as keyof Database] as any;
    if (model.associate) {
      model.associate(db);
    }
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;

// CommonJS export for backward compatibility
module.exports = db;
