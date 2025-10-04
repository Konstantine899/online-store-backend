import { IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkConsentUpdate {
    @ApiProperty({
        description: 'ID пользователя',
        example: 123,
    })
    declare readonly userId: number;

    @ApiPropertyOptional({
        description: 'Согласие на рассылку новостей',
        example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'Согласие на рассылку должно быть булевым значением' })
    declare readonly is_newsletter_subscribed?: boolean;

    @ApiPropertyOptional({
        description: 'Согласие на маркетинговые сообщения',
        example: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'Согласие на маркетинг должно быть булевым значением' })
    declare readonly is_marketing_consent?: boolean;

    @ApiPropertyOptional({
        description: 'Согласие на использование cookies',
        example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'Согласие на cookies должно быть булевым значением' })
    declare readonly is_cookie_consent?: boolean;

    @ApiPropertyOptional({
        description: 'Принятие пользовательского соглашения',
        example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'Принятие соглашения должно быть булевым значением' })
    declare readonly is_terms_accepted?: boolean;

    @ApiPropertyOptional({
        description: 'Принятие политики конфиденциальности',
        example: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'Принятие политики конфиденциальности должно быть булевым значением' })
    declare readonly is_privacy_accepted?: boolean;
}

export class BulkUpdateConsentsDto {
    @ApiProperty({
        description: 'Список обновлений согласий для пользователей',
        type: [BulkConsentUpdate],
        example: [
            {
                userId: 123,
                is_newsletter_subscribed: true,
                is_marketing_consent: false,
            },
            {
                userId: 456,
                is_cookie_consent: true,
                is_terms_accepted: true,
            },
        ],
    })
    @IsArray({ message: 'Список обновлений должен быть массивом' })
    @ValidateNested({ each: true })
    @Type(() => BulkConsentUpdate)
    declare readonly updates: BulkConsentUpdate[];
}
