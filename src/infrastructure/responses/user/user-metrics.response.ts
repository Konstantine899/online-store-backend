import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO для метрик производительности пользовательского модуля
 * Возвращает статистику за последние 24 часа
 */
export class UserMetricsResponse {
    @ApiProperty({
        example: 15,
        description: 'Количество медленных SQL запросов (>100ms) за последние 24 часа',
    })
    declare slowQueriesCount: number;

    @ApiProperty({
        example: 250.5,
        description: 'Среднее время выполнения bulk операций (в миллисекундах)',
    })
    declare avgBulkOperationTime: number;

    @ApiProperty({
        example: 42,
        description: 'Общее количество bulk операций за последние 24 часа',
    })
    declare totalBulkOperations: number;

    @ApiProperty({
        example: {
            bulkActivateUsers: 12,
            bulkDeactivateUsers: 8,
            bulkBlockUsers: 5,
            bulkUnblockUsers: 7,
            bulkDeleteUsers: 3,
            bulkVerifyUsers: 7,
        },
        description: 'Разбивка по типам bulk операций',
    })
    declare bulkOperationsByType: {
        bulkActivateUsers: number;
        bulkDeactivateUsers: number;
        bulkBlockUsers: number;
        bulkUnblockUsers: number;
        bulkDeleteUsers: number;
        bulkVerifyUsers: number;
    };

    @ApiProperty({
        example: 0.02,
        description: 'Процент ошибок (0-1), например 0.02 = 2%',
    })
    declare errorRate: number;

    @ApiProperty({
        example: '2025-11-19T12:00:00.000Z',
        description: 'Временная метка формирования отчёта',
    })
    declare timestamp: string;
}

