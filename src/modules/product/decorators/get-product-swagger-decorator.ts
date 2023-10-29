import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { GetProductResponse } from '../responses/get-product.response';

export function GetProductSwaggerDecorator(): Function {
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
            status: HttpStatus.NOT_FOUND,
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
