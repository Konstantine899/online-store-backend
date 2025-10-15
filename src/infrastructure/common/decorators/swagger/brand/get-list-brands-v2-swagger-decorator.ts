import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GetListBrandsV2Response } from '@app/infrastructure/responses/brand/get-list-brands-v2.response';

export function GetListBrandsV2SwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение списка брендов с пагинацией (V2)',
            description: 'Возвращает список брендов с поддержкой пагинации, поиска и сортировки. Изолировано по tenant_id.',
        }),
        ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы', example: 1 }),
        ApiQuery({ name: 'size', required: false, type: Number, description: 'Элементов на странице', example: 5 }),
        ApiQuery({ name: 'search', required: false, type: String, description: 'Поиск по названию', example: 'apple' }),
        ApiQuery({ name: 'sort', required: false, type: String, enum: ['ASC', 'DESC'], example: 'DESC' }),
        ApiResponse({ status: HttpStatus.OK, type: GetListBrandsV2Response }),
        ApiNotFoundResponse({ description: 'Бренды не найдены' }),
    );
}

