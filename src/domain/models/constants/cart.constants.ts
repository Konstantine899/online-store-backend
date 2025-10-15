/**
 * Константы для работы с корзиной
 */
export const CART_CONSTANTS = {
    /**
     * Максимальное количество одного товара в корзине
     */
    MAX_ITEM_QUANTITY: 999,

    /**
     * Минимальное количество одного товара в корзине
     */
    MIN_ITEM_QUANTITY: 1,

    /**
     * Время истечения корзины по умолчанию (дни)
     */
    DEFAULT_EXPIRATION_DAYS: 30,

    /**
     * Количество дней для определения "скоро истекает"
     */
    DEFAULT_EXPIRING_SOON_DAYS: 7,

    /**
     * Количество дней неактивности для брошенной корзины
     */
    DEFAULT_ABANDONED_DAYS: 7,
} as const;

/**
 * Допустимые статусы корзины
 */
export const CART_STATUS = {
    ACTIVE: 'active',
    ABANDONED: 'abandoned',
    CONVERTED: 'converted',
    EXPIRED: 'expired',
} as const;

export type CartStatus = (typeof CART_STATUS)[keyof typeof CART_STATUS];
