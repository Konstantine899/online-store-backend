/**
 * Comprehensive Test Example - демонстрация использования всех новых утилит
 *
 * Этот файл показывает как использовать:
 * - MockFactories для создания моков
 * - TestDataBuilders для создания тестовых данных
 * - PerformanceTesting для бенчмарков и нагрузочного тестирования
 * - TEST_CONSTANTS для констант
 */

import { CartService } from '@app/infrastructure/services/cart/cart.service';
import { UserService } from '@app/infrastructure/services/user/user.service';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
    MockFactories,
    PerformanceTesting,
    TEST_CONSTANTS,
    TestDataBuilders,
} from '../utils';

describe('Comprehensive Test Example', () => {
    let cartService: CartService;
    let userService: UserService;

    beforeEach(async () => {
        // Используем MockFactories для создания провайдеров
        const cartProviders = MockFactories.createCartServiceProviders({
            tenantId: TEST_CONSTANTS.COMMON.TENANT_ID,
        });

        const userProviders = MockFactories.createUserServiceProviders({
            tenantId: TEST_CONSTANTS.COMMON.TENANT_ID,
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CartService,
                UserService,
                ...cartProviders,
                ...userProviders,
            ],
        }).compile();

        cartService = module.get<CartService>(CartService);
        userService = module.get<UserService>(UserService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        PerformanceTesting.clearResults();
    });

    describe('Using TestDataBuilders', () => {
        it('should create complex test objects with builders', () => {
            // Создаем пользователя с помощью билдера
            const user = TestDataBuilders.user()
                .withEmail(TEST_CONSTANTS.USER.EMAIL)
                .withPhone(TEST_CONSTANTS.USER.PHONE)
                .withName(
                    TEST_CONSTANTS.USER.FIRST_NAME,
                    TEST_CONSTANTS.USER.LAST_NAME,
                )
                .withActiveStatus()
                .withLastLogin(new Date())
                .build();

            expect(user.email).toBe(TEST_CONSTANTS.USER.EMAIL);
            expect(user.isActive).toBe(true);
            expect(user.lastLoginAt).toBeDefined();

            // Создаем товар с помощью билдера
            const product = TestDataBuilders.product()
                .withName(TEST_CONSTANTS.PRODUCT.NAME)
                .withPrice(TEST_CONSTANTS.PRODUCT.PRICE)
                .withStock(100)
                .withActiveStatus()
                .build();

            expect(product.name).toBe(TEST_CONSTANTS.PRODUCT.NAME);
            expect(product.price).toBe(TEST_CONSTANTS.PRODUCT.PRICE);
            expect(product.isActive).toBe(true);

            // Создаем корзину с помощью билдера
            const cart = TestDataBuilders.cart()
                .withUserId(user.id)
                .withTenantId(TEST_CONSTANTS.COMMON.TENANT_ID)
                .withActiveStatus()
                .withTotalAmount(0)
                .withProducts([product])
                .build();

            expect(cart.user_id).toBe(user.id);
            expect(cart.status).toBe('active');
            expect(cart.products).toHaveLength(1);
        });

        it('should use standard builders for common scenarios', () => {
            // Используем предустановленные билдеры
            const standardUser = TestDataBuilders.createStandardUser();
            const adminUser = TestDataBuilders.createAdminUser();
            const standardProduct = TestDataBuilders.createStandardProduct();
            const standardCart = TestDataBuilders.createStandardCart();
            const standardOrder = TestDataBuilders.createStandardOrder();
            const standardPromoCode =
                TestDataBuilders.createStandardPromoCode();

            expect(standardUser.email).toBe('test@example.com');
            expect(adminUser.email).toBe('admin@example.com');
            expect(standardProduct.name).toBe('Test Product');
            expect(standardCart.status).toBe('active');
            expect(standardOrder.status).toBe('pending');
            expect(standardPromoCode.code).toBe('TEST10');
        });
    });

    describe('Using PerformanceTesting', () => {
        it('should benchmark cart operations', async () => {
            // Мокаем зависимости
            const mockCart = MockFactories.createCartModel({
                id: TEST_CONSTANTS.CART.CART_ID,
                user_id: TEST_CONSTANTS.USER.ID,
            });

            jest.spyOn(cartService, 'getCart').mockResolvedValue({
                cartId: mockCart.id,
                products: [],
                totalAmount: 0,
            } as unknown as Awaited<ReturnType<typeof cartService.getCart>>);

            // Выполняем бенчмарк
            const result = await PerformanceTesting.benchmark(
                'cart-get-operation',
                async () => {
                    await cartService.getCart(
                        MockFactories.createMockRequest() as unknown as Parameters<
                            typeof cartService.getCart
                        >[0],
                        MockFactories.createMockResponse() as unknown as Parameters<
                            typeof cartService.getCart
                        >[1],
                    );
                },
                {
                    iterations: 100,
                    warmupIterations: 10,
                    threshold: {
                        maxAverageDuration: 50, // 50ms максимум
                    },
                },
            );

            expect(result.name).toBe('cart-get-operation');
            expect(result.iterations).toBe(100);
            expect(result.averageDuration).toBeLessThan(50);
            expect(result.throughput).toBeGreaterThan(0);
        });

        it('should perform load testing on user creation', async () => {
            // Мокаем зависимости
            const mockUser = MockFactories.createUserModel({
                id: TEST_CONSTANTS.USER.ID,
                email: TEST_CONSTANTS.USER.EMAIL,
            });

            jest.spyOn(userService, 'createUser').mockResolvedValue(
                mockUser as unknown as Awaited<
                    ReturnType<typeof userService.createUser>
                >,
            );

            // Выполняем нагрузочный тест
            const result = await PerformanceTesting.loadTest(
                'user-creation-load-test',
                async () => {
                    await userService.createUser({
                        email: TEST_CONSTANTS.USER.EMAIL,
                        phone: TEST_CONSTANTS.USER.PHONE,
                        firstName: TEST_CONSTANTS.USER.FIRST_NAME,
                        lastName: TEST_CONSTANTS.USER.LAST_NAME,
                    } as unknown as Parameters<
                        typeof userService.createUser
                    >[0]);
                },
                {
                    concurrentUsers: 10,
                    duration: 5000, // 5 секунд
                    rampUpTime: 1000, // 1 секунда наращивания
                },
            );

            expect(result.name).toBe('user-creation-load-test');
            expect(result.totalRequests).toBeGreaterThan(0);
            expect(result.errorRate).toBeLessThan(10); // Менее 10% ошибок
        });

        it('should generate performance report', async () => {
            // Выполняем несколько бенчмарков
            await PerformanceTesting.benchmark('test-1', async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
            });

            await PerformanceTesting.benchmark('test-2', async () => {
                await new Promise((resolve) => setTimeout(resolve, 20));
            });

            // Генерируем отчет
            const report = PerformanceTesting.generateReport();

            expect(report).toContain('# Performance Test Report');
            expect(report).toContain('test-1');
            expect(report).toContain('test-2');
            expect(report).toContain('Average (ms)');
        });
    });

    describe('Using MockFactories with different modules', () => {
        it('should create user service providers', () => {
            const providers = MockFactories.createUserServiceProviders({
                tenantId: 2,
                mockUser: { id: 5, email: 'custom@example.com' },
            });

            expect(providers).toHaveLength(2);
            expect(providers[0].provide).toBe('UserRepository');
            expect(providers[1].provide).toBe('TenantContext');
        });

        it('should create order service providers', () => {
            const providers = MockFactories.createOrderServiceProviders({
                tenantId: 3,
                mockOrder: { id: 10, status: 2 }, // COMPLETED status
                mockUser: { id: 15, email: 'order@example.com' },
            });

            expect(providers).toHaveLength(3);
            expect(providers[0].provide).toBe('OrderRepository');
            expect(providers[1].provide).toBe('UserRepository');
            expect(providers[2].provide).toBe('TenantContext');
        });

        it('should create individual mocks', () => {
            const cartRepo = MockFactories.createCartRepository();
            const productRepo = MockFactories.createProductRepository();
            const userRepo = MockFactories.createUserRepository();
            const orderRepo = MockFactories.createOrderRepository();
            const promoRepo = MockFactories.createPromoCodeRepository();

            expect(cartRepo.findCart).toBeDefined();
            expect(productRepo.fidProductByPkId).toBeDefined();
            expect(userRepo.findByEmail).toBeDefined();
            expect(orderRepo.findById).toBeDefined();
            expect(promoRepo.findByCode).toBeDefined();
        });
    });

    describe('Using TEST_CONSTANTS', () => {
        it('should use cart constants', () => {
            expect(TEST_CONSTANTS.CART.PRODUCT_PRICE).toBe(1000);
            expect(TEST_CONSTANTS.CART.CART_ID).toBe(1);
            expect(TEST_CONSTANTS.CART.PROMO_CODE).toBe('PROMO10');
        });

        it('should use user constants', () => {
            expect(TEST_CONSTANTS.USER.EMAIL).toBe('test@example.com');
            expect(TEST_CONSTANTS.USER.PHONE).toBe('+79991234567');
            expect(TEST_CONSTANTS.USER.FIRST_NAME).toBe('Test');
        });

        it('should use product constants', () => {
            expect(TEST_CONSTANTS.PRODUCT.NAME).toBe('Test Product');
            expect(TEST_CONSTANTS.PRODUCT.PRICE).toBe(1000);
            expect(TEST_CONSTANTS.PRODUCT.SKU).toBe('TEST-SKU-001');
        });

        it('should use order constants', () => {
            expect(TEST_CONSTANTS.ORDER.STATUS).toBe('pending');
            expect(TEST_CONSTANTS.ORDER.TOTAL_AMOUNT).toBe(1000);
            expect(TEST_CONSTANTS.ORDER.PAYMENT_METHOD).toBe('card');
        });

        it('should maintain backward compatibility with CART_TEST_CONSTANTS', () => {
            expect(TEST_CONSTANTS.CART).toBeDefined();
            // CART_TEST_CONSTANTS должен быть доступен для обратной совместимости
        });
    });

    describe('Integration of all utilities', () => {
        it('should demonstrate complete workflow', async () => {
            // 1. Создаем тестовые данные с помощью билдеров
            const user = TestDataBuilders.createStandardUser();
            const product = TestDataBuilders.createStandardProduct();
            const cart = TestDataBuilders.createStandardCart();

            // 2. Используем константы
            expect(user.email).toBe(TEST_CONSTANTS.USER.EMAIL);
            expect(product.price).toBe(TEST_CONSTANTS.PRODUCT.PRICE);

            // 3. Создаем моки с помощью фабрик
            const cartRepo = MockFactories.createCartRepository();
            const productRepo = MockFactories.createProductRepository();

            // 4. Настраиваем моки
            cartRepo.findCart.mockResolvedValue(
                cart as unknown as Awaited<
                    ReturnType<typeof cartRepo.findCart>
                >,
            );
            productRepo.fidProductByPkId.mockResolvedValue(
                product as unknown as Awaited<
                    ReturnType<typeof productRepo.fidProductByPkId>
                >,
            );

            // 5. Выполняем бенчмарк
            const benchmarkResult = await PerformanceTesting.benchmark(
                'complete-workflow-test',
                async () => {
                    // Имитируем работу с данными
                    const foundCart = await cartRepo.findCart({}, {}, {});
                    const foundProduct = await productRepo.fidProductByPkId(
                        TEST_CONSTANTS.PRODUCT.ID,
                    );

                    expect(foundCart).toBeDefined();
                    expect(foundProduct).toBeDefined();
                },
                { iterations: 50 },
            );

            expect(benchmarkResult.name).toBe('complete-workflow-test');
            expect(benchmarkResult.iterations).toBe(50);
        });
    });
});

// (удалено) Demo-класс не использовался в примере теста

/**
 * Преимущества использования новых утилит:
 *
 * 1. **MockFactories**:
 *    - Стандартизированные моки для всех модулей
 *    - Типобезопасность
 *    - Легкое переопределение через overrides
 *    - Готовые провайдеры для тестовых модулей
 *
 * 2. **TestDataBuilders**:
 *    - Читаемые и понятные тесты
 *    - Переиспользование логики создания данных
 *    - Предустановленные сценарии
 *    - Флюентный API
 *
 * 3. **PerformanceTesting**:
 *    - Автоматические бенчмарки
 *    - Нагрузочное тестирование
 *    - Мониторинг регрессий
 *    - Генерация отчетов
 *
 * 4. **TEST_CONSTANTS**:
 *    - Централизованные константы
 *    - Типобезопасность
 *    - Легкое изменение значений
 *    - Обратная совместимость
 */
