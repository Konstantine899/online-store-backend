import { UserMetricsResponse } from '@app/infrastructure/responses/user/user-metrics.response';
import { applyDecorators } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export const GetUserMetricsSwaggerDecorator = (): MethodDecorator =>
    applyDecorators(
        ApiOperation({
            summary: 'Получение метрик производительности пользовательского модуля',
            description:
                'Возвращает статистику за последние 24 часа: ' +
                '- Количество медленных SQL запросов (>100ms)  ' +
                '- Среднее время выполнения bulk операций ' +
                '- Общее количество bulk операций ' +
                '- Разбивка по типам bulk операций ' +
                '- Процент ошибок. ' +
                'Доступно только администраторам.',
        }),
        ApiBearerAuth('JWT-auth'),
        ApiOkResponse({
            description: 'Метрики успешно получены',
            type: UserMetricsResponse,
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

