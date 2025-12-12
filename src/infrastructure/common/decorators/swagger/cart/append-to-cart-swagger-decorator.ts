import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiCookieAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiBody,
    ApiResponse,
    ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AppendToCartResponse } from '@app/infrastructure/responses';
import { AddToCartDto } from '@app/infrastructure/dto';

export function AppendToCartSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Добавление продукта в корзину' }),
        ApiCookieAuth(),
        ApiBody({
            type: AddToCartDto,
            description: 'Данные для добавления товара в корзину',
        }),
        ApiResponse({
            description: 'Товар успешно добавлен в корзину',
            status: HttpStatus.OK,
            type: AppendToCartResponse,
        }),
        ApiBadRequestResponse({
            description: 'Ошибка валидации входных данных',
            schema: {
                example: {
                    statusCode: HttpStatus.BAD_REQUEST,
                    url: '/online-store/cart/items',
                    path: '/online-store/cart/items',
                    name: 'BadRequestException',
                    message: ['Укажите ID товара', 'Укажите количество товара'],
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
                            url: '/online-store/cart/items',
                            path: '/online-store/cart/items',
                            name: 'NotFoundException',
                            message: 'Корзина с id:25 не найдена в БД',
                        },
                    },
                    {
                        title: 'Продукт не найден в БД',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/cart/items',
                            path: '/online-store/cart/items',
                            name: 'NotFoundException',
                            message: 'Продукт с id:56 не найден в БД',
                        },
                    },
                ],
            },
        }),
    );
}
