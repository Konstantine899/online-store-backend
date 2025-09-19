import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { RemoveProductResponse } from '@app/infrastructure/responses';

export function RemoveProductSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Удаление продукта' }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'id',
            type: 'string',
            description: 'идентификатор продукта',
            required: true,
        }),
        ApiResponse({
            description: 'Remove product',
            status: HttpStatus.OK,
            type: RemoveProductResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            schema: {
                title: 'Поиск не существующего продукта',
                description: 'Продукт не найден в БД',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/product/delete/666',
                    path: '/online-store/product/delete/666',
                    name: 'NotFoundException',
                    message:
                        'Продукт с идентификатором 666 не найден в базе данных',
                },
            },
        }),
        ApiConflictResponse({
            description: 'Conflict',
            schema: {
                title: 'Конфликт при удалении продукта',
                example: {
                    status: HttpStatus.CONFLICT,
                    message: 'Произошел конфликт во время удаления продукта',
                },
            },
        }),
    );
}
