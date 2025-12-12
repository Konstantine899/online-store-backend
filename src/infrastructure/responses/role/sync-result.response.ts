import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SyncStatus } from '@app/domain/models';

/**
 * Статистика синхронизации
 */
export class SyncStatisticsResponse {
    @ApiProperty({
        example: 100,
        description: 'Общее количество обработанных пользователей',
    })
    declare totalUsers: number;

    @ApiProperty({
        example: 10,
        description: 'Количество созданных пользователей',
    })
    declare createdUsers: number;

    @ApiProperty({
        example: 50,
        description: 'Количество обновленных пользователей',
    })
    declare updatedUsers: number;

    @ApiProperty({
        example: 5,
        description: 'Количество удаленных пользователей',
    })
    declare deletedUsers: number;

    @ApiProperty({
        example: 60,
        description: 'Количество пользователей с примененным маппингом',
    })
    declare mappedUsers: number;

    @ApiProperty({
        example: 30,
        description: 'Количество пропущенных пользователей',
    })
    declare skippedUsers: number;

    @ApiProperty({
        example: 5,
        description: 'Количество пользователей с ошибками',
    })
    declare failedUsers: number;
}

/**
 * Детали ошибки
 */
export class SyncErrorDetailResponse {
    @ApiPropertyOptional({
        example: 123,
        description: 'ID пользователя',
    })
    declare userId?: string | number;

    @ApiPropertyOptional({
        example: 'ldap-user-456',
        description: 'ID пользователя во внешней системе',
    })
    declare externalUserId?: string;

    @ApiProperty({
        example: 'Failed to map role',
        description: 'Сообщение об ошибке',
    })
    declare error: string;

    @ApiProperty({
        example: '2025-12-07T12:02:00Z',
        description: 'Время ошибки',
    })
    declare timestamp: Date;
}

/**
 * Response для результата синхронизации
 */
export class SyncResultResponse {
    @ApiProperty({
        example: true,
        description: 'Успешна ли синхронизация',
    })
    declare success: boolean;

    @ApiProperty({
        example: 1,
        description: 'ID лога синхронизации',
    })
    declare syncLogId: number;

    @ApiProperty({
        example: 'SUCCESS',
        description: 'Статус синхронизации',
        enum: ['RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED'],
    })
    declare status: SyncStatus;

    @ApiProperty({
        description: 'Статистика синхронизации',
        type: SyncStatisticsResponse,
    })
    declare statistics: SyncStatisticsResponse;

    @ApiPropertyOptional({
        description: 'Детали ошибок (если есть)',
        type: [SyncErrorDetailResponse],
    })
    declare errors?: SyncErrorDetailResponse[];

    @ApiProperty({
        example: 300000,
        description: 'Длительность синхронизации в миллисекундах',
    })
    declare durationMs: number;
}

