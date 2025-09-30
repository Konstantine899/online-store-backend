import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GetLoginHistoryResponse } from '@app/infrastructure/responses';

export function GetLoginHistorySwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить историю входов пользователя',
            description: 'Возвращает историю входов текущего аутентифицированного пользователя с пагинацией',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiQuery({
            name: 'limit',
            required: false,
            type: Number,
            description: 'Количество записей (по умолчанию 10, максимум 100)',
            example: 10,
        }),
        ApiQuery({
            name: 'offset',
            required: false,
            type: Number,
            description: 'Смещение для пагинации (по умолчанию 0)',
            example: 0,
        }),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'История входов успешно получена',
            type: GetLoginHistoryResponse,
        }),
        ApiResponse({
            status: HttpStatus.UNAUTHORIZED,
            description: 'Не авторизован',
        }),
    );
}

export function GetUserLoginStatsSwaggerDecorator(): MethodDecorator {
    return applyDecorators(
        ApiOperation({
            summary: 'Получить статистику входов пользователя',
            description: 'Возвращает статистику входов текущего аутентифицированного пользователя',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiResponse({
            status: HttpStatus.OK,
            description: 'Статистика входов успешно получена',
            schema: {
                type: 'object',
                properties: {
                    totalLogins: { type: 'number', example: 150 },
                    successfulLogins: { type: 'number', example: 145 },
                    failedLogins: { type: 'number', example: 5 },
                    lastLoginAt: { type: 'string', format: 'date-time', nullable: true, example: '2024-01-15T10:30:00Z' },
                },
            },
        }),
        ApiResponse({
            status: HttpStatus.UNAUTHORIZED,
            description: 'Не авторизован',
        }),
    );
}
