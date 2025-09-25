/**
 * Database table names constants
 */
export const TABLE_NAMES = {
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
} as const;

/**
 * Database foreign key column names constants
 */
export const FOREIGN_KEYS = {
    BRAND_ID: 'brand_id',
    CATEGORY_ID: 'category_id',
    PRODUCT_ID: 'product_id',
    USER_ID: 'user_id',
    ORDER_ID: 'order_id',
    CART_ID: 'cart_id',
} as const;

// Backward compatibility exports
export const {
    PRODUCT,
    PRODUCT_PROPERTY,
    RATING,
    ORDER,
    ORDER_ITEM,
    CART_PRODUCT,
    USER,
    USER_ROLE,
    ROLE,
    BRAND,
    CATEGORY,
    CART,
    REFRESH_TOKEN,
} = TABLE_NAMES;

export const { BRAND_ID, CATEGORY_ID, PRODUCT_ID, USER_ID, ORDER_ID, CART_ID } =
    FOREIGN_KEYS;

// CommonJS export for backward compatibility
module.exports = {
    ...TABLE_NAMES,
    ...FOREIGN_KEYS,
};
