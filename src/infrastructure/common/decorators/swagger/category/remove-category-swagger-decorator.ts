import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { RemoveCategoryResponse } from '@app/infrastructure/responses';

export function RemoveCategorySwaggerDecorator(): MethodDecorator {
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
