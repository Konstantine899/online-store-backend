import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { PaginatedResponse } from '@app/infrastructure/responses/paginated.response';
import { ProductInfo } from '@app/infrastructure/paginate';

export function GetAllByBrandIdAndCategoryIdV2SwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ 
            summary: 'Получение списка продуктов по бренду и категории (новый формат пагинации)',
            description: 'Возвращает список продуктов определенного бренда и категории в формате { data, meta }'
        }),
        ApiParam({
            name: 'brandId',
            type: Number,
            description: 'ID бренда',
            example: 1,
        }),
        ApiParam({
            name: 'categoryId',
            type: Number,
            description: 'ID категории',
            example: 1,
        }),
        ApiQuery({
            name: 'page',
            required: false,
            type: Number,
            description: 'Номер страницы (по умолчанию: 1)',
            example: 1,
        }),
        ApiQuery({
            name: 'size',
            required: false,
            type: Number,
            description: 'Количество элементов на странице (по умолчанию: 5)',
            example: 5,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Список продуктов бренда и категории с метаданными пагинации',
            type: PaginatedResponse<ProductInfo>,
        }),
    );
}