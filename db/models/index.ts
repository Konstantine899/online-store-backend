import { Sequelize } from 'sequelize';
import * as process from 'process';
import config from '../config/database';

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
import UserAddress from './user-address';
import LoginHistory from './login-history';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env as keyof typeof config];

interface Database {
    sequelize: Sequelize;
    Sequelize: typeof Sequelize;
    user: ReturnType<typeof User>;
    role: ReturnType<typeof Role>;
    category: ReturnType<typeof Category>;
    brand: ReturnType<typeof Brand>;
    product: ReturnType<typeof Product>;
    rating: ReturnType<typeof Rating>;
    property: ReturnType<typeof ProductProperty>;
    order: ReturnType<typeof Order>;
    item: ReturnType<typeof OrderItem>;
    cart: ReturnType<typeof Cart>;
    cartProduct: ReturnType<typeof CartProduct>;
    userRole: ReturnType<typeof UserRole>;
    refreshToken: ReturnType<typeof RefreshToken>;
    userAddress: ReturnType<typeof UserAddress>;
    loginHistory: ReturnType<typeof LoginHistory>;
}

const db: Database = {} as Database;

let sequelize: Sequelize;
if (dbConfig.use_env_variable) {
    sequelize = new Sequelize(
        process.env[dbConfig.use_env_variable] as string,
        dbConfig,
    );
} else {
    sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        dbConfig,
    );
}

// Initialize all models
db.user = User(sequelize);
db.role = Role(sequelize);
db.category = Category(sequelize);
db.brand = Brand(sequelize);
db.product = Product(sequelize);
db.rating = Rating(sequelize);
db.property = ProductProperty(sequelize);
db.order = Order(sequelize);
db.item = OrderItem(sequelize);
db.cart = Cart(sequelize);
db.cartProduct = CartProduct(sequelize);
db.userRole = UserRole(sequelize);
db.refreshToken = RefreshToken(sequelize);
db.userAddress = UserAddress(sequelize);
db.loginHistory = LoginHistory(sequelize);

// Set up associations
Object.keys(db).forEach((modelName) => {
    if (
        db[modelName as keyof Database] &&
        typeof db[modelName as keyof Database] === 'function'
    ) {
        const model = db[modelName as keyof Database] as any; // eslint-disable-line @typescript-eslint/no-explicit-any
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
