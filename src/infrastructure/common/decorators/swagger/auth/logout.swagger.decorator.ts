import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { RefreshDto } from '@app/infrastructure/dto';
import { ApiBadRequestResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { LogoutResponse } from '../../../../responses/auth/logout.response';

export function LogoutSwaggerDecorator(): Function {
    return applyDecorators(
        ApiOperation({ summary: 'Выход пользователя' }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: RefreshDto,
            description: 'Refresh token пользователя',
            required: true,
        }),
        ApiBadRequestResponse({
            description: 'Bad Request',
            status: HttpStatus.BAD_REQUEST,
            schema: {
                anyOf: [
                    {
                        title: 'Refresh token не моет быть пустым',
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'refreshToken',
                            messages: ['Refresh token не моет быть пустым'],
                            value: '',
                        },
                    },
                    {
                        title: 'Refresh token должен быть строкой',
                        example: {
                            status: HttpStatus.BAD_REQUEST,
                            property: 'refreshToken',
                            messages: ['Refresh token должен быть строкой'],
                            value: 1,
                        },
                    },
                ],
            },
        }),
        ApiResponse({
            description: 'Remove refresh token',
            status: HttpStatus.OK,
            type: LogoutResponse,
        }),
        ApiUnprocessableEntityResponse({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            schema: {
                anyOf: [
                    {
                        title: 'Не верный формат refresh token',
                        example: {
                            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                            message: 'Не верный формат refresh token',
                            error: 'Unprocessable Entity',
                        },
                    },
                    {
                        title: 'Срок действия refresh token истек',
                        example: {
                            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                            message: 'Срок действия refresh token истек',
                            error: 'Unprocessable Entity',
                        },
                    },
                ],
            },
        }),
    );
}
