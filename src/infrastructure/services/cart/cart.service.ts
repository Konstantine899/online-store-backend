import { CartModel, CartProductModel, ProductModel } from '@app/domain/models';
import {
    CartRepository,
    ProductRepository,
} from '@app/infrastructure/repositories';
import {
    BadRequestException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { IDecodedAccessToken } from '@app/domain/jwt';
import {
    CART_CONSTANTS,
    CART_STATUS,
} from '@app/domain/models/constants/cart.constants';
import { ICartAnalytics, ICartService } from '@app/domain/services';
import { ICartProductItem, ICartTransformData } from '@app/domain/transform';
import { TenantContext } from '@app/infrastructure/common/context';
import {
    AppendToCartResponse,
    CartResponse,
    ClearCartResponse,
    DecrementResponse,
    IncrementResponse,
    RemoveProductFromCartResponse,
} from '@app/infrastructure/responses';
import { Op } from 'sequelize';

/**
 * CartService — сервис для работы с корзинами (SaaS-ready)
 *
 * Поддержка:
 * - Гостевые корзины (session-based, cookies)
 * - Авторизованные корзины (user_id from JWT)
 * - Промокоды (apply/remove)
 * - Price snapshot при добавлении товара
 * - Автоматический пересчёт сумм
 * - Конвертация гостевой корзины в авторизованную
 * - Аналитика (abandoned carts, expiring soon, cleanup)
 * - Tenant isolation (через TenantContext)
 */
@Injectable()
export class CartService implements ICartService {
    constructor(
        private readonly cartRepository: CartRepository,
        private readonly productRepository: ProductRepository,
        private readonly tenantContext: TenantContext,
    ) {}

    // Настройки cookies для cartId
    private readonly maxAge: number = 60 * 60 * 1000 * 24 * 365; // 1 год
    private readonly signed: boolean = true;

    // ==================== БАЗОВЫЕ ОПЕРАЦИИ С КОРЗИНОЙ ====================

    /**
     * Получить корзину текущего пользователя
     * (гостевую или авторизованную)
     */
    public async getCart(
        request: Request,
        response: Response,
    ): Promise<CartResponse> {
        const cart = await this.getOrCreateCart(request, response);
        return this.transformData(cart);
    }

    /**
     * Добавить товар в корзину
     * (с установкой price snapshot)
     */
    public async appendToCart(
        request: Request,
        response: Response,
        productId: number,
        quantity: number,
    ): Promise<AppendToCartResponse> {
        this.validateQuantity(quantity);
        const product = await this.findProduct(productId);
        const cart = await this.getOrCreateCart(request, response);

        // Проверка статуса корзины
        this.validateCartStatus(cart);

        // Используем транзакцию для атомарности операций
        const transaction = await CartModel.sequelize!.transaction();

        try {
            // Проверяем, есть ли уже товар в корзине
            const existingItem = await CartProductModel.findOne({
                where: {
                    cart_id: cart.id,
                    product_id: product.id,
                },
                transaction,
            });

            if (existingItem) {
                // Увеличиваем количество существующего товара
                const newQuantity = existingItem.quantity + quantity;
                this.validateQuantity(newQuantity);
                existingItem.quantity = newQuantity;
                await existingItem.save({ transaction });
            } else {
                // Добавляем новый товар с price snapshot
                await CartProductModel.create(
                    {
                        cart_id: cart.id,
                        product_id: product.id,
                        quantity,
                        price: product.price, // Price snapshot!
                    },
                    { transaction },
                );
            }

            // Автоматический пересчёт корзины
            await cart.recalculateTotal(transaction);

            // Обновляем expiration date при активности
            cart.setExpirationDate();
            await cart.save({ transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        await cart.reload();
        this.setCartCookie(response, cart.id);

        return this.transformData(cart);
    }

    /**
     * Увеличить количество товара в корзине
     */
    public async increment(
        request: Request,
        response: Response,
        productId: number,
        quantity: number,
    ): Promise<IncrementResponse> {
        this.validateQuantity(quantity);
        await this.findProduct(productId);
        const cart = await this.getOrCreateCart(request, response);

        this.validateCartStatus(cart);

        // Используем транзакцию для атомарности операций
        const transaction = await CartModel.sequelize!.transaction();

        try {
            const cartItem = await CartProductModel.findOne({
                where: {
                    cart_id: cart.id,
                    product_id: productId,
                },
                transaction,
            });

            if (!cartItem) {
                throw new NotFoundException({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: `Товар с id:${productId} не найден в корзине`,
                });
            }

            cartItem.incrementQuantity(quantity);
            await cartItem.save({ transaction });

            // Пересчёт происходит автоматически через hook @BeforeUpdate

            // Обновляем expiration date
            cart.setExpirationDate();
            await cart.save({ transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        await cart.reload();
        this.setCartCookie(response, cart.id);

        return this.transformData(cart);
    }

    /**
     * Уменьшить количество товара в корзине
     */
    public async decrement(
        request: Request,
        response: Response,
        productId: number,
        quantity: number,
    ): Promise<DecrementResponse> {
        this.validateQuantity(quantity);
        await this.findProduct(productId);
        const cart = await this.getOrCreateCart(request, response);

        this.validateCartStatus(cart);

        // Используем транзакцию для атомарности операций
        const transaction = await CartModel.sequelize!.transaction();

        try {
            const cartItem = await CartProductModel.findOne({
                where: {
                    cart_id: cart.id,
                    product_id: productId,
                },
                transaction,
            });

            if (!cartItem) {
                await transaction.commit();
                // Товара нет в корзине - просто возвращаем корзину
                return this.transformData(cart);
            }

            // Если количество станет меньше 1 - удаляем товар
            if (cartItem.quantity <= quantity) {
                await cartItem.destroy({ transaction });
            } else {
                cartItem.decrementQuantity(quantity);
                await cartItem.save({ transaction });
            }

            // Пересчёт происходит автоматически через hooks

            // Обновляем expiration date
            cart.setExpirationDate();
            await cart.save({ transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        await cart.reload();
        this.setCartCookie(response, cart.id);

        return this.transformData(cart);
    }

    /**
     * Удалить товар из корзины
     */
    public async removeProductFromCart(
        request: Request,
        response: Response,
        productId: number,
    ): Promise<RemoveProductFromCartResponse> {
        await this.findProduct(productId);
        const cart = await this.getOrCreateCart(request, response);

        this.validateCartStatus(cart);

        // Используем транзакцию для атомарности операций
        const transaction = await CartModel.sequelize!.transaction();

        try {
            const cartItem = await CartProductModel.findOne({
                where: {
                    cart_id: cart.id,
                    product_id: productId,
                },
                transaction,
            });

            if (cartItem) {
                await cartItem.destroy({ transaction });
                // Пересчёт через hook @BeforeDestroy
            }

            // Обновляем expiration date
            cart.setExpirationDate();
            await cart.save({ transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        await cart.reload();
        this.setCartCookie(response, cart.id);

        return this.transformData(cart);
    }

    /**
     * Очистить корзину (удалить все товары)
     */
    public async clearCart(
        request: Request,
        response: Response,
    ): Promise<ClearCartResponse> {
        const cart = await this.getOrCreateCart(request, response);

        this.validateCartStatus(cart);

        // Используем транзакцию для атомарности операций
        const transaction = await CartModel.sequelize!.transaction();

        try {
            await CartProductModel.destroy({
                where: { cart_id: cart.id },
                transaction,
            });

            await cart.recalculateTotal(transaction);

            // Обновляем expiration date
            cart.setExpirationDate();
            await cart.save({ transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        await cart.reload();
        this.setCartCookie(response, cart.id);

        return this.transformData(cart);
    }

    // ==================== ПРОМОКОДЫ ====================

    /**
     * Применить промокод к корзине
     * (пока mock валидация, SAAS-004-11 добавит таблицу promo_codes)
     */
    public async applyPromoCode(
        request: Request,
        response: Response,
        code: string,
    ): Promise<CartResponse> {
        const cart = await this.getOrCreateCart(request, response);

        this.validateCartStatus(cart);

        // TODO: SAAS-004-11 - получить discount из таблицы promo_codes
        // Пока используем mock-логику для валидации API
        const discount = 10; // Mock: 10% скидка

        // Применяем промокод
        await cart.applyPromoCode(code, discount);

        this.setCartCookie(response, cart.id);

        return this.transformData(cart);
    }

    /**
     * Удалить промокод из корзины
     */
    public async removePromoCode(
        request: Request,
        response: Response,
    ): Promise<CartResponse> {
        const cart = await this.getOrCreateCart(request, response);

        this.validateCartStatus(cart);

        await cart.removePromoCode();

        this.setCartCookie(response, cart.id);

        return this.transformData(cart);
    }

    // ==================== КОНВЕРТАЦИЯ ГОСТЕВОЙ КОРЗИНЫ ====================

    /**
     * Конвертировать гостевую корзину в авторизованную
     * (при логине/регистрации)
     *
     * Логика:
     * 1. Найти гостевую корзину по session_id
     * 2. Проверить, есть ли уже корзина у пользователя
     * 3. Если есть - слить корзины, удалить гостевую
     * 4. Если нет - конвертировать гостевую в пользовательскую
     */
    public async convertGuestCart(
        userId: number,
        sessionId: string,
    ): Promise<CartModel | null> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;

        // Находим гостевую корзину
        const guestCart = await CartModel.findOne({
            where: {
                tenant_id: tenantId,
                session_id: sessionId,
                status: CART_STATUS.ACTIVE,
            },
            include: [
                {
                    model: ProductModel,
                    through: { attributes: ['quantity', 'price'] },
                },
            ],
        });

        if (!guestCart) {
            return null; // Нет гостевой корзины
        }

        // Проверяем, есть ли уже корзина у пользователя
        const userCart = await CartModel.findOne({
            where: {
                tenant_id: tenantId,
                user_id: userId,
                status: CART_STATUS.ACTIVE,
            },
            include: [
                {
                    model: ProductModel,
                    through: { attributes: ['quantity', 'price'] },
                },
            ],
        });

        if (userCart) {
            // Сливаем гостевую корзину в пользовательскую
            await this.mergeGuestCartToUser(guestCart, userCart);
            await guestCart.destroy();
            return userCart;
        } else {
            // Конвертируем гостевую корзину в пользовательскую
            await guestCart.convertToAuthenticated(userId);
            return guestCart;
        }
    }

    // ==================== АНАЛИТИКА И АВТОМАТИЗАЦИЯ ====================

    /**
     * Получить брошенные корзины для ремаркетинга
     * (активные корзины с товарами, не обновлявшиеся N дней)
     */
    public async getAbandonedCarts(
        days: number = CART_CONSTANTS.DEFAULT_ABANDONED_DAYS,
    ): Promise<CartModel[]> {
        const tenantId = this.tenantContext.getTenantIdOrNull();
        return CartModel.findAbandonedCarts(days, tenantId || undefined);
    }

    /**
     * Получить корзины, истекающие скоро
     * (для напоминаний пользователям)
     */
    public async getExpiringSoonCarts(
        days: number = CART_CONSTANTS.DEFAULT_EXPIRING_SOON_DAYS,
    ): Promise<CartModel[]> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;

        return CartModel.scope({
            method: ['expiringSoon', days],
        }).findAll({
            where: { tenant_id: tenantId },
            include: [
                {
                    model: ProductModel,
                    through: { attributes: ['quantity', 'price'] },
                },
            ],
        });
    }

    /**
     * Очистить истёкшие корзины (для cron job)
     * Возвращает количество очищенных корзин
     */
    public async cleanupExpiredCarts(): Promise<number> {
        const tenantId = this.tenantContext.getTenantIdOrNull();
        return CartModel.cleanupExpiredCarts(tenantId || undefined);
    }

    /**
     * Получить аналитику по корзинам (для dashboard)
     */
    public async getCartAnalytics(tenantId?: number): Promise<ICartAnalytics> {
        const tid = tenantId || this.tenantContext.getTenantIdOrNull() || 1;

        // Базовая статистика по корзинам
        const totalCarts = await CartModel.count({
            where: { tenant_id: tid },
        });

        const activeCarts = await CartModel.count({
            where: { tenant_id: tid, status: CART_STATUS.ACTIVE },
        });

        const abandonedCarts = await CartModel.count({
            where: { tenant_id: tid, status: CART_STATUS.ABANDONED },
        });

        const convertedCarts = await CartModel.count({
            where: { tenant_id: tid, status: CART_STATUS.CONVERTED },
        });

        const expiredCarts = await CartModel.count({
            where: { tenant_id: tid, status: CART_STATUS.EXPIRED },
        });

        // Средний чек (используем агрегацию БД)
        const avgValueResult = await CartModel.findOne({
            where: {
                tenant_id: tid,
                status: CART_STATUS.ACTIVE,
            },
            attributes: [
                [
                    CartModel.sequelize!.fn(
                        'AVG',
                        CartModel.sequelize!.col('total_amount'),
                    ),
                    'avgValue',
                ],
            ],
            raw: true,
        });

        const averageCartValue = avgValueResult
            ? Number(
                  (avgValueResult as unknown as { avgValue: number }).avgValue,
              ) || 0
            : 0;

        // Среднее количество товаров в корзине (используем агрегацию БД)
        const avgItemsResult = await CartProductModel.findOne({
            include: [
                {
                    model: CartModel,
                    where: {
                        tenant_id: tid,
                        status: CART_STATUS.ACTIVE,
                    },
                    attributes: [],
                },
            ],
            attributes: [
                [
                    CartModel.sequelize!.fn(
                        'AVG',
                        CartModel.sequelize!.literal(
                            '(SELECT COUNT(*) FROM cart_products WHERE cart_products.cart_id = cart.id)',
                        ),
                    ),
                    'avgItems',
                ],
            ],
            raw: true,
        });

        const averageItemsCount = avgItemsResult
            ? Number(
                  (avgItemsResult as unknown as { avgItems: number }).avgItems,
              ) || 0
            : 0;

        // Гостевые vs авторизованные корзины
        const guestCarts: number = await CartModel.count({
            where: {
                tenant_id: tid,
                user_id: null as never,
                session_id: { [Op.ne]: null as never },
            },
        });

        const authenticatedCarts: number = await CartModel.count({
            where: {
                tenant_id: tid,
                user_id: { [Op.ne]: null as never },
            },
        });

        const guestToAuthRate =
            guestCarts + authenticatedCarts > 0
                ? (authenticatedCarts / (guestCarts + authenticatedCarts)) * 100
                : 0;

        // Конверсия корзина → заказ
        const cartToOrderRate =
            totalCarts > 0 ? (convertedCarts / totalCarts) * 100 : 0;

        // Топ товаров в корзинах
        const cartProducts = await CartProductModel.findAll({
            include: [
                {
                    model: CartModel,
                    where: {
                        tenant_id: tid,
                        status: CART_STATUS.ACTIVE,
                    },
                    attributes: [],
                },
                {
                    model: ProductModel,
                    attributes: ['id', 'name'],
                },
            ],
            attributes: [
                'product_id',
                [CartModel.sequelize!.fn('COUNT', '*'), 'count'],
            ],
            group: ['product_id', 'product.id', 'product.name'],
            order: [[CartModel.sequelize!.literal('count'), 'DESC']],
            limit: 10,
            raw: false,
        });

        const topProducts = cartProducts.map((item) => ({
            productId: item.product_id,
            name: item.product?.name || 'Unknown',
            count: Number((item as unknown as { count: number }).count),
        }));

        // Статистика промокодов
        const cartsWithPromo: CartModel[] = await CartModel.findAll({
            where: {
                tenant_id: tid,
                promo_code: { [Op.ne]: null as never },
            },
            attributes: ['discount'],
        });

        const totalUsed = cartsWithPromo.length;
        const averageDiscount =
            totalUsed > 0
                ? cartsWithPromo.reduce(
                      (sum: number, cart: CartModel) =>
                          sum + Number(cart.discount),
                      0,
                  ) / totalUsed
                : 0;

        return {
            totalCarts,
            activeCarts,
            abandonedCarts,
            convertedCarts,
            expiredCarts,
            averageCartValue: Number(averageCartValue.toFixed(2)),
            averageItemsCount: Number(averageItemsCount.toFixed(2)),
            guestCarts,
            authenticatedCarts,
            guestToAuthRate: Number(guestToAuthRate.toFixed(2)),
            cartToOrderRate: Number(cartToOrderRate.toFixed(2)),
            topProducts,
            promoCodeUsage: {
                totalUsed,
                averageDiscount: Number(averageDiscount.toFixed(2)),
            },
        };
    }

    // ==================== ПРИВАТНЫЕ МЕТОДЫ ====================

    /**
     * Получить или создать корзину текущего пользователя
     * (unified логика для auth/guest)
     */
    private async getOrCreateCart(
        request: Request,
        response: Response,
    ): Promise<CartModel> {
        const tenantId = this.tenantContext.getTenantIdOrNull() || 1;
        const user = request.user as IDecodedAccessToken | undefined;

        let cart: CartModel | null = null;

        if (user?.id) {
            // Авторизованный пользователь - ищем по user_id
            cart = await CartModel.findOne({
                where: {
                    tenant_id: tenantId,
                    user_id: user.id,
                    status: CART_STATUS.ACTIVE,
                },
                include: [
                    {
                        model: ProductModel,
                        through: { attributes: ['quantity', 'price'] },
                        attributes: ['id', 'name', 'price', 'image'],
                    },
                ],
            });

            if (!cart) {
                // Создаём новую корзину для пользователя
                cart = await CartModel.create({
                    tenant_id: tenantId,
                    user_id: user.id,
                    status: CART_STATUS.ACTIVE,
                });
                cart.setExpirationDate();
                await cart.save();
            }
        } else {
            // Гостевой пользователь - ищем по session_id (из cookies)
            const { cartId } = request.signedCookies;

            if (cartId) {
                cart = await CartModel.findOne({
                    where: {
                        id: cartId,
                        tenant_id: tenantId,
                        status: CART_STATUS.ACTIVE,
                    },
                    include: [
                        {
                            model: ProductModel,
                            through: { attributes: ['quantity', 'price'] },
                            attributes: ['id', 'name', 'price', 'image'],
                        },
                    ],
                });
            }

            if (!cart) {
                // Создаём новую гостевую корзину
                const sessionId = this.generateSessionId();
                cart = await CartModel.create({
                    tenant_id: tenantId,
                    session_id: sessionId,
                    status: CART_STATUS.ACTIVE,
                });
                cart.setExpirationDate();
                await cart.save();

                // Устанавливаем cookie
                this.setCartCookie(response, cart.id);
            }
        }

        return cart;
    }

    /**
     * Установить cookie с cartId
     */
    private setCartCookie(response: Response, cartId: number): void {
        response.cookie('cartId', cartId, {
            maxAge: this.maxAge,
            signed: this.signed,
        });
    }

    /**
     * Генерация session_id для гостевой корзины
     */
    private generateSessionId(): string {
        return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Валидация количества товара
     */
    private validateQuantity(quantity: number): void {
        if (quantity < CART_CONSTANTS.MIN_ITEM_QUANTITY) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Количество товара должно быть не меньше ${CART_CONSTANTS.MIN_ITEM_QUANTITY}`,
            });
        }

        if (quantity > CART_CONSTANTS.MAX_ITEM_QUANTITY) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Количество товара не может превышать ${CART_CONSTANTS.MAX_ITEM_QUANTITY}`,
            });
        }

        if (!Number.isInteger(quantity)) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Количество товара должно быть целым числом',
            });
        }
    }

    /**
     * Валидация статуса корзины
     * (нельзя модифицировать converted или expired корзины)
     */
    private validateCartStatus(cart: CartModel): void {
        if (cart.status === CART_STATUS.CONVERTED) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message:
                    'Корзина уже конвертирована в заказ и не может быть изменена',
            });
        }

        if (cart.status === CART_STATUS.EXPIRED) {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Корзина истекла и не может быть изменена',
            });
        }
    }

    /**
     * Слияние гостевой корзины в пользовательскую
     */
    private async mergeGuestCartToUser(
        guestCart: CartModel,
        userCart: CartModel,
    ): Promise<void> {
        const guestItems = await CartProductModel.findAll({
            where: { cart_id: guestCart.id },
        });

        for (const guestItem of guestItems) {
            const userItem = await CartProductModel.findOne({
                where: {
                    cart_id: userCart.id,
                    product_id: guestItem.product_id,
                },
            });

            if (userItem) {
                // Товар уже есть в пользовательской корзине - объединяем
                try {
                    userItem.mergeWith(guestItem);
                    await userItem.save();
                } catch {
                    // Если превышен лимит - оставляем количество из пользовательской корзины
                }
            } else {
                // Товара нет - клонируем из гостевой корзины
                await guestItem.cloneTo(userCart.id);
            }
        }

        // Пересчитываем итоговую сумму
        await userCart.recalculateTotal();
    }

    /**
     * Трансформация данных корзины в response DTO
     */
    private transformData(cart: CartModel): ICartTransformData {
        const data: ICartTransformData = {
            cartId: cart.id,
            products: [],
        };

        if (cart.products) {
            data.products = cart.products.map(
                (
                    item: ProductModel & {
                        CartProductModel?: { price: number; quantity: number };
                    },
                ): ICartProductItem => {
                    // Используем price snapshot из CartProductModel
                    const unitPrice = Number(
                        item.CartProductModel?.price || item.price,
                    );
                    const quantity = item.CartProductModel?.quantity || 0;
                    return {
                        productId: item.id,
                        name: item.name,
                        price: Number((unitPrice * quantity).toFixed(2)),
                        quantity: quantity,
                    };
                },
            );
        }

        return data;
    }

    /**
     * Найти товар по ID (с проверкой существования)
     */
    private async findProduct(id: number): Promise<ProductModel> {
        const product = await this.productRepository.fidProductByPkId(id);
        if (!product) {
            this.notFound(`Продукт с id:${id} не найден в БД`);
        }
        return product;
    }

    /**
     * Выбросить NotFoundException
     */
    private notFound(message: string): never {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }
}
