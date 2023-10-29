import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';

export function GetBrandSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Получить бренд' }),
        ApiParam({
            name: 'id',
            type: 'string',
            description: 'Идентификатор бренда',
            required: true,
        }),
        ApiResponse({
            description: 'Get brand',
            status: HttpStatus.OK,
            schema: {
                title: 'Бренд',
                example: {
                    id: 1,
                    name: 'xiomi',
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Бренд не найден',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/brand/one/11',
                    path: '/online-store/brand/one/11',
                    name: 'NotFoundException',
                    message: 'Бренд не найден',
                },
            },
        }),
    );
}
