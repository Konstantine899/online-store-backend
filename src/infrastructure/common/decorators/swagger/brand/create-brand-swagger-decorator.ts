import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { BrandDto } from '@app/infrastructure/dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { CreateBrandResponse } from '@app/infrastructure/responses';

export function CreateBrandSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Создание бренда продукта' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: BrandDto,
            description: 'Структура входящих данных для создания бренда',
        }),
        ApiResponse({
            description: 'Created brand',
            status: HttpStatus.CREATED,
            type: CreateBrandResponse,
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
                    {
                        title: 'Поле category_id не может быть пустым',
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'category_id',
                            messages: ['Поле category_id не может быть пустым'],
                            value: undefined,
                        },
                    },
                    {
                        title: 'Поле category_id должно быть number',
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'category_id',
                            messages: ['Поле category_id должно быть number'],
                            value: '',
                        },
                    },
                ],
            },
        }),
    );
}
