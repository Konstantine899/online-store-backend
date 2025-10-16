/**
 * Test Data Builders - паттерн Builder для создания сложных тестовых объектов
 *
 * Назначение:
 * - Создание сложных тестовых объектов с минимальным кодом
 * - Читаемость и понятность тестов
 * - Переиспользование логики создания данных
 * - Типобезопасность
 *
 * Использование:
 * ```typescript
 * import { TestDataBuilders } from '../utils/test-data-builders';
 *
 * const user = TestDataBuilders.user()
 *     .withEmail('test@example.com')
 *     .withRole('ADMIN')
 *     .withActiveStatus()
 *     .build();
 * ```
 */

import {
    CartModel,
    OrderModel,
    ProductModel,
    PromoCodeModel,
    UserModel,
} from '@app/domain/models';
import { CART_STATUS } from '@app/domain/models/constants/cart.constants';

/**
 * Базовый класс для всех билдеров
 */
abstract class BaseBuilder<T> {
    protected data: Partial<T> = {};

    abstract build(): T;

    protected clone(): this {
        const cloned = Object.create(Object.getPrototypeOf(this));
        cloned.data = { ...this.data };
        return cloned;
    }
}

/**
 * Билдер для пользователей
 */
export class UserBuilder extends BaseBuilder<UserModel> {
    static user(): UserBuilder {
        return new UserBuilder();
    }

    withId(id: number): this {
        this.data.id = id;
        return this;
    }

    withEmail(email: string): this {
        this.data.email = email;
        return this;
    }

    withPhone(phone: string): this {
        this.data.phone = phone;
        return this;
    }

    withName(firstName: string, lastName: string): this {
        this.data.first_name = firstName;
        this.data.last_name = lastName;
        return this;
    }

    withActiveStatus(): this {
        this.data.is_active = true;
        this.data.is_verified = true;
        return this;
    }

    withInactiveStatus(): this {
        this.data.is_active = false;
        return this;
    }

    withVerificationStatus(isVerified: boolean): this {
        this.data.is_verified = isVerified;
        return this;
    }

    withLastLogin(lastLogin: Date): this {
        this.data.last_login_at = lastLogin;
        return this;
    }

    build(): UserModel {
        const defaults = {
            id: 1,
            email: 'test@example.com',
            phone: '+79991234567',
            first_name: 'Test',
            last_name: 'User',
            is_active: true,
            is_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
            last_login_at: null,
        };

        return { ...defaults, ...this.data } as UserModel;
    }
}

/**
 * Билдер для товаров
 */
export class ProductBuilder extends BaseBuilder<ProductModel> {
    static product(): ProductBuilder {
        return new ProductBuilder();
    }

    withId(id: number): this {
        this.data.id = id;
        return this;
    }

    withName(name: string): this {
        this.data.name = name;
        return this;
    }

    withPrice(price: number): this {
        this.data.price = price;
        return this;
    }

    withStock(stockQuantity: number): this {
        this.data.stock_quantity = stockQuantity;
        return this;
    }

    withSku(sku: string): this {
        this.data.sku = sku;
        return this;
    }

    withCategory(categoryId: number): this {
        this.data.category_id = categoryId;
        return this;
    }

    withBrand(brandId: number): this {
        this.data.brand_id = brandId;
        return this;
    }

    withDescription(description: string): this {
        this.data.description = description;
        return this;
    }

    withActiveStatus(): this {
        this.data.is_active = true;
        return this;
    }

    withInactiveStatus(): this {
        this.data.is_active = false;
        return this;
    }

    build(): ProductModel {
        const defaults = {
            id: 1,
            name: 'Test Product',
            price: 1000,
            stock_quantity: 10,
            is_active: true,
            description: 'Test product description',
            sku: 'TEST-SKU-001',
            category_id: 1,
            brand_id: 1,
        };

        return { ...defaults, ...this.data } as ProductModel;
    }
}

/**
 * Билдер для корзин
 */
export class CartBuilder extends BaseBuilder<CartModel> {
    static cart(): CartBuilder {
        return new CartBuilder();
    }

    withId(id: number): this {
        this.data.id = id;
        return this;
    }

    withUserId(userId: number): this {
        this.data.user_id = userId;
        return this;
    }

    withSessionId(sessionId: string): this {
        this.data.session_id = sessionId;
        return this;
    }

    withTenantId(tenantId: number): this {
        this.data.tenant_id = tenantId;
        return this;
    }

    withActiveStatus(): this {
        this.data.status = CART_STATUS.ACTIVE;
        return this;
    }

    withTotalAmount(amount: number): this {
        this.data.total_amount = amount;
        return this;
    }

    withDiscount(discount: number): this {
        this.data.discount = discount;
        return this;
    }

    withProducts(products: any[]): this {
        this.data.products = products;
        return this;
    }

    build(): CartModel {
        const defaults = {
            id: 1,
            tenant_id: 1,
            user_id: undefined,
            session_id: 'sess_test_123',
            status: CART_STATUS.ACTIVE,
            total_amount: 0,
            discount: 0,
            products: [],
            recalculateTotal: jest.fn().mockResolvedValue(undefined),
            setExpirationDate: jest.fn(),
            save: jest.fn().mockResolvedValue(undefined),
            reload: jest.fn().mockResolvedValue(undefined),
            applyPromoCode: jest.fn().mockResolvedValue(undefined),
            removePromoCode: jest.fn().mockResolvedValue(undefined),
            convertToAuthenticated: jest.fn().mockResolvedValue(undefined),
            getSubtotal: jest.fn().mockReturnValue(1000),
        };

        return { ...defaults, ...this.data } as CartModel;
    }
}

/**
 * Билдер для заказов
 */
export class OrderBuilder extends BaseBuilder<OrderModel> {
    static order(): OrderBuilder {
        return new OrderBuilder();
    }

    withId(id: number): this {
        this.data.id = id;
        return this;
    }

    withUserId(userId: number): this {
        this.data.user_id = userId;
        return this;
    }

    withStatus(status: string): this {
        this.data.status = status;
        return this;
    }

    withTotalAmount(amount: number): this {
        this.data.total_amount = amount;
        return this;
    }

    withShippingAddress(address: string): this {
        this.data.shipping_address = address;
        return this;
    }

    withPaymentMethod(method: string): this {
        this.data.payment_method = method;
        return this;
    }

    withPendingStatus(): this {
        this.data.status = 'pending';
        return this;
    }

    withCompletedStatus(): this {
        this.data.status = 'completed';
        return this;
    }

    build(): OrderModel {
        const defaults = {
            id: 1,
            user_id: 1,
            status: 'pending',
            total_amount: 1000,
            shipping_address: 'Test Address',
            payment_method: 'card',
            created_at: new Date(),
            updated_at: new Date(),
        };

        return { ...defaults, ...this.data } as OrderModel;
    }
}

/**
 * Билдер для промокодов
 */
export class PromoCodeBuilder extends BaseBuilder<PromoCodeModel> {
    static promoCode(): PromoCodeBuilder {
        return new PromoCodeBuilder();
    }

    withId(id: number): this {
        this.data.id = id;
        return this;
    }

    withCode(code: string): this {
        this.data.code = code;
        return this;
    }

    withPercentageDiscount(value: number): this {
        this.data.discount_type = 'percentage';
        this.data.discount_value = value;
        return this;
    }

    withFixedDiscount(value: number): this {
        this.data.discount_type = 'fixed';
        this.data.discount_value = value;
        return this;
    }

    withUsageLimit(limit: number): this {
        this.data.usage_limit = limit;
        return this;
    }

    withUsageCount(count: number): this {
        this.data.usage_count = count;
        return this;
    }

    withMinPurchaseAmount(amount: number): this {
        this.data.min_purchase_amount = amount;
        return this;
    }

    withActiveStatus(): this {
        this.data.is_active = true;
        return this;
    }

    withInactiveStatus(): this {
        this.data.is_active = false;
        return this;
    }

    withValidityPeriod(from: Date, until: Date): this {
        this.data.valid_from = from;
        this.data.valid_until = until;
        return this;
    }

    build(): PromoCodeModel {
        const defaults = {
            id: 1,
            code: 'TEST10',
            discount_type: 'percentage',
            discount_value: 10,
            is_active: true,
            valid_from: new Date(),
            valid_until: null,
            usage_limit: null,
            usage_count: 0,
            min_purchase_amount: 0,
            isValid: jest.fn().mockReturnValue(true),
            meetsMinimumPurchase: jest.fn().mockReturnValue(true),
            calculateDiscount: jest.fn().mockReturnValue(100),
            incrementUsage: jest.fn().mockResolvedValue(undefined),
        };

        return { ...defaults, ...this.data } as PromoCodeModel;
    }
}

/**
 * Главный класс для доступа ко всем билдерам
 */
export class TestDataBuilders {
    static user(): UserBuilder {
        return UserBuilder.user();
    }

    static product(): ProductBuilder {
        return ProductBuilder.product();
    }

    static cart(): CartBuilder {
        return CartBuilder.cart();
    }

    static order(): OrderBuilder {
        return OrderBuilder.order();
    }

    static promoCode(): PromoCodeBuilder {
        return PromoCodeBuilder.promoCode();
    }

    /**
     * Создает стандартного пользователя для тестов
     */
    static createStandardUser(): UserModel {
        return this.user()
            .withEmail('test@example.com')
            .withPhone('+79991234567')
            .withName('Test', 'User')
            .withActiveStatus()
            .build();
    }

    /**
     * Создает администратора для тестов
     */
    static createAdminUser(): UserModel {
        return this.user()
            .withEmail('admin@example.com')
            .withPhone('+79991234568')
            .withName('Admin', 'User')
            .withActiveStatus()
            .build();
    }

    /**
     * Создает стандартный товар для тестов
     */
    static createStandardProduct(): ProductModel {
        return this.product()
            .withName('Test Product')
            .withPrice(1000)
            .withStock(10)
            .withSku('TEST-SKU-001')
            .withActiveStatus()
            .build();
    }

    /**
     * Создает стандартную корзину для тестов
     */
    static createStandardCart(): CartModel {
        return this.cart()
            .withTenantId(1)
            .withActiveStatus()
            .withTotalAmount(0)
            .build();
    }

    /**
     * Создает стандартный заказ для тестов
     */
    static createStandardOrder(): OrderModel {
        return this.order()
            .withUserId(1)
            .withPendingStatus()
            .withTotalAmount(1000)
            .withShippingAddress('Test Address')
            .build();
    }

    /**
     * Создает стандартный промокод для тестов
     */
    static createStandardPromoCode(): PromoCodeModel {
        return this.promoCode()
            .withCode('TEST10')
            .withPercentageDiscount(10)
            .withActiveStatus()
            .withValidityPeriod(
                new Date(Date.now() - 86400000), // Вчера
                new Date(Date.now() + 86400000), // Завтра
            )
            .build();
    }
}
