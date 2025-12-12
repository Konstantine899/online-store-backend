import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response после SSO logout
 */
export class SSOLogoutResponse {
    @ApiProperty({
        example: 200,
        description: 'HTTP статус код',
    })
    declare readonly statusCode: number;

    @ApiProperty({
        example: 'success',
        description: 'Сообщение о результате',
    })
    declare readonly message: string;

    @ApiPropertyOptional({
        example: 'https://sso.provider.com/logout?SAMLRequest=...',
        description: 'URL для редиректа на logout провайдера (если требуется)',
    })
    declare readonly logoutUrl?: string;
}

