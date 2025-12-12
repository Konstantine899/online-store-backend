/**
 * Mock Factories - переиспользуемые моки для unit тестов
 *
 * Назначение:
 * - Стандартизация моков для сервисов и репозиториев
 * - Упрощение создания тестовых модулей
 * - DRY принцип для повторяющихся моков
 * - Типобезопасность моков
 *
 * Использование:
 * ```typescript
 * import { MockFactories } from '../utils/mock-factories';
 *
 * const mockCartRepository = MockFactories.createCartRepository();
 * const mockProductRepository = MockFactories.createProductRepository();
 * ```
 */

import type {
    CartModel,
    OrderModel,
    ProductModel,
    UserModel,
} from '@app/domain/models';
import { CART_STATUS } from '@app/domain/models/constants/cart.constants';

/**
 * Фабрика моков для всех сервисов и репозиториев
 */
export class MockFactories {
    // ==================== CART MODULE ====================

    /**
     * Создает мок CartRepository с базовыми методами
     */
    static createCartRepository() {
        return {
            findCart: jest.fn(),
            createCart: jest.fn(),
            appendToCart: jest.fn(),
            increment: jest.fn(),
            decrement: jest.fn(),
            removeFromCart: jest.fn(),
            clearCart: jest.fn(),
        };
    }

    /**
     * Создает мок CartModel с базовыми методами и свойствами
     */
    static createCartModel(
        overrides: Partial<CartModel> = {},
    ): Partial<CartModel> {
        const defaultCart = {
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

        return { ...defaultCart, ...overrides };
    }

    // ==================== PRODUCT MODULE ====================

    /**
     * Создает мок ProductRepository с базовыми методами
     */
    static createProductRepository() {
        return {
            fidProductByPkId: jest.fn<Promise<ProductModel | null>, [number]>(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findByCategory: jest.fn(),
            searchProducts: jest.fn(),
        };
    }

    /**
     * Создает мок ProductModel с базовыми свойствами
     */
    static createProductModel(
        overrides: Partial<ProductModel> = {},
    ): Partial<ProductModel> {
        const defaultProduct = {
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

        return { ...defaultProduct, ...overrides };
    }

    // ==================== USER MODULE ====================

    /**
     * Создает мок UserRepository с базовыми методами
     */
    static createUserRepository() {
        return {
            findByEmail: jest.fn(),
            findByPhone: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn(),
            findActiveUsers: jest.fn(),
            updateLastLogin: jest.fn(),
        };
    }

    /**
     * Создает мок UserModel с базовыми свойствами
     */
    static createUserModel(
        overrides: Partial<UserModel> = {},
    ): Partial<UserModel> {
        const defaultUser = {
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

        return { ...defaultUser, ...overrides };
    }

    // ==================== ORDER MODULE ====================

    /**
     * Создает мок OrderRepository с базовыми методами
     */
    static createOrderRepository() {
        return {
            findById: jest.fn(),
            findByUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn(),
            findPendingOrders: jest.fn(),
            updateStatus: jest.fn(),
        };
    }

    /**
     * Создает мок OrderModel с базовыми свойствами
     */
    static createOrderModel(
        overrides: Partial<OrderModel> = {},
    ): Partial<OrderModel> {
        const defaultOrder = {
            id: 1,
            user_id: 1,
            status: 1, // pending status as number
            total_amount: 1000,
            shipping_address: 'Test Address',
            payment_method: 'card',
            created_at: new Date(),
            updated_at: new Date(),
        };

        return { ...defaultOrder, ...overrides };
    }

    // ==================== PROMO CODE MODULE ====================

    /**
     * Создает мок PromoCodeRepository с базовыми методами
     */
    static createPromoCodeRepository() {
        return {
            findByCode: jest.fn(),
            incrementUsageCount: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn(),
            findActivePromoCodes: jest.fn(),
        };
    }

    /**
     * Создает мок PromoCodeService с базовыми методами
     */
    static createPromoCodeService() {
        return {
            validatePromoCode: jest.fn().mockResolvedValue({
                isValid: true,
                discount: 100,
            }),
            applyPromoCode: jest.fn().mockResolvedValue(undefined),
        };
    }

    // ==================== COMMON UTILITIES ====================

    /**
     * Создает мок TenantContext с базовыми методами
     */
    static createTenantContext(tenantId: number = 1) {
        return {
            getTenantIdOrNull: jest.fn().mockReturnValue(tenantId),
        };
    }

    /**
     * Создает мок Request объекта для тестов
     */
    static createMockRequest(overrides: Partial<Request> = {}) {
        return {
            signedCookies: {},
            user: undefined,
            headers: {},
            body: {},
            params: {},
            query: {},
            ...overrides,
        } as Partial<Request>;
    }

    /**
     * Создает мок Response объекта для тестов
     */
    static createMockResponse(): Partial<Response> {
        const mockResponse = {
            cookie: jest.fn(),
            clearCookie: jest.fn(),
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        return mockResponse as unknown as Partial<Response>;
    }

    /**
     * Создает мок транзакции Sequelize
     */
    static createMockTransaction() {
        return {
            commit: jest.fn(),
            rollback: jest.fn(),
        };
    }

    // ==================== COMPOSITE FACTORIES ====================

    /**
     * Создает полный набор провайдеров для CartService тестов
     */
    static createCartServiceProviders(
        config: {
            tenantId?: number;
            mockCart?: Partial<CartModel>;
            mockProduct?: Partial<ProductModel>;
            mockPromoCodeService?: unknown;
        } = {},
    ) {
        const {
            tenantId = 1,
            mockPromoCodeService = this.createPromoCodeService(),
        } = config;

        return [
            {
                provide: 'CartRepository',
                useValue: this.createCartRepository(),
            },
            {
                provide: 'ProductRepository',
                useValue: this.createProductRepository(),
            },
            {
                provide: 'PromoCodeService',
                useValue: mockPromoCodeService,
            },
            {
                provide: 'PromoCodeRepository',
                useValue: this.createPromoCodeRepository(),
            },
            {
                provide: 'TenantContext',
                useValue: this.createTenantContext(tenantId),
            },
        ];
    }

    /**
     * Создает полный набор провайдеров для UserService тестов
     */
    static createUserServiceProviders(
        config: {
            tenantId?: number;
            mockUser?: Partial<UserModel>;
        } = {},
    ) {
        const { tenantId = 1 } = config;

        return [
            {
                provide: 'UserRepository',
                useValue: this.createUserRepository(),
            },
            {
                provide: 'TenantContext',
                useValue: this.createTenantContext(tenantId),
            },
        ];
    }

    /**
     * Создает полный набор провайдеров для OrderService тестов
     */
    static createOrderServiceProviders(
        config: {
            tenantId?: number;
            mockOrder?: Partial<OrderModel>;
            mockUser?: Partial<UserModel>;
        } = {},
    ) {
        const { tenantId = 1 } = config;

        return [
            {
                provide: 'OrderRepository',
                useValue: this.createOrderRepository(),
            },
            {
                provide: 'UserRepository',
                useValue: this.createUserRepository(),
            },
            {
                provide: 'TenantContext',
                useValue: this.createTenantContext(tenantId),
            },
        ];
    }
}

/**
 * Константы для тестов всех модулей
 */
export const TEST_CONSTANTS = {
    // Cart constants
    CART: {
        PRODUCT_PRICE: 1000,
        CART_ID: 1,
        PRODUCT_ID: 1,
        USER_ID: 1,
        TENANT_ID: 1,
        SESSION_ID: 'sess_test_123',
        PROMO_CODE: 'PROMO10',
        PROMO_DISCOUNT: 100,
        LARGE_QUANTITY: 1000,
    },

    // User constants
    USER: {
        ID: 1,
        EMAIL: 'test@example.com',
        PHONE: '+79991234567',
        FIRST_NAME: 'Test',
        LAST_NAME: 'User',
    },

    // Product constants
    PRODUCT: {
        ID: 1,
        NAME: 'Test Product',
        PRICE: 1000,
        SKU: 'TEST-SKU-001',
        CATEGORY_ID: 1,
        BRAND_ID: 1,
    },

    // Order constants
    ORDER: {
        ID: 1,
        STATUS: 'pending',
        TOTAL_AMOUNT: 1000,
        PAYMENT_METHOD: 'card',
    },

    // Common constants
    COMMON: {
        TENANT_ID: 1,
        TIMESTAMP: new Date('2025-01-01T00:00:00Z'),
    },
} as const;

/**
 * Константы для тестов корзины (обратная совместимость)
 * @deprecated Используйте TEST_CONSTANTS.CART
 */
export const CART_TEST_CONSTANTS = TEST_CONSTANTS.CART;
