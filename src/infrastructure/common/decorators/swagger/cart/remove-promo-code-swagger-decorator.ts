import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiCookieAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { RemovePromoCodeResponse } from '@app/infrastructure/responses';

export function RemovePromoCodeSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Удаление промокода из корзины' }),
        ApiCookieAuth(),
        ApiResponse({
            description: 'Промокод успешно удалён из корзины',
            status: HttpStatus.OK,
            type: RemovePromoCodeResponse,
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
