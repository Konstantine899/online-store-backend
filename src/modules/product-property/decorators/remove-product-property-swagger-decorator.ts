import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { RemoveProductPropertyResponse } from '../responses/remove-product-property.response';

export function RemoveProductPropertySwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Удаление свойства продукта' }),
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
            description: 'Remove product property',
            status: HttpStatus.OK,
            type: RemoveProductPropertyResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                anyOf: [
                    {
                        title: 'Продукт не найден',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/product-property/product_id/566/remove-product-property/16',
                            path: '/online-store/product-property/product_id/566/remove-product-property/16',
                            name: 'NotFoundException',
                            message: 'Продукт не найден',
                        },
                    },
                    {
                        title: 'Свойство продукта не найдено',
                        example: {
                            statusCode: 404,
                            url: '/online-store/product-property/product_id/56/remove-product-property/166',
                            path: '/online-store/product-property/product_id/56/remove-product-property/166',
                            name: 'NotFoundException',
                            message: 'Свойство продукта не найдено',
                        },
                    },
                ],
            },
        }),
    );
}
