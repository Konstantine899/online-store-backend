import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { CreateCategoryDto } from '../../../../dto/category/create-category.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { UpdateCategoryResponse } from '../../../../responses/category/update-category.response';

export function UpdateCategorySwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Обновление категории' }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'id',
            type: 'string',
            description: 'Идентификатор категории',
            required: true,
        }),
        ApiBody({
            type: CreateCategoryDto,
            description: 'Структура данных для обновления категории',
        }),
        ApiResponse({
            description: 'Updated category',
            status: HttpStatus.OK,
            type: UpdateCategoryResponse,
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
        ApiNotFoundResponse({
            description: 'Not found',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Категория не найдена',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/category/update/44',
                    path: '/online-store/category/update/44',
                    name: 'NotFoundException',
                    message: 'Категория товара не найдена',
                },
            },
        }),
    );
}
