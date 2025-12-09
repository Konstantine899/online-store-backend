import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO для SSO callback обработки
 */
export class SSOCallbackDto {
    @ApiProperty({
        example: 'abc123def456',
        description: 'Authorization code от провайдера (OAuth 2.0/OIDC)',
    })
    @IsOptional()
    @IsString({ message: 'Code должен быть строкой' })
    declare readonly code?: string;

    @ApiProperty({
        example: 'xyz789state123',
        description: 'State parameter для валидации запроса',
    })
    @IsNotEmpty({ message: 'State parameter обязателен' })
    @IsString({ message: 'State должен быть строкой' })
    declare readonly state: string;

    @ApiPropertyOptional({
        example: 'error_description',
        description: 'Описание ошибки (если есть)',
    })
    @IsOptional()
    @IsString({ message: 'Error description должен быть строкой' })
    declare readonly error?: string;

    @ApiPropertyOptional({
        example: 'access_denied',
        description: 'Код ошибки (если есть)',
    })
    @IsOptional()
    @IsString({ message: 'Error должен быть строкой' })
    declare readonly error_description?: string;
}

