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
import { UpdateProductPropertyResponse } from '@app/infrastructure/responses';

export function UpdateProductPropertySwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Обновление свойства продукта' }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'productId',
            type: String,
            description: 'Идентификатор  продукта',
            required: true,
        }),
        ApiParam({
            name: 'id',
            type: String,
            description: 'Идентификатор свойства  продукта',
            required: true,
        }),
        ApiBody({
            type: CreateProductPropertyDto,
            description: 'Структура данных для обновления свойства продукта',
        }),
        ApiResponse({
            description: 'Updated product property',
            status: HttpStatus.OK,
            type: UpdateProductPropertyResponse,
        }),
        ApiBadRequestResponse({
            description: 'Bad Request',
            status: HttpStatus.BAD_REQUEST,
            schema: {
                anyOf: [
                    {
                        title: 'Имя свойства не должно быть пустым',
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'name',
                            messages: ['Имя свойства не должно быть пустым'],
                            value: '',
                        },
                    },
                    {
                        title: 'Значение свойства не должно быть пустым',
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
                        title: 'Имя свойства  должно быть строкой',
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'name',
                            messages: ['Имя свойства  должно быть строкой'],
                            value: 1,
                        },
                    },
                    {
                        title: 'Значение свойства  должно быть строкой',
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
            status: HttpStatus.NOT_FOUND,
            schema: {
                anyOf: [
                    {
                        title: 'Продукт не найден',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/product-property/product_id/566/create',
                            path: '/online-store/product-property/product_id/566/create',
                            name: 'NotFoundException',
                            message: 'Продукт не найден',
                        },
                    },
                    {
                        title: 'Свойство продукта не найдено',
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            url: '/online-store/product-property/product_id/56/update_property/134',
                            path: '/online-store/product-property/product_id/56/update_property/134',
                            name: 'NotFoundException',
                            message: 'Свойство продукта не найдено',
                        },
                    },
                ],
            },
        }),
    );
}
