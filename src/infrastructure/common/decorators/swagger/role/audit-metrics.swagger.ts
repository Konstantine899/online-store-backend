import { AuditMetricsResponse } from '@app/infrastructure/responses/role/audit-metrics.response';
import { applyDecorators } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const GetAuditMetricsSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary: 'Получение метрик audit системы',
            description:
                'Возвращает статистику audit системы за последние 24 часа: ' +
                '- Количество audit логов в день (per tenant)  ' +
                '- Размер таблицы audit_logs (байты) ' +
                '- Среднее время генерации отчётов (summary, timeline) ' +
                '- Количество ошибок при создании логов ' +
                '- Общее количество логов за последние 24 часа (per tenant). ' +
                'Доступно только администраторам.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiOkResponse({
            description: 'Метрики audit системы успешно получены',
            type: AuditMetricsResponse,
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

