import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { CreateProductPropertyDto } from '@app/infrastructure/dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { CreateProductPropertyResponse } from '@app/infrastructure/responses';

export function CreateProductPropertySwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Создать свойство продукта' }),
        ApiBearerAuth('JWT-auth'),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'productId',
            type: String,
            description: 'Идентификатор  продукта',
            required: true,
        }),
        ApiBody({
            type: CreateProductPropertyDto,
            description: 'Структура данных для создания свойства продукта',
        }),
        ApiResponse({
            description: 'Created product property',
            status: HttpStatus.CREATED,
            type: CreateProductPropertyResponse,
        }),
        ApiBadRequestResponse({
            description: 'Bad Request',
            schema: {
                anyOf: [
                    {
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'name',
                            messages: ['Имя свойства не должно быть пустым'],
                            value: '',
                        },
                    },
                    {
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'value',
                            messages: [
                                'Значение свойства не должно быть пустым',
                            ],
                            value: '',
                        },
                    },
                    {
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'name',
                            messages: ['Имя свойства  должно быть строкой'],
                            value: 1,
                        },
                    },
                    {
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'value',
                            messages: [
                                'Значение свойства  должно быть строкой',
                            ],
                            value: 1,
                        },
                    },
                ],
            },
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            schema: {
                title: 'Не найден продукт',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/product-property/product_id/566/create',
                    path: '/online-store/product-property/product_id/566/create',
                    name: 'NotFoundException',
                    message: 'Продукт не найден',
                },
            },
        }),
    );
}
