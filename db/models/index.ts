import * as process from 'process';
import { Sequelize } from 'sequelize';
import config from '../config/database';

// Import all models
import Brand from './brand';
import Cart from './cart';
import CartProduct from './cart-product';
import Category from './category';
import LoginHistory from './login-history';
import Order from './order';
import OrderItem from './order-item';
import PasswordResetToken from './password-reset-token';
import Product from './product';
import ProductProperty from './product-property';
import PromoCode from './promo-code';
import Rating from './rating';
import RefreshToken from './refresh-token';
import Role from './role';
import Tenant from './tenant';
import User from './user';
import UserAddress from './user-address';
import UserRole from './user-role';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env as keyof typeof config];

interface Database {
    sequelize: Sequelize;
    Sequelize: typeof Sequelize;
    tenant: ReturnType<typeof Tenant>;
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
    passwordResetToken: ReturnType<typeof PasswordResetToken>;
    promoCode: ReturnType<typeof PromoCode>;
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
db.tenant = Tenant(sequelize);
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
db.passwordResetToken = PasswordResetToken(sequelize);
db.promoCode = PromoCode(sequelize);

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
