import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
    @ApiPropertyOptional({
        example: true,
        description: 'Включены ли email уведомления',
    })
    @IsOptional()
    @IsBoolean({
        message: 'Настройка email должна быть булевым значением',
    })
    declare readonly emailEnabled?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Включены ли push уведомления',
    })
    @IsOptional()
    @IsBoolean({
        message: 'Настройка push должна быть булевым значением',
    })
    declare readonly pushEnabled?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Включены ли обновления о заказах',
    })
    @IsOptional()
    @IsBoolean({
        message: 'Настройка обновлений заказа должна быть булевым значением',
    })
    declare readonly orderUpdates?: boolean;

    @ApiPropertyOptional({
        example: false,
        description: 'Включены ли маркетинговые уведомления',
    })
    @IsOptional()
    @IsBoolean({
        message: 'Настройка маркетинга должна быть булевым значением',
    })
    declare readonly marketing?: boolean;
}
