import { UpdateUserStatusDto } from '@app/infrastructure/dto';
import { UpdateUserStatusResponse } from '@app/infrastructure/responses';
import { applyDecorators } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

/**
 * Swagger декоратор для endpoint управления статусными флагами пользователя
 * Включает полную документацию для административных операций
 */
export const UpdateUserStatusSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary:
                'Обновление статусных флагов пользователя (только для администраторов)',
            description:
                'Позволяет администраторам управлять статусными флагами пользователей (VIP, Premium, Beta Tester). ' +
                'Администратор может изменять только пользователей своего тенанта (tenant isolation). ' +
                'Все изменения логируются для аудита. ' +
                'Доступно только пользователям с ролями: SUPER_ADMIN, PLATFORM_ADMIN, TENANT_OWNER, TENANT_ADMIN, ADMIN.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: UpdateUserStatusDto,
            description:
                'Данные для обновления статусных флагов. Все поля опциональны - можно обновить только нужные статусы.',
            examples: {
                example1: {
                    summary: 'Назначить все статусы',
                    value: {
                        isVipCustomer: true,
                        isPremium: true,
                        isBetaTester: true,
                    },
                },
                example2: {
                    summary: 'Убрать Premium статус',
                    value: {
                        isPremium: false,
                    },
                },
                example3: {
                    summary: 'Назначить только VIP статус',
                    value: {
                        isVipCustomer: true,
                    },
                },
            },
        }),
        ApiOkResponse({
            description: 'Статусные флаги успешно обновлены',
            type: UpdateUserStatusResponse,
        }),
        ApiBadRequestResponse({
            description:
                'Некорректные данные (неверный тип поля, должно быть boolean)',
            schema: {
                example: {
                    statusCode: 400,
                    message: [
                        'Поле isVipCustomer должно быть булевым значением',
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
        ApiForbiddenResponse({
            description: 'Недостаточно прав (требуется роль администратора)',
            schema: {
                example: {
                    statusCode: 403,
                    message: 'У вас недостаточно прав доступа',
                },
            },
        }),
        ApiNotFoundResponse({
            description: 'Пользователь не найден',
            schema: {
                example: {
                    statusCode: 404,
                    message: 'Пользователь с ID 1 не найден',
                    error: 'Not Found',
                },
            },
        }),
    );
