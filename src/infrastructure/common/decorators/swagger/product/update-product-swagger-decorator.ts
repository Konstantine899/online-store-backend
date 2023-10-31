import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiConsumes,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
} from '@nestjs/swagger';
import { CreateProductDto } from '../../../../dto/product/create-product.dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { UpdateProductResponse } from '../../../../responses/product/update-product.response';

export function UpdateProductSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Обновление продукта' }),
        ApiBearerAuth('JWT-auth'),
        ApiConsumes('multipart/form-data'),
        ApiParam({
            name: 'id',
            type: String,
            description: 'идентификатор продукта',
            required: true,
        }),
        ApiBody({
            type: CreateProductDto,
            description: 'Структура входных данных для обновления продукта',
        }),
        ApiResponse({
            description: 'Updated product',
            status: HttpStatus.OK,
            type: UpdateProductResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not found updated product',
            status: HttpStatus.NOT_FOUND,
            schema: {
                title: 'Продукт не найден в БД',
                example: {
                    statusCode: HttpStatus.NOT_FOUND,
                    url: '/online-store/product/update/111',
                    path: '/online-store/product/update/111',
                    name: 'NotFoundException',
                    message: 'Продукт не найден в БД',
                },
            },
        }),
        ApiBadRequestResponse({
            description: 'Bad Request',
            status: HttpStatus.BAD_REQUEST,
            schema: {
                title: 'Валидация',
                anyOf: [
                    {
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'name',
                            messages: ['Имя не должно быть пустым'],
                            value: '',
                        },
                    },
                    {
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'price',
                            messages: [
                                'Цена продукта должна быть числом c двумя знаками после точки',
                            ],
                            value: null,
                        },
                    },
                    {
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            message: 'Поле image не должно быть пустым',
                        },
                    },
                    {
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            message: 'разрешены только файлы изображений',
                        },
                    },
                    {
                        example: {
                            statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
                            message: 'File too large',
                            error: 'Payload Too Large',
                        },
                    },
                ],
            },
        }),
        ApiConflictResponse({
            description: 'Conflict',
            status: HttpStatus.CONFLICT,
            schema: {
                example: {
                    statusCode: HttpStatus.CONFLICT,
                    message:
                        'Произошел конфликт при записи файла в файловую систему',
                },
            },
        }),
    );
}
