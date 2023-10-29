import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { RemoveCategoryResponse } from '../responses/remove-category.response';

export function RemoveCategorySwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Удаление категории' }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'id',
            type: 'string',
            description: 'Идентификатор категории',
            required: true,
        }),
        ApiResponse({
            description: 'Remove category',
            status: HttpStatus.OK,
            type: RemoveCategoryResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Категория не найдена',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/category/delete/111',
                    path: '/online-store/category/delete/111',
                    name: 'NotFoundException',
                    message: 'Категория товара не найдена',
                },
            },
        }),
    );
}
