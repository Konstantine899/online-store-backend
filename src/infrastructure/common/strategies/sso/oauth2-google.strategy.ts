/**
 * Google Workspace OAuth 2.0 Strategy
 *
 * Специализированная стратегия для Google Workspace с предустановленными endpoints
 * и специфичной обработкой профилей Google
 *
 * Related to: SAAS-017-19, Этап 3
 */

import { ExternalRoleSyncRepository } from '@app/infrastructure/repositories/role/external-role-sync.repository';
import { SSORoleSyncService } from '@app/infrastructure/services/role/sso/sso-role-sync.service';
import { SSOStateService } from '@app/infrastructure/services/role/sso/sso-state.service';
import { SSOUserProfileMapper } from '@app/infrastructure/services/role/sso/sso-user-profile.mapper';
import { Injectable } from '@nestjs/common';
import { OAuth2SSOStrategy } from './oauth2.strategy';

/**
 * Google Workspace OAuth 2.0 Strategy
 *
 * Использует стандартные Google OAuth 2.0 endpoints:
 * - Authorization: https://accounts.google.com/o/oauth2/v2/auth
 * - Token: https://oauth2.googleapis.com/token
 * - UserInfo: https://www.googleapis.com/oauth2/v2/userinfo
 *
 * Специфичные поля Google:
 * - sub - уникальный идентификатор пользователя
 * - email - email пользователя
 * - given_name, family_name - имя и фамилия
 * - picture - аватар пользователя
 */
@Injectable()
export class GoogleWorkspaceSSOStrategy extends OAuth2SSOStrategy {
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
     * Получить стандартные Google OAuth 2.0 endpoints
     */
    public static getGoogleEndpoints(): {
        authorizationURL: string;
        tokenURL: string;
        userInfoURL: string;
    } {
        return {
            authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenURL: 'https://oauth2.googleapis.com/token',
            userInfoURL: 'https://www.googleapis.com/oauth2/v2/userinfo',
        };
    }

    /**
     * Получить стандартные Google scopes
     */
    public static getGoogleScopes(): string[] {
        return ['openid', 'profile', 'email'];
    }
}
