import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GetListProductV2Response } from '@app/infrastructure/responses/product/get-list-product-v2.response';

export function GetListProductV2SwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получение списка продуктов (новый формат пагинации)',
            description: 'Возвращает список продуктов в формате { data, meta }',
        }),
        ApiQuery({
            name: 'page',
            required: false,
            type: Number,
            description: 'Номер страницы (по умолчанию: 1)',
            example: 1,
        }),
        ApiQuery({
            name: 'limit',
            required: false,
            type: Number,
            description: 'Количество элементов на странице (по умолчанию: 5)',
            example: 5,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Список продуктов с метаданными пагинации',
            type: GetListProductV2Response,
        }),
    );
}
