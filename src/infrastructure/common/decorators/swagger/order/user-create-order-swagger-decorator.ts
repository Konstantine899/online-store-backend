import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiBadRequestResponse,
    ApiOperation,
    ApiResponse,
    OmitType,
} from '@nestjs/swagger';
import { OrderDto } from '@app/infrastructure/dto';
import { orderValidation } from './order.validation';
import { UserCreateOrderResponse } from '@app/infrastructure/responses';

export function UserCreateOrderSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Создание заказа пользователем' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: OmitType(OrderDto, ['userId']),
            description: 'Входящая структура данных для создания заказа',
            schema: {
                examples: {
                    valid: {
                        summary: 'Валидный заказ',
                        value: {
                            name: 'Иванов Иван',
                            email: 'user@example.com',
                            phone: '+375298918971',
                            address: 'г. Минск, ул. Ленина 1',
                            comment: 'Позвонить перед доставкой',
                            items: [
                                { name: 'Xiaomi 10pro', price: 1000, quantity: 1 },
                            ],
                        },
                    },
                    invalid_name: {
                        summary: 'Невалидное ФИО',
                        value: {
                            name: 'Иванов Иван 123',
                            email: 'user@example.com',
                            phone: '+375298918971',
                            address: 'г. Минск, ул. Ленина 1',
                            items: [{ name: 'Xiaomi 10pro', price: 1000, quantity: 1 }],
                        },
                    },
                    invalid_email: {
                        summary: 'Невалидный email',
                        value: {
                            name: 'Иванов Иван',
                            email: 'not-an-email',
                            phone: '+375298918971',
                            address: 'г. Минск, ул. Ленина 1',
                            items: [{ name: 'Xiaomi 10pro', price: 1000, quantity: 1 }],
                        },
                    },
                    invalid_phone: {
                        summary: 'Невалидный телефон',
                        value: {
                            name: 'Иванов Иван',
                            email: 'user@example.com',
                            phone: '12-34',
                            address: 'г. Минск, ул. Ленина 1',
                            items: [{ name: 'Xiaomi 10pro', price: 1000, quantity: 1 }],
                        },
                    },
                    invalid_address: {
                        summary: 'Невалидный адрес (опасные символы)',
                        value: {
                            name: 'Иванов Иван',
                            email: 'user@example.com',
                            phone: '+375298918971',
                            address: '<script>alert(1)</script>',
                            items: [{ name: 'Xiaomi 10pro', price: 1000, quantity: 1 }],
                        },
                    },
                },
            },
        }),
        ApiResponse({
            description: 'User create order',
            status: HttpStatus.CREATED,
            type: UserCreateOrderResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            schema: {
                anyOf: [
                    {
                        title: 'Ваша корзина пуста',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/order/user/create-order?id=574&cartId=31',
                            path: '/online-store/order/guest/create-order',
                            name: 'NotFoundException',
                            message: 'Ваша корзина пуста',
                        },
                    },
                    {
                        title: 'Корзина не найдена',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/order/user/create-order?id=574&cartId=31',
                            path: '/online-store/order/guest/create-order',
                            name: 'NotFoundException',
                            message: 'Корзины с id:26 не найдена БД',
                        },
                    },
                ],
            },
        }),
        ApiBadRequestResponse(orderValidation()),
    );
}
