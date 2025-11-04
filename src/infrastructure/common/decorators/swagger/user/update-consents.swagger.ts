import { UpdateConsentsDto } from '@app/infrastructure/dto';
import { UpdateConsentsResponse } from '@app/infrastructure/responses';
import { applyDecorators } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiOkResponse,
    ApiOperation,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

/**
 * Swagger декоратор для endpoint управления согласиями пользователя
 * Включает полную документацию для GDPR compliance
 */
export const UpdateConsentsSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary: 'Обновление флагов согласий пользователя',
            description:
                'Позволяет пользователю управлять своими согласиями на маркетинг, рассылку и cookies. Все изменения логируются для GDPR compliance. Доступно всем аутентифицированным пользователям для управления своим профилем.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: UpdateConsentsDto,
            description:
                'Данные для обновления согласий. Все поля опциональны - можно обновить только нужные согласия.',
            examples: {
                example1: {
                    summary: 'Включить все согласия',
                    value: {
                        isNewsletterSubscribed: true,
                        isMarketingConsent: true,
                        isCookieConsent: true,
                    },
                },
                example2: {
                    summary: 'Отключить маркетинговые материалы',
                    value: {
                        isMarketingConsent: false,
                    },
                },
                example3: {
                    summary: 'Включить только подписку на рассылку',
                    value: {
                        isNewsletterSubscribed: true,
                    },
                },
            },
        }),
        ApiOkResponse({
            description: 'Согласия успешно обновлены',
            type: UpdateConsentsResponse,
        }),
        ApiBadRequestResponse({
            description:
                'Некорректные данные (неверный тип поля, должно быть boolean)',
            schema: {
                example: {
                    statusCode: 400,
                    message: [
                        'Поле isNewsletterSubscribed должно быть булевым значением',
                    ],
                    error: 'Bad Request',
                },
            },
        }),
        ApiUnauthorizedResponse({
            description: 'Не авторизован',
            schema: {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized',
                },
            },
        }),
    );
