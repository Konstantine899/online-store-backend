import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO для SSO logout
 */
export class SSOLogoutDto {
    @ApiPropertyOptional({
        example: 'https://sso.provider.com/logout',
        description: 'Logout URL провайдера (SAML/OIDC)',
    })
    @IsOptional()
    @IsString({ message: 'Logout URL должен быть строкой' })
    declare readonly logoutUrl?: string;

    @ApiPropertyOptional({
        example: 'session-index-123',
        description: 'Session index для SAML logout',
    })
    @IsOptional()
    @IsString({ message: 'Session index должен быть строкой' })
    declare readonly sessionIndex?: string;
}

