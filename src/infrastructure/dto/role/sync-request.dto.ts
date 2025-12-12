import { SyncType } from '@app/domain/models';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

/**
 * DTO для запроса синхронизации
 */
export class SyncRequestDto {
    @ApiPropertyOptional({
        example: 'FULL',
        description: 'Тип синхронизации',
        enum: ['FULL', 'INCREMENTAL', 'ON_DEMAND', 'SSO_LOGIN'],
        default: 'ON_DEMAND',
    })
    @IsOptional()
    @IsEnum(['FULL', 'INCREMENTAL', 'ON_DEMAND', 'SSO_LOGIN'], {
        message: 'Неверный тип синхронизации',
    })
    declare syncType?: SyncType;
}
