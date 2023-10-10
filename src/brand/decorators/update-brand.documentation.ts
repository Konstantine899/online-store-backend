import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { UpdateBrandResponse } from '../responses/update-brand.response';

export function UpdateBrandDocumentation() {
    return applyDecorators(
        ApiOperation({ summary: 'Обновление бренда' }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'id',
            type: 'string',
            description: 'Идентификатор бренда',
            required: true,
        }),
        ApiBody({
            type: CreateBrandDto,
            description: 'Структура входящих данных для обновления бренда',
        }),
        ApiResponse({
            description: 'Updated brand',
            status: HttpStatus.OK,
            type: UpdateBrandResponse,
        }),
        ApiBadRequestResponse({
            description: 'Bad Request',
            status: HttpStatus.BAD_REQUEST,
            schema: {
                title: 'Валидация',
                anyOf: [
                    {
                        title: 'Поле name не может быть пустым',
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'name',
                            messages: ['Поле name не может быть пустым'],
                            value: '',
                        },
                    },
                    {
                        title: 'Поле name должно быть строкой',
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'name',
                            messages: ['Поле name должно быть строкой'],
                            value: 1,
                        },
                    },
                ],
            },
        }),
    );
}
