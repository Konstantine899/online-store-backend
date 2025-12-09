/**
 * Azure AD OAuth 2.0 Strategy
 * 
 * Специализированная стратегия для Microsoft Azure AD с предустановленными endpoints
 * и специфичной обработкой профилей Azure AD
 *
 * Related to: SAAS-017-19, Этап 3
 */

import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Injectable } from '@nestjs/common';
import { OAuth2SSOStrategy } from './oauth2.strategy';
import { ExternalRoleSyncRepository } from '@app/infrastructure/repositories/role/external-role-sync.repository';
import { SSOStateService } from '@app/infrastructure/services/role/sso/sso-state.service';
import { SSOUserProfileMapper } from '@app/infrastructure/services/role/sso/sso-user-profile.mapper';
import { SSORoleSyncService } from '@app/infrastructure/services/role/sso/sso-role-sync.service';

/**
 * Azure AD OAuth 2.0 Strategy
 * 
 * Использует стандартные Azure AD endpoints:
 * - Authorization: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
 * - Token: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
 * - UserInfo: https://graph.microsoft.com/v1.0/me
 * 
 * Специфичные поля Azure AD:
 * - upn (User Principal Name) - используется как email
 * - oid (Object ID) - уникальный идентификатор пользователя
 * - groups - группы пользователя (для ролей)
 */
@Injectable()
export class AzureADSSOStrategy extends OAuth2SSOStrategy {
    constructor(
        externalRoleSyncRepository: ExternalRoleSyncRepository,
        ssoStateService: SSOStateService,
        ssoUserProfileMapper: SSOUserProfileMapper,
        ssoRoleSyncService: SSORoleSyncService,
    ) {
        super(
            externalRoleSyncRepository,
            ssoStateService,
            ssoUserProfileMapper,
            ssoRoleSyncService,
        );
    }

    /**
     * Получить стандартные Azure AD endpoints
     * @param tenantId - Azure AD Tenant ID (может быть 'common' или 'organizations')
     */
    public static getAzureADEndpoints(tenantId: string = 'common'): {
        authorizationURL: string;
        tokenURL: string;
        userInfoURL: string;
    } {
        const baseUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0`;

        return {
            authorizationURL: `${baseUrl}/authorize`,
            tokenURL: `${baseUrl}/token`,
            userInfoURL: 'https://graph.microsoft.com/v1.0/me',
        };
    }

    /**
     * Получить стандартные Azure AD scopes
     */
    public static getAzureADScopes(): string[] {
        return [
            'openid',
            'profile',
            'email',
            'User.Read',
            'offline_access',
        ];
    }
}

