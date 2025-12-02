import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO для метрик audit системы
 * Возвращает статистику за последние 24 часа
 */
export class AuditMetricsResponse {
    @ApiProperty({
        example: [
            { tenantId: 1, date: '2025-12-03', count: 150 },
            { tenantId: 2, date: '2025-12-03', count: 75 },
            { tenantId: null, date: '2025-12-03', count: 10 },
        ],
        description:
            'Количество audit логов в день по тенантам (null для системных операций)',
        type: 'array',
        isArray: true,
    })
    declare logsPerDay: Array<{
        tenantId: number | null;
        date: string;
        count: number;
    }>;

    @ApiProperty({
        example: {
            dataLength: 52428800,
            indexLength: 10485760,
            totalLength: 62914560,
        },
        description: 'Размер таблицы audit_logs в байтах',
    })
    declare tableSize: {
        dataLength: number;
        indexLength: number;
        totalLength: number;
    };

    @ApiProperty({
        example: {
            summary: 1250.5,
            timeline: 875.25,
        },
        description:
            'Среднее время генерации отчётов (в миллисекундах) за последние 24 часа',
    })
    declare avgReportGenerationTime: {
        summary: number;
        timeline: number;
    };

    @ApiProperty({
        example: 3,
        description:
            'Количество ошибок при создании audit логов за последние 24 часа',
    })
    declare logCreationErrorsCount: number;

    @ApiProperty({
        example: [
            { tenantId: 1, count: 450 },
            { tenantId: 2, count: 230 },
            { tenantId: null, count: 25 },
        ],
        description:
            'Общее количество audit логов за последние 24 часа по тенантам',
        type: 'array',
        isArray: true,
    })
    declare totalLogsLast24h: Array<{
        tenantId: number | null;
        count: number;
    }>;

    @ApiProperty({
        example: '2025-12-03T12:00:00.000Z',
        description: 'Временная метка формирования отчёта',
    })
    declare timestamp: string;
}

