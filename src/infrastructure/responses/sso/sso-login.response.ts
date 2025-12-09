import { ApiProperty } from '@nestjs/swagger';
import { LoginResponse } from '../auth/login.response';

/**
 * Response после успешного SSO входа
 */
export class SSOLoginResponse extends LoginResponse {
    @ApiProperty({
        example: 'OAUTH2',
        description: 'Тип SSO провайдера',
        enum: ['OAUTH2', 'SAML', 'OIDC'],
    })
    declare readonly providerType: 'OAUTH2' | 'SAML' | 'OIDC';

    @ApiProperty({
        example: 'Azure AD',
        description: 'Имя провайдера',
    })
    declare readonly providerName?: string;

    @ApiProperty({
        example: true,
        description: 'Был ли пользователь создан (just-in-time provisioning)',
    })
    declare readonly isNewUser: boolean;
}

