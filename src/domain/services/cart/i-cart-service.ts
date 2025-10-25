import type { CartModel } from '@app/domain/models';
import type {
    AppendToCartResponse,
    CartResponse,
    ClearCartResponse,
    DecrementResponse,
    IncrementResponse,
    RemoveProductFromCartResponse,
} from '@app/infrastructure/responses';
import type { Request, Response } from 'express';

export interface ICartAnalytics {
    totalCarts: number; // Всего корзин
    activeCarts: number; // Активные
    abandonedCarts: number; // Брошенные
    convertedCarts: number; // Конвертированные в заказы
    expiredCarts: number; // Истёкшие
    averageCartValue: number; // Средний чек
    averageItemsCount: number; // Среднее кол-во товаров
    guestCarts: number; // Гостевые корзины
    authenticatedCarts: number; // Авторизованные
    guestToAuthRate: number; // % конверсии guest → auth
    cartToOrderRate: number; // % конверсии корзина → заказ
    topProducts: Array<{
        // Топ товаров в корзинах
        productId: number;
        name: string;
        count: number;
    }>;
    promoCodeUsage: {
        // Статистика промокодов
        totalUsed: number;
        averageDiscount: number;
    };
}

export interface ICartService {
    // Базовые операции с корзиной
    getCart(request: Request, response: Response): Promise<CartResponse>;

    appendToCart(
        request: Request,
        response: Response,
        productId: number,
        quantity: number,
    ): Promise<AppendToCartResponse>;

    increment(
        request: Request,
        response: Response,
        productId: number,
        quantity: number,
    ): Promise<IncrementResponse>;

    decrement(
        request: Request,
        response: Response,
        productId: number,
        quantity: number,
    ): Promise<DecrementResponse>;

    removeProductFromCart(
        request: Request,
        response: Response,
        productId: number,
    ): Promise<RemoveProductFromCartResponse>;

    clearCart(request: Request, response: Response): Promise<ClearCartResponse>;

    // Промокоды
    applyPromoCode(
        request: Request,
        response: Response,
        code: string,
        discount: number,
    ): Promise<CartResponse>;

    removePromoCode(
        request: Request,
        response: Response,
    ): Promise<CartResponse>;

    // Конвертация гостевой корзины
    convertGuestCart(
        userId: number,
        sessionId: string,
    ): Promise<CartModel | null>;

    // Аналитика и автоматизация
    getAbandonedCarts(days?: number): Promise<CartModel[]>;
    getExpiringSoonCarts(days?: number): Promise<CartModel[]>;
    cleanupExpiredCarts(): Promise<number>;
    getCartAnalytics(tenantId?: number): Promise<ICartAnalytics>;
}
