import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartRepository, ProductRepository } from '@app/infrastructure/repositories';
import { Request, Response } from 'express';
import { CartModel, ProductModel } from '@app/domain/models';

// Mock фабрики
const createMockProduct = (id = 1, name = 'Test Product', price = 1000): ProductModel => ({
    id,
    name,
    price,
} as unknown as ProductModel);

const createMockCartProduct = (product: ProductModel, quantity = 2) => ({
    ...product,
    CartProductModel: { quantity },
} as unknown as ProductModel);

const createMockCart = (products: ProductModel[] = []): CartModel => ({
    id: 1,
    products,
} as unknown as CartModel);


// Базовые mock объекты
const mockProduct = createMockProduct();
const mockCart = createMockCart([createMockCartProduct(mockProduct)]);
const mockEmptyCart = createMockCart();
const mockRequest: Partial<Request> = { signedCookies: { cartId: 1 } };
const mockResponse: Partial<Response> = { cookie: jest.fn() };

describe('CartService', () => {
    let service: CartService;
    let cartRepository: jest.Mocked<CartRepository>;
    let productRepository: jest.Mocked<ProductRepository>;

    // Helper функции
    const setupMockCart = (products: ProductModel[] = []) => {
        cartRepository.findCart.mockResolvedValue(createMockCart(products));
    };

    const setupMockProduct = (product = mockProduct) => {
        productRepository.fidProductByPkId.mockResolvedValue(product);
    };

    const expectCartResponse = (result: unknown, expectedProducts: unknown[]) => {
        expect((result as { cartId: number }).cartId).toBe(1);
        expect((result as { products: unknown[] }).products).toEqual(expectedProducts);
    };

    const expectNotFoundError = async (operation: () => Promise<unknown>, message: string) => {
        await expect(operation()).rejects.toThrow(
            new NotFoundException({
                status: HttpStatus.NOT_FOUND,
                message,
            })
        );
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CartService,
                {
                    provide: CartRepository,
                    useValue: {
                        findCart: jest.fn(),
                        createCart: jest.fn(),
                        appendToCart: jest.fn(),
                        increment: jest.fn(),
                        decrement: jest.fn(),
                        removeFromCart: jest.fn(),
                        clearCart: jest.fn(),
                    },
                },
                {
                    provide: ProductRepository,
                    useValue: {
                        fidProductByPkId: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<CartService>(CartService);
        cartRepository = module.get(CartRepository);
        productRepository = module.get(ProductRepository);
        jest.clearAllMocks();
    });

    describe('getCart', () => {
        it('должен получить корзину, создать новую или пробросить ошибку', async () => {
            // Тест 1: Существующая корзина
            setupMockCart([createMockCartProduct(mockProduct)]);
            let result = await service.getCart(mockRequest as Request, mockResponse as Response);
            expectCartResponse(result, [{ productId: 1, name: 'Test Product', price: 2000, quantity: 2 }]);
            expect(cartRepository.findCart).toHaveBeenCalledWith(1);

            // Тест 2: Создание новой корзины
            const requestWithoutCart = { signedCookies: {} };
            cartRepository.createCart.mockResolvedValue(mockEmptyCart);
            result = await service.getCart(requestWithoutCart as Request, mockResponse as Response);
            expectCartResponse(result, []);
            expect(cartRepository.createCart).toHaveBeenCalled();

            // Тест 3: Ошибка базы данных
            const error = new Error('Database error');
            cartRepository.findCart.mockRejectedValue(error);
            await expect(service.getCart(mockRequest as Request, mockResponse as Response)).rejects.toThrow(error);
        });
    });

    describe('appendToCart', () => {
        it('должен добавить товар, создать корзину или выбросить ошибки', async () => {
            // Тест 1: Добавление в существующую корзину
            setupMockProduct();
            setupMockCart([createMockCartProduct(mockProduct)]);
            cartRepository.appendToCart.mockResolvedValue(mockCart);
            let result = await service.appendToCart(mockRequest as Request, mockResponse as Response, 1, 2);
            expectCartResponse(result, [{ productId: 1, name: 'Test Product', price: 2000, quantity: 2 }]);

            // Тест 2: Создание новой корзины
            const requestWithoutCart = { signedCookies: {} };
            cartRepository.createCart.mockResolvedValue(mockEmptyCart);
            cartRepository.findCart.mockResolvedValue(mockEmptyCart);
            result = await service.appendToCart(requestWithoutCart as Request, mockResponse as Response, 1, 2);
            expectCartResponse(result, [{ productId: 1, name: 'Test Product', price: 2000, quantity: 2 }]);

            // Тест 3: Товар не найден
            productRepository.fidProductByPkId.mockResolvedValue(null as unknown as ProductModel);
            await expectNotFoundError(
                () => service.appendToCart(mockRequest as Request, mockResponse as Response, 999, 1),
                'Продукт с id:999 не найден в БД'
            );

            // Тест 4: Корзина не найдена
            setupMockProduct();
            cartRepository.findCart.mockResolvedValue(null as unknown as CartModel);
            await expectNotFoundError(
                () => service.appendToCart(mockRequest as Request, mockResponse as Response, 1, 1),
                'Корзина с id:1 не найдена в БД'
            );

            // Тест 5: Ошибка базы данных
            const error = new Error('Database error');
            productRepository.fidProductByPkId.mockRejectedValue(error);
            await expect(service.appendToCart(mockRequest as Request, mockResponse as Response, 1, 1)).rejects.toThrow(error);
        });
    });

    describe('Cart operations', () => {
        const testOperations = [
            { name: 'increment', method: 'increment', expectedCall: 'increment' },
            { name: 'decrement', method: 'decrement', expectedCall: 'decrement' },
            { name: 'removeProductFromCart', method: 'removeProductFromCart', expectedCall: 'removeFromCart' }
        ];

        testOperations.forEach(({ name, method, expectedCall }) => {
            it(`должен выполнить операцию ${name}`, async () => {
                // Тест 1: Существующая корзина
                setupMockProduct();
                setupMockCart([createMockCartProduct(mockProduct)]);
                ((cartRepository as unknown as Record<string, jest.Mock>)[expectedCall]).mockResolvedValue(mockCart);
                let result = await ((service as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>)[method])(mockRequest as Request, mockResponse as Response, 1, 1);
                expectCartResponse(result, [{ productId: 1, name: 'Test Product', price: 2000, quantity: 2 }]);

                // Тест 2: Создание новой корзины
                const requestWithoutCart = { signedCookies: {} };
                cartRepository.createCart.mockResolvedValue(mockEmptyCart);
                cartRepository.findCart.mockResolvedValue(mockEmptyCart);
                result = await ((service as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>)[method])(requestWithoutCart as Request, mockResponse as Response, 1, 1);
                expectCartResponse(result, [{ productId: 1, name: 'Test Product', price: 2000, quantity: 2 }]);

                // Тест 3: Товар не найден
                productRepository.fidProductByPkId.mockResolvedValue(null as unknown as ProductModel);
                await expectNotFoundError(
                    () => ((service as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>)[method])(mockRequest as Request, mockResponse as Response, 999, 1),
                    'Продукт с id:999 не найден в БД'
                );

                // Тест 4: Корзина не найдена
                setupMockProduct();
                cartRepository.findCart.mockResolvedValue(null as unknown as CartModel);
                await expectNotFoundError(
                    () => ((service as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>)[method])(mockRequest as Request, mockResponse as Response, 1, 1),
                    'Корзина с id:1 не найдена в БД'
                );
            });
        });


        describe('clearCart', () => {
            it('должен очистить корзину', async () => {
                setupMockCart([createMockCartProduct(mockProduct)]);
                cartRepository.clearCart.mockResolvedValue(mockEmptyCart);

                const result = await service.clearCart(mockRequest as Request, mockResponse as Response);

                expectCartResponse(result, []);
                expect(cartRepository.clearCart).toHaveBeenCalledWith(1);
            });

            it('должен создать новую корзину и очистить если cartId отсутствует', async () => {
                const requestWithoutCart = { signedCookies: {} };
                cartRepository.createCart.mockResolvedValue(mockEmptyCart);
                cartRepository.findCart.mockResolvedValue(mockEmptyCart);
                cartRepository.clearCart.mockResolvedValue(mockEmptyCart);

                const result = await service.clearCart(requestWithoutCart as Request, mockResponse as Response);

                expectCartResponse(result, []);
                expect(cartRepository.createCart).toHaveBeenCalled();
            });

            it('должен выбросить NotFoundException если корзина не найдена', async () => {
                cartRepository.findCart.mockResolvedValue(null as unknown as CartModel);

                await expectNotFoundError(
                    () => service.clearCart(mockRequest as Request, mockResponse as Response),
                    'Корзина с id:1 не найдена в БД'
                );
            });
        });
    });

    describe('TransformData (private method)', () => {
        it('должен корректно трансформировать данные корзины с товарами', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformData = (service as any).TransformData.bind(service);

            const result = transformData(mockCart);

            expect(result).toEqual({
                cartId: 1,
                products: [
                    {
                        productId: 1,
                        name: 'Test Product',
                        price: 2000, // 1000 * 2
                        quantity: 2,
                    },
                ],
            });
        });

        it('должен корректно трансформировать пустую корзину', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformData = (service as any).TransformData.bind(service);

            const result = transformData(mockEmptyCart);

            expect(result).toEqual({
                cartId: 1,
                products: [],
            });
        });

        it('должен корректно обработать корзину без товаров', () => {
            const cartWithoutProducts = { ...mockCart, products: undefined };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformData = (service as any).TransformData.bind(service);

            const result = transformData(cartWithoutProducts);

            expect(result).toEqual({
                cartId: 1,
                products: [],
            });
        });
    });

    describe('findCart (private method)', () => {
        it('должен вернуть корзину если она найдена', async () => {
            cartRepository.findCart.mockResolvedValue(mockCart);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const findCart = (service as any).findCart.bind(service);

            const result = await findCart(1);

            expect(result).toBe(mockCart);
            expect(cartRepository.findCart).toHaveBeenCalledWith(1);
        });

        it('должен выбросить NotFoundException если корзина не найдена', async () => {
            cartRepository.findCart.mockResolvedValue(null as unknown as CartModel);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const findCart = (service as any).findCart.bind(service);

            await expect(findCart(999)).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Корзина с id:999 не найдена в БД',
                })
            );
        });
    });

    describe('findProduct (private method)', () => {
        it('должен вернуть товар если он найден', async () => {
            productRepository.fidProductByPkId.mockResolvedValue(mockProduct);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const findProduct = (service as any).findProduct.bind(service);

            const result = await findProduct(1);

            expect(result).toBe(mockProduct);
            expect(productRepository.fidProductByPkId).toHaveBeenCalledWith(1);
        });

        it('должен выбросить NotFoundException если товар не найден', async () => {
            productRepository.fidProductByPkId.mockResolvedValue(null as unknown as ProductModel);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const findProduct = (service as any).findProduct.bind(service);

            await expect(findProduct(999)).rejects.toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Продукт с id:999 не найден в БД',
                })
            );
        });
    });

    describe('notFound (private method)', () => {
        it('должен выбросить NotFoundException с правильным сообщением', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const notFound = (service as any).notFound.bind(service);

            expect(() => notFound('Test message')).toThrow(
                new NotFoundException({
                    status: HttpStatus.NOT_FOUND,
                    message: 'Test message',
                })
            );
        });
    });

    describe('Edge cases', () => {
        const testCases = [
            {
                name: 'корзину с несколькими товарами',
                products: [
                    { id: 1, name: 'Product 1', price: 1000, quantity: 2 },
                    { id: 2, name: 'Product 2', price: 1500, quantity: 1 }
                ],
                expected: [
                    { productId: 1, name: 'Product 1', price: 2000, quantity: 2 },
                    { productId: 2, name: 'Product 2', price: 1500, quantity: 1 }
                ]
            },
            {
                name: 'товар с нулевой ценой',
                products: [{ id: 1, name: 'Free Product', price: 0, quantity: 1 }],
                expected: [{ productId: 1, name: 'Free Product', price: 0, quantity: 1 }]
            },
            {
                name: 'товар с дробной ценой',
                products: [{ id: 1, name: 'Product with decimal price', price: 999.99, quantity: 3 }],
                expected: [{ productId: 1, name: 'Product with decimal price', price: 2999.97, quantity: 3 }]
            }
        ];

        testCases.forEach(({ name, products, expected }) => {
            it(`должен обработать ${name}`, () => {
                const cartProducts = products.map(p => createMockCartProduct(createMockProduct(p.id, p.name, p.price), p.quantity));
                const cart = createMockCart(cartProducts);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const transformData = (service as any).TransformData.bind(service);

                const result = transformData(cart);

                expect(result).toEqual({ cartId: 1, products: expected });
            });
        });
    });

    describe('Integration scenarios', () => {
        it('должен выполнить полный цикл работы с корзиной', async () => {
            cartRepository.findCart.mockResolvedValue(mockEmptyCart);
            productRepository.fidProductByPkId.mockResolvedValue(mockProduct);
            cartRepository.appendToCart.mockResolvedValue(mockCart);
            cartRepository.increment.mockResolvedValue(mockCart);
            cartRepository.decrement.mockResolvedValue(mockCart);
            cartRepository.clearCart.mockResolvedValue(mockEmptyCart);

            let result = await service.getCart(mockRequest as Request, mockResponse as Response);
            expect(result.products).toEqual([]);

            result = await service.appendToCart(mockRequest as Request, mockResponse as Response, 1, 2);
            expect(result.products).toHaveLength(1);

            result = await service.increment(mockRequest as Request, mockResponse as Response, 1, 1);
            expect(result.products[0].quantity).toBe(2);

            result = await service.decrement(mockRequest as Request, mockResponse as Response, 1, 1);
            expect(result.products[0].quantity).toBe(2);

            result = await service.clearCart(mockRequest as Request, mockResponse as Response);
            expect(result.products).toEqual([]);
        });
    });

    describe('Error handling', () => {
        it('должен корректно обрабатывать ошибки базы данных', async () => {
            const dbError = new Error('Connection timeout');
            cartRepository.findCart.mockRejectedValue(dbError);

            await expect(service.getCart(mockRequest as Request, mockResponse as Response)).rejects.toThrow(dbError);
        });

        it('должен корректно обрабатывать ошибки при работе с товарами', async () => {
            const productError = new Error('Product service unavailable');
            productRepository.fidProductByPkId.mockRejectedValue(productError);

            await expect(service.appendToCart(mockRequest as Request, mockResponse as Response, 1, 1)).rejects.toThrow(productError);
        });
    });
});