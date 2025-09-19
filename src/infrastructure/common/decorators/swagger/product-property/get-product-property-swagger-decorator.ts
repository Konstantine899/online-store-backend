import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { GetProductPropertyResponse } from '@app/infrastructure/responses';

export function GetProductPropertySwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Получение свойства продукта' }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'productId',
            type: String,
            description: 'Идентификатор  продукта',
            required: true,
        }),
        ApiParam({
            name: 'id',
            type: String,
            description: 'Идентификатор свойства  продукта',
            required: true,
        }),
        ApiResponse({
            description: 'Get product property',
            status: HttpStatus.OK,
            type: GetProductPropertyResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            schema: {
                anyOf: [
                    {
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/product-property/product_id/566/get-property/10',
                            path: '/online-store/product-property/product_id/566/get-property/10',
                            name: 'NotFoundException',
                            message: 'Продукт не найден',
                        },
                    },
                    {
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/product-property/product_id/56/get-property/101',
                            path: '/online-store/product-property/product_id/56/get-property/101',
                            name: 'NotFoundException',
                            message: 'Свойство продукта не найдено',
                        },
                    },
                ],
            },
        }),
    );
}
