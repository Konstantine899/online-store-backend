import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { GetProductResponse } from '@app/infrastructure/responses';

export function GetProductSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Получение продукта' }),
        ApiParam({
            name: 'id',
            type: 'string',
            description: 'Идентификатор продукта',
            required: true,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            type: GetProductResponse,
        }),
        ApiNotFoundResponse({
            schema: {
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/product/one/1',
                    path: '/online-store/product/one/1',
                    name: 'NotFoundException',
                    message: 'Продукт не найден',
                },
            },
        }),
    );
}
