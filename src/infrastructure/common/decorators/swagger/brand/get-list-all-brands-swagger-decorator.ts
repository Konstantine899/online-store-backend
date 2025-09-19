import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { ListAllBrandsResponse } from '@app/infrastructure/responses';

export function GetListAllBrandsSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Получить список всех брендов' }),
        ApiResponse({
            description: 'Get list all brands',
            status: HttpStatus.OK,
            type: [ListAllBrandsResponse],
        }),
        ApiNotFoundResponse({
            description: 'Not found',
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
