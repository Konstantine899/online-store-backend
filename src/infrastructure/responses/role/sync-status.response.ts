import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SyncStatus } from '@app/domain/models';

/**
 * Response для статуса синхронизации
 */
export class SyncStatusResponse {
    @ApiProperty({
        example: 1,
        description: 'ID конфигурации',
    })
    declare configId: number;

    @ApiProperty({
        example: false,
        description: 'Идет ли синхронизация сейчас',
    })
    declare isRunning: boolean;

    @ApiPropertyOptional({
        example: '2025-12-07T12:00:00Z',
        description: 'Время последней синхронизации',
    })
    declare lastSyncAt: Date | null;

    @ApiPropertyOptional({
        example: '2025-12-07T18:00:00Z',
        description: 'Время следующей синхронизации',
    })
    declare nextSyncAt: Date | null;

    @ApiPropertyOptional({
        example: 'SUCCESS',
        description: 'Статус последней синхронизации',
        enum: ['RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED'],
    })
    declare lastStatus: SyncStatus | null;

    @ApiProperty({
        example: 0,
        description: 'Количество ошибок',
    })
    declare errorCount: number;

    @ApiPropertyOptional({
        example: 'Connection timeout',
        description: 'Последняя ошибка',
    })
    declare lastError: string | null;

    @ApiPropertyOptional({
        example: '2025-12-07T12:00:00Z',
        description: 'Время последней ошибки',
    })
    declare lastErrorAt: Date | null;
}

