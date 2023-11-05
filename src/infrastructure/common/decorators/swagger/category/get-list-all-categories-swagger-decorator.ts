import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { ListAllCategoriesResponse } from '@app/infrastructure/responses';

export function GetListAllCategoriesSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Получение списка всех категорий' }),
        ApiResponse({
            description: 'Get list all categories',
            status: HttpStatus.OK,
            type: [ListAllCategoriesResponse],
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Список категорий пуст',
                example: {
                    status: HttpStatus.NOT_FOUND,
                    message: 'Категории товаров не найдены',
                },
            },
        }),
    );
}
