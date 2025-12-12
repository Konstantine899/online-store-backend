import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiCookieAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiBody,
    ApiResponse,
    ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ApplyPromoCodeResponse } from '@app/infrastructure/responses';
import { ApplyCouponDto } from '@app/infrastructure/dto';

export function ApplyPromoCodeSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Применение промокода к корзине' }),
        ApiCookieAuth(),
        ApiBody({
            type: ApplyCouponDto,
            description: 'Код промокода для применения скидки',
        }),
        ApiResponse({
            description: 'Промокод успешно применён к корзине',
            status: HttpStatus.OK,
            type: ApplyPromoCodeResponse,
        }),
        ApiBadRequestResponse({
            description: 'Ошибка валидации или неверный промокод',
            schema: {
                anyOf: [
                    {
                        title: 'Ошибка валидации',
                        example: {
                            statusCode: HttpStatus.BAD_REQUEST,
                            url: '/online-store/cart/promo-code',
                            path: '/online-store/cart/promo-code',
                            name: 'BadRequestException',
                            message: [
                                'Укажите код промокода',
                                'Код промокода должен содержать минимум 3 символа',
                            ],
                        },
                    },
                    {
                        title: 'Неверный промокод',
                        example: {
                            statusCode: HttpStatus.BAD_REQUEST,
                            url: '/online-store/cart/promo-code',
                            path: '/online-store/cart/promo-code',
                            name: 'BadRequestException',
                            message: 'Промокод недействителен или истёк',
                        },
                    },
                ],
            },
        }),
        ApiNotFoundResponse({
            description: 'Корзина не найдена',
            schema: {
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/cart/promo-code',
                    path: '/online-store/cart/promo-code',
                    name: 'NotFoundException',
                    message: 'Корзина не найдена',
                },
            },
        }),
    );
}
