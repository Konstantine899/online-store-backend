import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiCookieAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiBody,
    ApiResponse,
    ApiBadRequestResponse,
} from '@nestjs/swagger';
import { DecrementResponse } from '@app/infrastructure/responses';
import { UpdateCartItemDto } from '@app/infrastructure/dto';

export function DecrementSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Уменьшение количества товара в корзине' }),
        ApiCookieAuth(),
        ApiBody({
            type: UpdateCartItemDto,
            description: 'Данные для уменьшения количества товара (amount > 0)',
        }),
        ApiResponse({
            description: 'Количество товара успешно уменьшено',
            status: HttpStatus.OK,
            type: DecrementResponse,
        }),
        ApiBadRequestResponse({
            description: 'Ошибка валидации входных данных',
            schema: {
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    url: '/online-store/cart/items/decrement',
                    path: '/online-store/cart/items/decrement',
                    name: 'BadRequestException',
                    message: [
                        'Укажите ID товара',
                        'Укажите изменение количества',
                    ],
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Корзина или продукт не найдены',
            schema: {
                anyOf: [
                    {
                        title: 'Корзина не найдена в БД',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/cart/items/decrement',
                            path: '/online-store/cart/items/decrement',
                            name: 'NotFoundException',
                            message: 'Корзина с id:26 не найдена в БД',
                        },
                    },
                    {
                        title: 'Продукт не найден в корзине',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/cart/items/decrement',
                            path: '/online-store/cart/items/decrement',
                            name: 'NotFoundException',
                            message: 'Товар с id:56 не найден в корзине',
                        },
                    },
                ],
            },
        }),
    );
}
