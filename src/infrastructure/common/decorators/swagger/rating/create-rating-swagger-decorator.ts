import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBody,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiBadRequestResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRequest } from '@app/infrastructure/requests';
import { RatingResponse } from '@app/infrastructure/responses';

export function CreateRatingSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({ summary: 'Создание рейтинга' }),
        ApiBearerAuth('JWT-auth'),
        ApiParam({
            name: 'productId',
            type: 'string',
            description: 'Идентификатор продукта',
            required: true,
        }),
        ApiParam({
            name: 'rating',
            type: 'string',
            description: 'Рейтинг продукта',
            required: true,
        }),
        ApiBody({
            type: UserRequest,
            description:
                'Это описание тела запроса в котором содержится пользователь т.е. request.user',
            required: true,
        }),
        ApiResponse({
            description: 'Created rating',
            status: HttpStatus.CREATED,
            type: RatingResponse,
        }),
        ApiNotFoundResponse({
            description: 'Not Found',
            schema: {
                title: 'Не найдено',
                anyOf: [
                    {
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            message: 'Продукт не найден',
                        },
                    },
                    {
                        example: {
                            statusCode: HttpStatus.NOT_FOUND,
                            message: 'Пользователь не найден',
                        },
                    },
                ],
            },
        }),
        ApiBadRequestResponse({
            description: 'Bad Request',
            schema: {
                title: 'Оценка рейтинга ставится повторно',
                description:
                    'В клиентской части блокируй возможность ставить повторно рейтинг продукта',
                example: {
                    status: HttpStatus.BAD_REQUEST,
                    message: 'Оценка рейтинга выми была выставлена ранее',
                },
            },
        }),
    );
}
