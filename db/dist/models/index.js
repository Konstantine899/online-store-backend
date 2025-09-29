"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const process = __importStar(require("process"));
const database_1 = __importDefault(require("../config/database"));
const user_1 = __importDefault(require("./user"));
const role_1 = __importDefault(require("./role"));
const category_1 = __importDefault(require("./category"));
const brand_1 = __importDefault(require("./brand"));
const product_1 = __importDefault(require("./product"));
const rating_1 = __importDefault(require("./rating"));
const product_property_1 = __importDefault(require("./product-property"));
const order_1 = __importDefault(require("./order"));
const order_item_1 = __importDefault(require("./order-item"));
const cart_1 = __importDefault(require("./cart"));
const cart_product_1 = __importDefault(require("./cart-product"));
const user_role_1 = __importDefault(require("./user-role"));
const refresh_token_1 = __importDefault(require("./refresh-token"));
const env = process.env.NODE_ENV || 'development';
const dbConfig = database_1.default[env];
const db = {};
let sequelize;
if (dbConfig.use_env_variable) {
    sequelize = new sequelize_1.Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
}
else {
    sequelize = new sequelize_1.Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
}
db.user = (0, user_1.default)(sequelize);
db.role = (0, role_1.default)(sequelize);
db.category = (0, category_1.default)(sequelize);
db.brand = (0, brand_1.default)(sequelize);
db.product = (0, product_1.default)(sequelize);
db.rating = (0, rating_1.default)(sequelize);
db.property = (0, product_property_1.default)(sequelize);
db.order = (0, order_1.default)(sequelize);
db.item = (0, order_item_1.default)(sequelize);
db.cart = (0, cart_1.default)(sequelize);
db.cartProduct = (0, cart_product_1.default)(sequelize);
db.userRole = (0, user_role_1.default)(sequelize);
db.refreshToken = (0, refresh_token_1.default)(sequelize);
Object.keys(db).forEach((modelName) => {
    if (db[modelName] &&
        typeof db[modelName] === 'function') {
        const model = db[modelName];
        if (model.associate) {
            model.associate(db);
        }
    }
});
db.sequelize = sequelize;
db.Sequelize = sequelize_1.Sequelize;
exports.default = db;
module.exports = db;
