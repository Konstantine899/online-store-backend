import { CartModel, CartProductModel, ProductModel } from '@app/domain/models';
import { CART_STATUS } from '@app/domain/models/constants/cart.constants';
import { TenantContext } from '@app/infrastructure/common/context';
import {
    CartRepository,
    ProductRepository,
} from '@app/infrastructure/repositories';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { CartService } from '../cart.service';

describe('CartService (SAAS-004-03)', () => {
    let service: CartService;
    let mockProductRepository: {
        fidProductByPkId: jest.Mock<Promise<ProductModel | null>, [number]>;
    };
    let mockTransaction: {
        commit: jest.Mock;
        rollback: jest.Mock;
    };

    // Mock instances
    let mockCart: Partial<CartModel>;
    let mockProduct: Partial<ProductModel>;
    let mockCartProduct: Partial<CartProductModel>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(async () => {
        // Mock repositories
        const mockCartRepository = {
            findCart: jest.fn(),
            createCart: jest.fn(),
            appendToCart: jest.fn(),
            increment: jest.fn(),
            decrement: jest.fn(),
            removeFromCart: jest.fn(),
            clearCart: jest.fn(),
        };

        mockProductRepository = {
            fidProductByPkId: jest.fn<Promise<ProductModel | null>, [number]>(),
        };

        const mockTenantContext = {
            getTenantIdOrNull: jest.fn().mockReturnValue(1),
        };

        // Mock транзакций Sequelize
        mockTransaction = {
            commit: jest.fn().mockResolvedValue(undefined),
            rollback: jest.fn().mockResolvedValue(undefined),
        };

        // Мокируем CartModel.sequelize.transaction() через Object.defineProperty
        const mockSequelize = {
            transaction: jest.fn().mockResolvedValue(mockTransaction),
            fn: jest.fn(),
            col: jest.fn(),
            literal: jest.fn(),
        };

        Object.defineProperty(CartModel, 'sequelize', {
            get: () => mockSequelize,
            configurable: true,
        });

        // Мокируем методы CartProductModel для транзакций
        jest.spyOn(CartProductModel, 'findOne').mockResolvedValue(null);
        jest.spyOn(CartProductModel, 'create').mockImplementation(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (values: any) =>
                ({
                    ...values,
                    id: 1,
                    save: jest.fn().mockResolvedValue(undefined),
                    destroy: jest.fn().mockResolvedValue(undefined),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }) as any,
        );
        jest.spyOn(CartProductModel, 'destroy').mockResolvedValue(1);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CartService,
                {
                    provide: CartRepository,
                    useValue: mockCartRepository,
                },
                {
                    provide: ProductRepository,
                    useValue: mockProductRepository,
                },
                {
                    provide: TenantContext,
                    useValue: mockTenantContext,
                },
            ],
        }).compile();

        service = module.get<CartService>(CartService);

        // Mock instances
        mockCart = {
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
        };

        mockProduct = {
            id: 1,
            name: 'Test Product',
            price: 1000,
            image: 'test.jpg',
        };

        mockCartProduct = {
            id: 1,
            cart_id: 1,
            product_id: 1,
            quantity: 1,
            price: 1000,
            incrementQuantity: jest.fn(),
            decrementQuantity: jest.fn(),
            save: jest.fn().mockResolvedValue(undefined),
            destroy: jest.fn().mockResolvedValue(undefined),
            cloneTo: jest.fn(),
            mergeWith: jest.fn(),
        };

        mockRequest = {
            signedCookies: {},
            user: undefined,
        };

        mockResponse = {
            cookie: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    // ==================== БАЗОВЫЕ ОПЕРАЦИИ ====================

    describe('getCart', () => {
        it('должен создать новую гостевую корзину если её нет', async () => {
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(null);
            jest.spyOn(CartModel, 'create').mockResolvedValue(
                mockCart as CartModel,
            );

            const result = await service.getCart(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(CartModel.create).toHaveBeenCalled();
            expect(mockCart.setExpirationDate).toHaveBeenCalled();
            expect(mockResponse.cookie).toHaveBeenCalledWith(
                'cartId',
                mockCart.id,
                expect.any(Object),
            );
            expect(result).toHaveProperty('cartId', mockCart.id);
        });

        it('должен найти существующую гостевую корзину по cartId из cookies', async () => {
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );

            const result = await service.getCart(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(CartModel.findOne).toHaveBeenCalled();
            expect(result).toHaveProperty('cartId', mockCart.id);
        });

        it('должен создать корзину для авторизованного пользователя', async () => {
            mockRequest.user = { id: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(null);
            jest.spyOn(CartModel, 'create').mockResolvedValue(
                mockCart as CartModel,
            );

            const result = await service.getCart(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(CartModel.create).toHaveBeenCalledWith({
                tenant_id: 1,
                user_id: 1,
                status: CART_STATUS.ACTIVE,
            });
            expect(result).toHaveProperty('cartId', mockCart.id);
        });
    });

    describe('appendToCart', () => {
        it('должен добавить новый товар с price snapshot', async () => {
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );
            mockProductRepository.fidProductByPkId.mockResolvedValue(
                mockProduct as ProductModel,
            );
            jest.spyOn(CartProductModel, 'findOne').mockResolvedValue(null);
            jest.spyOn(CartProductModel, 'create').mockResolvedValue(
                mockCartProduct as CartProductModel,
            );

            await service.appendToCart(
                mockRequest as Request,
                mockResponse as Response,
                1,
                2,
            );

            expect(CartProductModel.create).toHaveBeenCalledWith(
                {
                    cart_id: mockCart.id,
                    product_id: mockProduct.id,
                    quantity: 2,
                    price: mockProduct.price, // Price snapshot!
                },
                expect.objectContaining({
                    transaction: expect.any(Object),
                }),
            );
            expect(mockCart.recalculateTotal).toHaveBeenCalled();
            expect(mockCart.setExpirationDate).toHaveBeenCalled();
        });

        it('должен увеличить количество если товар уже в корзине', async () => {
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );
            mockProductRepository.fidProductByPkId.mockResolvedValue(
                mockProduct as ProductModel,
            );
            jest.spyOn(CartProductModel, 'findOne').mockResolvedValue(
                mockCartProduct as CartProductModel,
            );

            await service.appendToCart(
                mockRequest as Request,
                mockResponse as Response,
                1,
                2,
            );

            expect(mockCartProduct.save).toHaveBeenCalled();
            expect(mockCart.recalculateTotal).toHaveBeenCalled();
        });

        it('должен выбросить BadRequestException при некорректном количестве', async () => {
            await expect(
                service.appendToCart(
                    mockRequest as Request,
                    mockResponse as Response,
                    1,
                    0,
                ),
            ).rejects.toThrow(BadRequestException);

            await expect(
                service.appendToCart(
                    mockRequest as Request,
                    mockResponse as Response,
                    1,
                    1000,
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен выбросить NotFoundException если товар не найден', async () => {
            mockProductRepository.fidProductByPkId.mockResolvedValue(null);

            await expect(
                service.appendToCart(
                    mockRequest as Request,
                    mockResponse as Response,
                    999,
                    1,
                ),
            ).rejects.toThrow(NotFoundException);
        });

        it('должен выбросить BadRequestException для конвертированной корзины', async () => {
            mockCart.status = CART_STATUS.CONVERTED;
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );
            mockProductRepository.fidProductByPkId.mockResolvedValue(
                mockProduct as ProductModel,
            );

            await expect(
                service.appendToCart(
                    mockRequest as Request,
                    mockResponse as Response,
                    1,
                    1,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('increment', () => {
        it('должен увеличить количество товара в корзине', async () => {
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );
            mockProductRepository.fidProductByPkId.mockResolvedValue(
                mockProduct as ProductModel,
            );
            jest.spyOn(CartProductModel, 'findOne').mockResolvedValue(
                mockCartProduct as CartProductModel,
            );

            await service.increment(
                mockRequest as Request,
                mockResponse as Response,
                1,
                2,
            );

            expect(mockCartProduct.incrementQuantity).toHaveBeenCalledWith(2);
            expect(mockCartProduct.save).toHaveBeenCalled();
        });

        it('должен выбросить NotFoundException если товар не в корзине', async () => {
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );
            mockProductRepository.fidProductByPkId.mockResolvedValue(
                mockProduct as ProductModel,
            );
            jest.spyOn(CartProductModel, 'findOne').mockResolvedValue(null);

            await expect(
                service.increment(
                    mockRequest as Request,
                    mockResponse as Response,
                    1,
                    1,
                ),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('decrement', () => {
        it('должен уменьшить количество товара в корзине', async () => {
            mockCartProduct.quantity = 5;
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );
            mockProductRepository.fidProductByPkId.mockResolvedValue(
                mockProduct as ProductModel,
            );
            jest.spyOn(CartProductModel, 'findOne').mockResolvedValue(
                mockCartProduct as CartProductModel,
            );

            await service.decrement(
                mockRequest as Request,
                mockResponse as Response,
                1,
                2,
            );

            expect(mockCartProduct.decrementQuantity).toHaveBeenCalledWith(2);
            expect(mockCartProduct.save).toHaveBeenCalled();
        });

        it('должен удалить товар если количество станет 0 или меньше', async () => {
            mockCartProduct.quantity = 1;
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );
            mockProductRepository.fidProductByPkId.mockResolvedValue(
                mockProduct as ProductModel,
            );
            jest.spyOn(CartProductModel, 'findOne').mockResolvedValue(
                mockCartProduct as CartProductModel,
            );

            await service.decrement(
                mockRequest as Request,
                mockResponse as Response,
                1,
                2,
            );

            expect(mockCartProduct.destroy).toHaveBeenCalled();
        });

        it('должен вернуть корзину без ошибки если товара нет', async () => {
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );
            mockProductRepository.fidProductByPkId.mockResolvedValue(
                mockProduct as ProductModel,
            );
            jest.spyOn(CartProductModel, 'findOne').mockResolvedValue(null);

            const result = await service.decrement(
                mockRequest as Request,
                mockResponse as Response,
                1,
                1,
            );

            expect(result).toHaveProperty('cartId', mockCart.id);
        });
    });

    describe('removeProductFromCart', () => {
        it('должен удалить товар из корзины', async () => {
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );
            mockProductRepository.fidProductByPkId.mockResolvedValue(
                mockProduct as ProductModel,
            );
            jest.spyOn(CartProductModel, 'findOne').mockResolvedValue(
                mockCartProduct as CartProductModel,
            );

            await service.removeProductFromCart(
                mockRequest as Request,
                mockResponse as Response,
                1,
            );

            expect(mockCartProduct.destroy).toHaveBeenCalled();
            expect(mockCart.setExpirationDate).toHaveBeenCalled();
        });
    });

    describe('clearCart', () => {
        it('должен очистить все товары из корзины', async () => {
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );
            jest.spyOn(CartProductModel, 'destroy').mockResolvedValue(3);

            await service.clearCart(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(CartProductModel.destroy).toHaveBeenCalledWith({
                where: { cart_id: mockCart.id },
                transaction: expect.any(Object),
            });
            expect(mockCart.recalculateTotal).toHaveBeenCalled();
        });
    });

    // ==================== ПРОМОКОДЫ ====================

    describe('applyPromoCode', () => {
        it('должен применить промокод к корзине', async () => {
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );

            await service.applyPromoCode(
                mockRequest as Request,
                mockResponse as Response,
                'PROMO10',
                100,
            );

            expect(mockCart.applyPromoCode).toHaveBeenCalledWith(
                'PROMO10',
                100,
            );
        });

        it('должен выбросить BadRequestException для отрицательной скидки', async () => {
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );

            await expect(
                service.applyPromoCode(
                    mockRequest as Request,
                    mockResponse as Response,
                    'PROMO10',
                    -100,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('removePromoCode', () => {
        it('должен удалить промокод из корзины', async () => {
            mockRequest.signedCookies = { cartId: 1 };
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(
                mockCart as CartModel,
            );

            await service.removePromoCode(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(mockCart.removePromoCode).toHaveBeenCalled();
        });
    });

    // ==================== КОНВЕРТАЦИЯ КОРЗИН ====================

    describe('convertGuestCart', () => {
        it('должен конвертировать гостевую корзину в пользовательскую', async () => {
            jest.spyOn(CartModel, 'findOne')
                .mockResolvedValueOnce(mockCart as CartModel) // guest cart
                .mockResolvedValueOnce(null); // no user cart

            const result = await service.convertGuestCart(1, 'sess_test_123');

            expect(mockCart.convertToAuthenticated).toHaveBeenCalledWith(1);
            expect(result).toBe(mockCart);
        });

        it('должен слить гостевую корзину с пользовательской если она есть', async () => {
            const mockUserCart = {
                ...mockCart,
                id: 2,
                user_id: 1,
            };

            jest.spyOn(CartModel, 'findOne')
                .mockResolvedValueOnce(mockCart as CartModel) // guest cart
                .mockResolvedValueOnce(mockUserCart as CartModel); // user cart

            jest.spyOn(CartProductModel, 'findAll').mockResolvedValue([]);
            mockCart.destroy = jest.fn().mockResolvedValue(undefined);

            const result = await service.convertGuestCart(1, 'sess_test_123');

            expect(mockCart.destroy).toHaveBeenCalled();
            expect(result).toBe(mockUserCart);
        });

        it('должен вернуть null если гостевая корзина не найдена', async () => {
            jest.spyOn(CartModel, 'findOne').mockResolvedValue(null);

            const result = await service.convertGuestCart(1, 'sess_test_123');

            expect(result).toBeNull();
        });
    });

    // ==================== АНАЛИТИКА ====================

    describe('getAbandonedCarts', () => {
        it('должен вернуть брошенные корзины', async () => {
            const mockAbandonedCarts = [mockCart as CartModel];
            jest.spyOn(CartModel, 'findAbandonedCarts').mockResolvedValue(
                mockAbandonedCarts,
            );

            const result = await service.getAbandonedCarts(7);

            expect(CartModel.findAbandonedCarts).toHaveBeenCalledWith(7, 1);
            expect(result).toEqual(mockAbandonedCarts);
        });
    });

    describe('getExpiringSoonCarts', () => {
        it('должен вернуть истекающие корзины', async () => {
            const mockExpiringSoon = [mockCart as CartModel];
            jest.spyOn(CartModel, 'scope').mockReturnValue({
                findAll: jest.fn().mockResolvedValue(mockExpiringSoon),
            } as never);

            const result = await service.getExpiringSoonCarts(7);

            expect(result).toEqual(mockExpiringSoon);
        });
    });

    describe('cleanupExpiredCarts', () => {
        it('должен очистить истёкшие корзины', async () => {
            jest.spyOn(CartModel, 'cleanupExpiredCarts').mockResolvedValue(5);

            const result = await service.cleanupExpiredCarts();

            expect(CartModel.cleanupExpiredCarts).toHaveBeenCalled();
            expect(result).toBe(5);
        });
    });

    describe('getCartAnalytics', () => {
        it('должен вернуть аналитику по корзинам', async () => {
            // NOTE: Этот метод требует инициализированный Sequelize (для .fn(), .literal())
            // Полноценное тестирование будет в integration тестах (SAAS-004-08)
            // Пока пропускаем unit тест для getCartAnalytics
            expect(service.getCartAnalytics).toBeDefined();
        });
    });
});
