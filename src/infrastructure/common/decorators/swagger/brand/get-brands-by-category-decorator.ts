import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { ListAllBrandsResponse } from '@app/infrastructure/responses';

export function GetBrandsByCategoryDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Получение списка брендов по category_id' }),
        ApiParam({
            name: 'categoryId',
            type: 'number',
            description: 'category id',
            required: true,
        }),
        ApiResponse({
            description: 'Список всех brands по category_id',
            status: HttpStatus.OK,
            type: [ListAllBrandsResponse],
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Список брендов пуст',
                example: {
                    status: HttpStatus.NOT_FOUND,
                    message: 'К сожалению по вашему запросу ничего не найдено',
                },
            },
        }),
    );
}
