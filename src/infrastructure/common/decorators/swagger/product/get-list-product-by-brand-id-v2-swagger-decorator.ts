import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductInfo } from '@app/infrastructure/paginate';
import { PaginatedResponse } from '@app/infrastructure/responses/paginate/paginated.response';

export function GetListProductByBrandIdV2SwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary:
                'Получение списка продуктов по бренду (новый формат пагинации)',
            description:
                'Возвращает список продуктов определенного бренда в формате { data, meta }',
        }),
        ApiParam({
            name: 'brandId',
            type: Number,
            description: 'ID бренда',
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
            description: 'Список продуктов бренда с метаданными пагинации',
            type: PaginatedResponse<ProductInfo>,
        }),
    );
}
