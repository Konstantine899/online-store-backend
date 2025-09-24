"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CART_ID = exports.ORDER_ID = exports.USER_ID = exports.PRODUCT_ID = exports.CATEGORY_ID = exports.BRAND_ID = exports.REFRESH_TOKEN = exports.CART = exports.CATEGORY = exports.BRAND = exports.ROLE = exports.USER_ROLE = exports.USER = exports.CART_PRODUCT = exports.ORDER_ITEM = exports.ORDER = exports.RATING = exports.PRODUCT_PROPERTY = exports.PRODUCT = exports.FOREIGN_KEYS = exports.TABLE_NAMES = void 0;
exports.TABLE_NAMES = {
    PRODUCT: 'product',
    PRODUCT_PROPERTY: 'product-property',
    RATING: 'rating',
    ORDER: 'order',
    ORDER_ITEM: 'order-item',
    CART_PRODUCT: 'cart-product',
    USER: 'user',
    USER_ROLE: 'user-role',
    ROLE: 'role',
    BRAND: 'brand',
    CATEGORY: 'category',
    CART: 'cart',
    REFRESH_TOKEN: 'refresh_token',
};
exports.FOREIGN_KEYS = {
    BRAND_ID: 'brand_id',
    CATEGORY_ID: 'category_id',
    PRODUCT_ID: 'product_id',
    USER_ID: 'user_id',
    ORDER_ID: 'order_id',
    CART_ID: 'cart_id',
};
exports.PRODUCT = exports.TABLE_NAMES.PRODUCT, exports.PRODUCT_PROPERTY = exports.TABLE_NAMES.PRODUCT_PROPERTY, exports.RATING = exports.TABLE_NAMES.RATING, exports.ORDER = exports.TABLE_NAMES.ORDER, exports.ORDER_ITEM = exports.TABLE_NAMES.ORDER_ITEM, exports.CART_PRODUCT = exports.TABLE_NAMES.CART_PRODUCT, exports.USER = exports.TABLE_NAMES.USER, exports.USER_ROLE = exports.TABLE_NAMES.USER_ROLE, exports.ROLE = exports.TABLE_NAMES.ROLE, exports.BRAND = exports.TABLE_NAMES.BRAND, exports.CATEGORY = exports.TABLE_NAMES.CATEGORY, exports.CART = exports.TABLE_NAMES.CART, exports.REFRESH_TOKEN = exports.TABLE_NAMES.REFRESH_TOKEN;
exports.BRAND_ID = exports.FOREIGN_KEYS.BRAND_ID, exports.CATEGORY_ID = exports.FOREIGN_KEYS.CATEGORY_ID, exports.PRODUCT_ID = exports.FOREIGN_KEYS.PRODUCT_ID, exports.USER_ID = exports.FOREIGN_KEYS.USER_ID, exports.ORDER_ID = exports.FOREIGN_KEYS.ORDER_ID, exports.CART_ID = exports.FOREIGN_KEYS.CART_ID;
module.exports = {
    ...exports.TABLE_NAMES,
    ...exports.FOREIGN_KEYS,
};
