import type {
    CartModel,
    OrderItemModel,
    OrderModel,
    UserModel,
} from '@app/domain/models';
import type { OrderDto } from '@app/infrastructure/dto';
import {
    CartRepository,
    OrderRepository,
    UserRepository,
} from '@app/infrastructure/repositories';
import type {
    AdminGetOrderUserResponse,
    UserGetOrderResponse,
} from '@app/infrastructure/responses';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { OrderService } from './order.service';

// Упрощенные mock объекты
const mockOrder = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    phone: '375298918971',
    address: 'Test Address',
    amount: 1000,
    status: 0,
    comment: 'Test comment',
    user_id: 1,
    items: [],
} as unknown as OrderModel;
const mockCart = {
    id: 1,
    products: [{ id: 1, name: 'Test Product', price: 500 }],
} as unknown as CartModel;
const mockEmptyCart = { id: 1, products: [] } as unknown as CartModel;
const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
} as unknown as UserModel;
const mockOrderItem = {
    id: 1,
    productId: 1,
    quantity: 2,
    price: 500,
} as unknown as OrderItemModel;

const mockOrderDto: OrderDto = {
    userId: 1,
    name: 'Test User',
    email: 'test@example.com',
    phone: '375298918971',
    address: 'Test Address',
    comment: 'Test comment',
    items: [mockOrderItem],
};

describe('OrderService', () => {
    let service: OrderService;
    let orderRepository: jest.Mocked<OrderRepository>;
    let cartRepository: jest.Mocked<CartRepository>;
    let userService: jest.Mocked<UserService>;
    let userRepository: jest.Mocked<UserRepository>;

    // Упрощенные helper функции
    const setupOrder = (orders = [mockOrder]): void => {
        orderRepository.adminFindOrderListUser.mockResolvedValue(orders);
    };
    const setupUser = (user = mockUser): void => {
        userRepository.findUserByPkId.mockResolvedValue(user);
    };
    const setupCart = (cart = mockCart): void => {
        cartRepository.findCart.mockResolvedValue(cart);
    };
    const expectNotFound = async (
        operation: () => Promise<unknown>,
        message: string,
    ): Promise<void> => {
        await expect(operation()).rejects.toThrow(
            new NotFoundException({ status: HttpStatus.NOT_FOUND, message }),
        );
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrderService,
                {
                    provide: OrderRepository,
                    useValue: {
                        adminFindOrderListUser: jest.fn(),
                        adminFindOrderUser: jest.fn(),
                        findUserAndHisOrders: jest.fn(),
                        adminCreateOrder: jest.fn(),
                        findOrder: jest.fn(),
                        removeOrder: jest.fn(),
                        userFindOrderList: jest.fn(),
                        userFindOrder: jest.fn(),
                        createOrder: jest.fn(),
                    },
                },
                {
                    provide: CartRepository,
                    useValue: {
                        findCart: jest.fn(),
                        clearCart: jest.fn(),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        getUser: jest.fn(),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {
                        findUserByPkId: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<OrderService>(OrderService);
        orderRepository = module.get(OrderRepository);
        cartRepository = module.get(CartRepository);
        userService = module.get(UserService);
        userRepository = module.get(UserRepository);
        jest.clearAllMocks();
    });

    describe('adminGetStoreOrderList', () => {
        it('должен получить список заказов магазина', async () => {
            setupOrder();
            const result = await service.adminGetStoreOrderList();
            expect(result).toEqual([mockOrder]);
            expect(orderRepository.adminFindOrderListUser).toHaveBeenCalled();
        });

        it('должен выбросить NotFoundException если список заказов пуст', async () => {
            orderRepository.adminFindOrderListUser.mockResolvedValue([]);
            await expectNotFound(
                () => service.adminGetStoreOrderList(),
                'Список заказов магазина пуст',
            );
        });
    });

    describe('adminGetOrderListUser', () => {
        it('должен получить список заказов пользователя', async () => {
            setupUser();
            setupOrder();
            const result = await service.adminGetOrderListUser(1);
            expect(result).toEqual([mockOrder]);
            expect(userRepository.findUserByPkId).toHaveBeenCalledWith(1);
            expect(orderRepository.adminFindOrderListUser).toHaveBeenCalledWith(
                1,
            );
        });

        it('должен выбросить NotFoundException если пользователь не найден', async () => {
            userRepository.findUserByPkId.mockResolvedValue(
                null as unknown as UserModel,
            );
            await expectNotFound(
                () => service.adminGetOrderListUser(999),
                'Пользователь не найден в БД',
            );
        });

        it('должен выбросить NotFoundException если список заказов пользователя пуст', async () => {
            setupUser();
            orderRepository.adminFindOrderListUser.mockResolvedValue([]);
            await expectNotFound(
                () => service.adminGetOrderListUser(1),
                'Список заказов пользователя email: test@example.com пуст',
            );
        });
    });

    describe('adminGetOrderUser', () => {
        it('должен получить заказ пользователя', async () => {
            orderRepository.adminFindOrderUser.mockResolvedValue(mockOrder);
            const result = await service.adminGetOrderUser(1);
            expect(result).toEqual(mockOrder);
            expect(orderRepository.adminFindOrderUser).toHaveBeenCalledWith(1);
        });

        it('должен выбросить NotFoundException если заказ не найден', async () => {
            orderRepository.adminFindOrderUser.mockResolvedValue(
                null as unknown as AdminGetOrderUserResponse,
            );
            await expectNotFound(
                () => service.adminGetOrderUser(999),
                'Заказ не найден',
            );
        });
    });

    describe('adminCreateOrder', () => {
        it('должен создать новый заказ если у пользователя нет заказов', async () => {
            orderRepository.findUserAndHisOrders.mockResolvedValue(
                null as unknown as OrderModel,
            );
            orderRepository.adminCreateOrder.mockResolvedValue(mockOrder);

            const result = await service.adminCreateOrder(mockOrderDto);

            expect(result).toEqual(mockOrder);
            expect(orderRepository.findUserAndHisOrders).toHaveBeenCalledWith(
                1,
            );
            expect(orderRepository.adminCreateOrder).toHaveBeenCalledWith(
                mockOrderDto,
            );
        });

        it('должен вернуть существующий заказ если у пользователя уже есть заказы', async () => {
            orderRepository.findUserAndHisOrders.mockResolvedValue(mockOrder);

            const result = await service.adminCreateOrder(mockOrderDto);

            expect(result).toEqual(mockOrder);
            expect(orderRepository.findUserAndHisOrders).toHaveBeenCalledWith(
                1,
            );
            expect(orderRepository.adminCreateOrder).not.toHaveBeenCalled();
        });

        it('должен выбросить ошибку если userId не указан', async () => {
            const dtoWithoutUserId = { ...mockOrderDto, userId: undefined };

            await expect(
                service.adminCreateOrder(dtoWithoutUserId),
            ).rejects.toThrow('userId обязательно для создания заказа');
        });
    });

    describe('adminRemoveOrder', () => {
        it('должен удалить заказ', async () => {
            orderRepository.findOrder.mockResolvedValue(mockOrder);
            orderRepository.removeOrder.mockResolvedValue(1);

            const result = await service.adminRemoveOrder(1);

            expect(result).toEqual({
                status: HttpStatus.OK,
                message: 'success',
            });
            expect(orderRepository.findOrder).toHaveBeenCalledWith(1);
            expect(orderRepository.removeOrder).toHaveBeenCalledWith(1);
        });

        it('должен выбросить NotFoundException если заказ не найден', async () => {
            orderRepository.findOrder.mockResolvedValue(
                null as unknown as OrderModel,
            );

            await expectNotFound(
                () => service.adminRemoveOrder(999),
                'Заказ не найден',
            );
        });
    });

    describe('userGetOrderList', () => {
        it('должен получить список заказов пользователя', async () => {
            orderRepository.userFindOrderList.mockResolvedValue([mockOrder]);
            const result = await service.userGetOrderList(1);
            expect(result).toEqual([mockOrder]);
            expect(orderRepository.userFindOrderList).toHaveBeenCalledWith(1);
        });

        it('должен выбросить NotFoundException если заказы не найдены', async () => {
            orderRepository.userFindOrderList.mockResolvedValue([]);
            await expectNotFound(
                () => service.userGetOrderList(1),
                'Заказы не найдены',
            );
        });
    });

    describe('userGetOrder', () => {
        it('должен получить заказ пользователя', async () => {
            orderRepository.userFindOrder.mockResolvedValue(mockOrder);
            const result = await service.userGetOrder(1, 1);
            expect(result).toEqual(mockOrder);
            expect(orderRepository.userFindOrder).toHaveBeenCalledWith(1, 1);
        });

        it('должен выбросить NotFoundException если заказ не найден', async () => {
            orderRepository.userFindOrder.mockResolvedValue(
                null as unknown as UserGetOrderResponse,
            );
            await expectNotFound(
                () => service.userGetOrder(999, 1),
                'Заказ не найден',
            );
        });
    });

    describe('userCreateOrder', () => {
        it('должен создать заказ пользователя', async () => {
            userService.getUser.mockResolvedValue(mockUser);
            setupCart();
            orderRepository.createOrder.mockResolvedValue(mockOrder);
            cartRepository.clearCart.mockResolvedValue(mockCart);

            const result = await service.userCreateOrder(mockOrderDto, 1, 1);

            expect(result).toEqual(mockOrder);
            expect(userService.getUser).toHaveBeenCalledWith(1);
            expect(cartRepository.findCart).toHaveBeenCalledWith(1);
            expect(orderRepository.createOrder).toHaveBeenCalledWith(
                mockOrderDto,
                1,
            );
            expect(cartRepository.clearCart).toHaveBeenCalledWith(1);
        });
    });

    describe('guestCreateOrder', () => {
        it('должен создать заказ гостя', async () => {
            userService.getUser.mockResolvedValue(mockUser);
            setupCart();
            orderRepository.createOrder.mockResolvedValue(mockOrder);
            cartRepository.clearCart.mockResolvedValue(mockCart);

            const result = await service.guestCreateOrder(mockOrderDto, 1, 1);

            expect(result).toEqual(mockOrder);
            expect(userService.getUser).toHaveBeenCalledWith(1);
            expect(cartRepository.findCart).toHaveBeenCalledWith(1);
            expect(orderRepository.createOrder).toHaveBeenCalledWith(
                mockOrderDto,
                1,
            );
            expect(cartRepository.clearCart).toHaveBeenCalledWith(1);
        });

        it('должен выбросить ошибку если userId или cartId не указаны', async () => {
            await expect(
                service.guestCreateOrder(mockOrderDto, undefined, undefined),
            ).rejects.toThrow(
                'userId и cartId обязательны для создания заказа',
            );
        });
    });

    describe('createOrder (private method)', () => {
        it('должен создать заказ и очистить корзину', async () => {
            userService.getUser.mockResolvedValue(mockUser);
            setupCart();
            orderRepository.createOrder.mockResolvedValue(mockOrder);
            cartRepository.clearCart.mockResolvedValue(mockCart);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (service as any).createOrder(
                mockOrderDto,
                1,
                1,
            );

            expect(result).toEqual(mockOrder);
            expect(userService.getUser).toHaveBeenCalledWith(1);
            expect(cartRepository.findCart).toHaveBeenCalledWith(1);
            expect(orderRepository.createOrder).toHaveBeenCalledWith(
                mockOrderDto,
                1,
            );
            expect(cartRepository.clearCart).toHaveBeenCalledWith(1);
        });

        it('должен выбросить NotFoundException если корзина не найдена', async () => {
            userService.getUser.mockResolvedValue(mockUser);
            cartRepository.findCart.mockResolvedValue(
                null as unknown as CartModel,
            );

            await expectNotFound(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                () => (service as any).createOrder(mockOrderDto, 1, 999),
                'Корзины с id:999 не найдена БД',
            );
        });

        it('должен выбросить NotFoundException если корзина пуста', async () => {
            userService.getUser.mockResolvedValue(mockUser);
            setupCart(mockEmptyCart);

            await expectNotFound(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                () => (service as any).createOrder(mockOrderDto, 1, 1),
                'Ваша корзина пуста',
            );
        });

        it('должен пропустить проверку пользователя если userId равен 0', async () => {
            setupCart();
            orderRepository.createOrder.mockResolvedValue(mockOrder);
            cartRepository.clearCart.mockResolvedValue(mockCart);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (service as any).createOrder(
                mockOrderDto,
                0,
                1,
            );

            expect(result).toEqual(mockOrder);
            expect(userService.getUser).not.toHaveBeenCalled();
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
                }),
            );
        });
    });

    describe('Edge cases', () => {
        it('должен обработать заказ с нулевой суммой', async () => {
            const zeroAmountOrder = { ...mockOrderDto };
            userService.getUser.mockResolvedValue(mockUser);
            setupCart();
            orderRepository.createOrder.mockResolvedValue({
                ...mockOrder,
                amount: 0,
            } as unknown as OrderModel);
            cartRepository.clearCart.mockResolvedValue(mockCart);

            const result = await service.userCreateOrder(zeroAmountOrder, 1, 1);

            expect(result.amount).toBe(0);
        });

        it('должен обработать заказ без комментария', async () => {
            const orderWithoutComment = { ...mockOrderDto, comment: '' };
            userService.getUser.mockResolvedValue(mockUser);
            setupCart();
            orderRepository.createOrder.mockResolvedValue({
                ...mockOrder,
                comment: '',
            } as unknown as OrderModel);
            cartRepository.clearCart.mockResolvedValue(mockCart);

            const result = await service.userCreateOrder(
                orderWithoutComment,
                1,
                1,
            );

            expect(result.comment).toBe('');
        });
    });

    describe('Error handling', () => {
        it('должен корректно обрабатывать ошибки базы данных', async () => {
            const dbError = new Error('Database connection failed');
            orderRepository.adminFindOrderListUser.mockRejectedValue(dbError);

            await expect(service.adminGetStoreOrderList()).rejects.toThrow(
                dbError,
            );
        });

        it('должен корректно обрабатывать ошибки при работе с корзиной', async () => {
            const cartError = new Error('Cart service unavailable');
            cartRepository.findCart.mockRejectedValue(cartError);

            await expect(
                service.userCreateOrder(mockOrderDto, 1, 1),
            ).rejects.toThrow(cartError);
        });
    });
});
