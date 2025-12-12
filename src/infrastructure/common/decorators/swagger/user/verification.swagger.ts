import { ConfirmVerificationDto } from '@app/infrastructure/dto/user/confirm-verification.dto';
import {
    ConfirmVerificationCodeResponse,
    RequestVerificationCodeResponse,
} from '@app/infrastructure/responses';
import { applyDecorators } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiOkResponse,
    ApiOperation,
    ApiTooManyRequestsResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

/**
 * Swagger декоратор для endpoint запроса кода верификации email
 * Отправляет 6-значный код на email пользователя
 */
export const RequestEmailCodeSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary: 'Запросить код подтверждения email',
            description:
                'Отправляет 6-значный код подтверждения на email пользователя. ' +
                'Код действителен 10 минут. ' +
                'Доступно всем авторизованным пользователям для подтверждения своего email.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiOkResponse({
            description: 'Код успешно отправлен на email',
            type: RequestVerificationCodeResponse,
        }),
        ApiUnauthorizedResponse({
            description: 'Пользователь не авторизован',
            schema: {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized',
                },
            },
        }),
        ApiTooManyRequestsResponse({
            description: 'Превышен лимит запросов кода (3 запроса за 5 минут)',
            schema: {
                example: {
                    statusCode: 429,
                    message: 'Слишком много запросов. Повторите попытку позже.',
                },
            },
        }),
    );

/**
 * Swagger декоратор для endpoint подтверждения кода верификации email
 * Проверяет код и отмечает email как верифицированный
 */
export const ConfirmEmailCodeSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary: 'Подтвердить email кодом',
            description:
                'Проверяет код подтверждения и отмечает email как верифицированный. ' +
                'Максимум 5 попыток ввода кода. ' +
                'После 5 неудачных попыток или истечения времени (10 минут) нужно запросить новый код.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: ConfirmVerificationDto,
            description: '6-значный код подтверждения',
            examples: {
                example1: {
                    summary: 'Код подтверждения',
                    value: {
                        code: 'a1b2c3',
                    },
                },
            },
        }),
        ApiOkResponse({
            description: 'Email успешно подтверждён',
            type: ConfirmVerificationCodeResponse,
        }),
        ApiBadRequestResponse({
            description: 'Неверный или просроченный код подтверждения',
            schema: {
                example: {
                    statusCode: 400,
                    message: 'Неверный или просроченный код подтверждения',
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: 'Пользователь не авторизован',
            schema: {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized',
                },
            },
        }),
        ApiTooManyRequestsResponse({
            description:
                'Превышен лимит попыток подтверждения (5 попыток за 5 минут)',
            schema: {
                example: {
                    statusCode: 429,
                    message: 'Слишком много попыток. Повторите попытку позже.',
                },
            },
        }),
    );

/**
 * Swagger декоратор для endpoint запроса кода верификации телефона
 * Отправляет 6-значный код на телефон пользователя
 */
export const RequestPhoneCodeSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary: 'Запросить код подтверждения телефона',
            description:
                'Отправляет 6-значный код подтверждения на телефон пользователя через SMS. ' +
                'Код действителен 10 минут. ' +
                'Доступно всем авторизованным пользователям для подтверждения своего телефона.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiOkResponse({
            description: 'Код успешно отправлен на телефон',
            type: RequestVerificationCodeResponse,
        }),
        ApiUnauthorizedResponse({
            description: 'Пользователь не авторизован',
            schema: {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized',
                },
            },
        }),
        ApiTooManyRequestsResponse({
            description: 'Превышен лимит запросов кода (3 запроса за 5 минут)',
            schema: {
                example: {
                    statusCode: 429,
                    message: 'Слишком много запросов. Повторите попытку позже.',
                },
            },
        }),
    );

/**
 * Swagger декоратор для endpoint подтверждения кода верификации телефона
 * Проверяет код и отмечает телефон как верифицированный
 */
export const ConfirmPhoneCodeSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary: 'Подтвердить телефон кодом',
            description:
                'Проверяет код подтверждения и отмечает телефон как верифицированный. ' +
                'Максимум 5 попыток ввода кода. ' +
                'После 5 неудачных попыток или истечения времени (10 минут) нужно запросить новый код.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: ConfirmVerificationDto,
            description: '6-значный код подтверждения',
            examples: {
                example1: {
                    summary: 'Код подтверждения',
                    value: {
                        code: 'a1b2c3',
                    },
                },
            },
        }),
        ApiOkResponse({
            description: 'Телефон успешно подтверждён',
            type: ConfirmVerificationCodeResponse,
        }),
        ApiBadRequestResponse({
            description: 'Неверный или просроченный код подтверждения',
            schema: {
                example: {
                    statusCode: 400,
                    message: 'Неверный или просроченный код подтверждения',
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: 'Пользователь не авторизован',
            schema: {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized',
                },
            },
        }),
        ApiTooManyRequestsResponse({
            description:
                'Превышен лимит попыток подтверждения (5 попыток за 5 минут)',
            schema: {
                example: {
                    statusCode: 429,
                    message: 'Слишком много попыток. Повторите попытку позже.',
                },
            },
        }),
    );
