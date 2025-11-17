import { BulkUsersDto } from '@app/infrastructure/dto';
import { BulkOperationResponse } from '@app/infrastructure/responses';
import { applyDecorators } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

/**
 * Swagger декоратор для массовой активации пользователей
 */
export const BulkActivateUsersSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary:
                'Массовая активация пользователей (только для администраторов)',
            description:
                'Позволяет администраторам активировать нескольких пользователей одновременно (до 100). ' +
                'Применяется только к пользователям своего тенанта (tenant isolation). ' +
                'Обновляет флаг isActive в true для указанных пользователей. ' +
                'Доступно только пользователям с ролями: SUPER_ADMIN, PLATFORM_ADMIN, TENANT_OWNER, TENANT_ADMIN, ADMIN.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: BulkUsersDto,
            description: 'Массив ID пользователей для активации (от 1 до 100)',
            examples: {
                example1: {
                    summary: 'Активация 5 пользователей',
                    value: {
                        userIds: [1, 2, 3, 4, 5],
                    },
                },
            },
        }),
        ApiOkResponse({
            description: 'Пользователи успешно активированы',
            type: BulkOperationResponse,
            schema: {
                example: {
                    affectedCount: 5,
                    message: 'Успешно активировано 5 пользователей',
                },
            },
        }),
        ApiBadRequestResponse({
            description:
                'Некорректные данные (пустой массив, не числа, превышен лимит)',
            schema: {
                example: {
                    statusCode: 400,
                    message: [
                        'Массив userIds должен содержать минимум 1 элемент',
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
    );

/**
 * Swagger декоратор для массовой деактивации пользователей
 */
export const BulkDeactivateUsersSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary:
                'Массовая деактивация пользователей (только для администраторов)',
            description:
                'Позволяет администраторам деактивировать нескольких пользователей одновременно (до 100). ' +
                'Применяется только к пользователям своего тенанта (tenant isolation). ' +
                'Обновляет флаг isActive в false для указанных пользователей. ' +
                'Доступно только пользователям с ролями: SUPER_ADMIN, PLATFORM_ADMIN, TENANT_OWNER, TENANT_ADMIN, ADMIN.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: BulkUsersDto,
            description:
                'Массив ID пользователей для деактивации (от 1 до 100)',
        }),
        ApiOkResponse({
            description: 'Пользователи успешно деактивированы',
            type: BulkOperationResponse,
        }),
        ApiBadRequestResponse({
            description: 'Некорректные данные',
        }),
        ApiUnauthorizedResponse({
            description: 'Не авторизован',
        }),
        ApiForbiddenResponse({
            description: 'Недостаточно прав',
        }),
    );

/**
 * Swagger декоратор для массовой блокировки пользователей
 */
export const BulkBlockUsersSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary:
                'Массовая блокировка пользователей (только для администраторов)',
            description:
                'Позволяет администраторам блокировать нескольких пользователей одновременно (до 100). ' +
                'Применяется только к пользователям своего тенанта (tenant isolation). ' +
                'Обновляет флаг isBlocked в true для указанных пользователей. ' +
                'Заблокированные пользователи не смогут войти в систему. ' +
                'Доступно только пользователям с ролями: SUPER_ADMIN, PLATFORM_ADMIN, TENANT_OWNER, TENANT_ADMIN, ADMIN.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: BulkUsersDto,
            description: 'Массив ID пользователей для блокировки (от 1 до 100)',
        }),
        ApiOkResponse({
            description: 'Пользователи успешно заблокированы',
            type: BulkOperationResponse,
        }),
        ApiBadRequestResponse({
            description: 'Некорректные данные',
        }),
        ApiUnauthorizedResponse({
            description: 'Не авторизован',
        }),
        ApiForbiddenResponse({
            description: 'Недостаточно прав',
        }),
    );

/**
 * Swagger декоратор для массовой разблокировки пользователей
 */
export const BulkUnblockUsersSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary:
                'Массовая разблокировка пользователей (только для администраторов)',
            description:
                'Позволяет администраторам разблокировать нескольких пользователей одновременно (до 100). ' +
                'Применяется только к пользователям своего тенанта (tenant isolation). ' +
                'Обновляет флаг isBlocked в false для указанных пользователей. ' +
                'Доступно только пользователям с ролями: SUPER_ADMIN, PLATFORM_ADMIN, TENANT_OWNER, TENANT_ADMIN, ADMIN.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: BulkUsersDto,
            description:
                'Массив ID пользователей для разблокировки (от 1 до 100)',
        }),
        ApiOkResponse({
            description: 'Пользователи успешно разблокированы',
            type: BulkOperationResponse,
        }),
        ApiBadRequestResponse({
            description: 'Некорректные данные',
        }),
        ApiUnauthorizedResponse({
            description: 'Не авторизован',
        }),
        ApiForbiddenResponse({
            description: 'Недостаточно прав',
        }),
    );

/**
 * Swagger декоратор для массового удаления пользователей (soft delete)
 */
export const BulkDeleteUsersSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary:
                'Массовое удаление пользователей (только для администраторов)',
            description:
                'Позволяет администраторам выполнить soft delete для нескольких пользователей одновременно (до 100). ' +
                'Применяется только к пользователям своего тенанта (tenant isolation). ' +
                'Обновляет флаг isDeleted в true для указанных пользователей. ' +
                'Удалённые пользователи не отображаются в обычных запросах, но данные остаются в БД. ' +
                'Доступно только пользователям с ролями: SUPER_ADMIN, PLATFORM_ADMIN, TENANT_OWNER, TENANT_ADMIN, ADMIN.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: BulkUsersDto,
            description: 'Массив ID пользователей для удаления (от 1 до 100)',
        }),
        ApiOkResponse({
            description: 'Пользователи успешно удалены',
            type: BulkOperationResponse,
        }),
        ApiBadRequestResponse({
            description: 'Некорректные данные',
        }),
        ApiUnauthorizedResponse({
            description: 'Не авторизован',
        }),
        ApiForbiddenResponse({
            description: 'Недостаточно прав',
        }),
    );

/**
 * Swagger декоратор для массовой верификации пользователей
 */
export const BulkVerifyUsersSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary:
                'Массовая верификация пользователей (только для администраторов)',
            description:
                'Позволяет администраторам верифицировать нескольких пользователей одновременно (до 100). ' +
                'Применяется только к пользователям своего тенанта (tenant isolation). ' +
                'Обновляет флаги isVerified, isEmailVerified и isPhoneVerified в true для указанных пользователей. ' +
                'Доступно только пользователям с ролями: SUPER_ADMIN, PLATFORM_ADMIN, TENANT_OWNER, TENANT_ADMIN, ADMIN.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiBody({
            type: BulkUsersDto,
            description:
                'Массив ID пользователей для верификации (от 1 до 100)',
        }),
        ApiOkResponse({
            description: 'Пользователи успешно верифицированы',
            type: BulkOperationResponse,
        }),
        ApiBadRequestResponse({
            description: 'Некорректные данные',
        }),
        ApiUnauthorizedResponse({
            description: 'Не авторизован',
        }),
        ApiForbiddenResponse({
            description: 'Недостаточно прав',
        }),
    );
