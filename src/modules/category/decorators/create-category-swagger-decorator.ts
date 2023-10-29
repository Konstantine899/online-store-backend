import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { CreateCategoryResponse } from '../responses/create-category.response';

export function CreateCategorySwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Создание категории' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: CreateCategoryDto,
            description: 'Структура данных для создания категории',
        }),
        ApiResponse({
            description: 'Created category',
            status: HttpStatus.CREATED,
            type: CreateCategoryResponse,
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
