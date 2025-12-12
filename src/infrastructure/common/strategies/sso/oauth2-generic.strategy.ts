/**
 * Generic OAuth 2.0 Strategy
 *
 * Универсальная стратегия для любых OAuth 2.0 провайдеров
 * Используется когда провайдер не является Azure AD или Google Workspace
 *
 * Related to: SAAS-017-19, Этап 3
 */

import { Injectable } from '@nestjs/common';
import { OAuth2SSOStrategy } from './oauth2.strategy';
import { ExternalRoleSyncRepository } from '@app/infrastructure/repositories/role/external-role-sync.repository';
import { SSOStateService } from '@app/infrastructure/services/role/sso/sso-state.service';
import { SSOUserProfileMapper } from '@app/infrastructure/services/role/sso/sso-user-profile.mapper';
import { SSORoleSyncService } from '@app/infrastructure/services/role/sso/sso-role-sync.service';

/**
 * Generic OAuth 2.0 Strategy
 *
 * Базовая стратегия для любых OAuth 2.0 провайдеров.
 * Все конфигурации берутся из ExternalRoleConfig.
 *
 * Поддерживает:
 * - Любые OAuth 2.0 провайдеры (Okta, Auth0, Keycloak и т.д.)
 * - Кастомные endpoints и scopes
 * - Гибкая конфигурация через БД
 */
@Injectable()
export class GenericOAuth2SSOStrategy extends OAuth2SSOStrategy {
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
}

