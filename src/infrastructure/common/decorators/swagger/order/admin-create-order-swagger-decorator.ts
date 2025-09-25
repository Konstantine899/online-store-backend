import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { OrderDto } from '@app/infrastructure/dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { orderValidation } from './order.validation';
import { AdminCreateOrderResponse } from '@app/infrastructure/responses';

export function AdminCreateOrderSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Создание заказа администратором' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: OrderDto,
            description: 'Структура входных данных для создания заказа',
            schema: {
                examples: {
                    valid: {
                        summary: 'Валидный заказ',
                        value: {
                            userId: 1,
                            name: 'Иванов Иван',
                            email: 'user@example.com',
                            phone: '+375298918971',
                            address: 'г. Минск, ул. Ленина 1',
                            comment: 'Позвонить перед доставкой',
                            items: [
                                {
                                    name: 'Xiaomi 10pro',
                                    price: 1000,
                                    quantity: 1,
                                },
                            ],
                        },
                    },
                    invalid_name: {
                        summary: 'Невалидное ФИО',
                        value: {
                            userId: 1,
                            name: 'Иванов Иван 123',
                            email: 'user@example.com',
                            phone: '+375298918971',
                            address: 'г. Минск, ул. Ленина 1',
                            items: [
                                {
                                    name: 'Xiaomi 10pro',
                                    price: 1000,
                                    quantity: 1,
                                },
                            ],
                        },
                    },
                    invalid_email: {
                        summary: 'Невалидный email',
                        value: {
                            userId: 1,
                            name: 'Иванов Иван',
                            email: 'not-an-email',
                            phone: '+375298918971',
                            address: 'г. Минск, ул. Ленина 1',
                            items: [
                                {
                                    name: 'Xiaomi 10pro',
                                    price: 1000,
                                    quantity: 1,
                                },
                            ],
                        },
                    },
                    invalid_phone: {
                        summary: 'Невалидный телефон',
                        value: {
                            userId: 1,
                            name: 'Иванов Иван',
                            email: 'user@example.com',
                            phone: '12-34',
                            address: 'г. Минск, ул. Ленина 1',
                            items: [
                                {
                                    name: 'Xiaomi 10pro',
                                    price: 1000,
                                    quantity: 1,
                                },
                            ],
                        },
                    },
                    invalid_address: {
                        summary: 'Невалидный адрес (опасные символы)',
                        value: {
                            userId: 1,
                            name: 'Иванов Иван',
                            email: 'user@example.com',
                            phone: '+375298918971',
                            address: '<script>alert(1)</script>',
                            items: [
                                {
                                    name: 'Xiaomi 10pro',
                                    price: 1000,
                                    quantity: 1,
                                },
                            ],
                        },
                    },
                },
            },
        }),
        ApiResponse({
            description: 'Admin create order',
            status: HttpStatus.CREATED,
            type: AdminCreateOrderResponse,
        }),
        ApiBadRequestResponse(orderValidation()),
    );
}
