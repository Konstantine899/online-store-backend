import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GetListBrandsV2Response } from '@app/infrastructure/responses/brand/get-list-brands-v2.response';

export function GetListBrandsByCategoryV2SwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение брендов по категории с пагинацией (V2)',
            description: 'Возвращает список брендов для конкретной категории с пагинацией. Изолировано по tenant_id.',
        }),
        ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
        ApiQuery({ name: 'size', required: false, type: Number, example: 5 }),
        ApiQuery({ name: 'search', required: false, type: String, example: 'samsung' }),
        ApiQuery({ name: 'sort', required: false, type: String, enum: ['ASC', 'DESC'], example: 'DESC' }),
        ApiResponse({ status: HttpStatus.OK, type: GetListBrandsV2Response }),
        ApiNotFoundResponse({ description: 'Бренды не найдены' }),
    );
}

