import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import { ExternalRoleSyncRepository } from '@app/infrastructure/repositories/role/external-role-sync.repository';
import { SSOStateService } from '@app/infrastructure/services/role/sso/sso-state.service';
import { SSOUserProfileMapper } from '@app/infrastructure/services/role/sso/sso-user-profile.mapper';
import { SSORoleSyncService } from '@app/infrastructure/services/role/sso/sso-role-sync.service';

/**
 * Базовая OAuth 2.0 стратегия для SSO
 *
 * Особенности:
 * - Динамическая конфигурация из ExternalRoleConfig (tenant-specific)
 * - Использование state parameter для передачи providerId и tenantId
 * - Just-in-time provisioning через SSORoleSyncService
 * - Автоматическая синхронизация ролей
 *
 * Использование:
 * - Регистрируется как 'oauth2' стратегия
 * - Конфигурация получается из БД по providerId из state parameter
 */
@Injectable()
export class OAuth2SSOStrategy extends PassportStrategy(
    OAuth2Strategy,
    'oauth2',
) {
    private readonly logger = createLogger('OAuth2SSOStrategy');

    constructor(
        private readonly externalRoleSyncRepository: ExternalRoleSyncRepository,
        private readonly ssoStateService: SSOStateService,
        private readonly ssoUserProfileMapper: SSOUserProfileMapper,
        private readonly ssoRoleSyncService: SSORoleSyncService,
    ) {
        // Базовая конфигурация (будет переопределена динамически)
        super({
            authorizationURL: '', // Будет установлено динамически
            tokenURL: '', // Будет установлено динамически
            clientID: '', // Будет установлено динамически
            clientSecret: '', // Будет установлено динамически
            callbackURL: '', // Будет установлено динамически
            scope: ['openid', 'profile', 'email'],
            passReqToCallback: true, // Для получения request в validate
        });
    }

    /**
     * Валидация и обработка OAuth 2.0 callback
     * @param req - Express request (содержит state parameter)
     * @param accessToken - Access token от провайдера
     * @param refreshToken - Refresh token (если доступен)
     * @param profile - Профиль пользователя от провайдера
     * @param done - Callback для завершения аутентификации
     */
    public async validate(
        req: Request,
        accessToken: string,
        refreshToken: string,
        profile: Record<string, unknown>,
        done: (error: Error | null, user?: unknown) => void,
    ): Promise<void> {
        try {
            // Извлекаем state из query параметров
            const state = (req.query.state as string) ?? req.body?.state;

            if (!state) {
                throw new UnauthorizedException(
                    'State parameter отсутствует в callback',
                );
            }

            // Валидируем state и получаем tenantId и providerId
            const stateData = this.ssoStateService.validateState(state);
            if (!stateData) {
                throw new UnauthorizedException(
                    'Невалидный или истекший state parameter',
                );
            }

            const { tenantId, providerId } = stateData;

            // Получаем конфигурацию провайдера из БД
            const providerConfig =
                await this.externalRoleSyncRepository.findConfigById(
                    providerId,
                    tenantId,
                );

            if (!providerConfig) {
                throw new UnauthorizedException(
                    `Конфигурация провайдера ${providerId} не найдена`,
                );
            }

            if (providerConfig.status !== 'ACTIVE') {
                throw new UnauthorizedException(
                    `Провайдер ${providerConfig.name} неактивен`,
                );
            }

            // Получаем userInfo если доступен (для OAuth 2.0)
            let userInfo: Record<string, unknown> | null = null;
            if (providerConfig.providerConfig.userInfoURL && accessToken) {
                try {
                    userInfo = await this.fetchUserInfo(
                        providerConfig.providerConfig.userInfoURL,
                        accessToken,
                    );
                } catch (error: unknown) {
                    this.logger.warn(
                        {
                            error:
                                error instanceof Error
                                    ? error.message
                                    : String(error),
                            providerId,
                        },
                        'Failed to fetch userInfo, using profile only',
                    );
                }
            }

            // Объединяем profile и userInfo
            const fullProfile = userInfo
                ? { ...profile, ...userInfo }
                : profile;

            // Добавляем токены в профиль
            fullProfile.accessToken = accessToken;
            if (refreshToken) {
                fullProfile.refreshToken = refreshToken;
            }

            // Маппим профиль в стандартный формат
            const ssoProfile = this.ssoUserProfileMapper.mapProfile(
                fullProfile,
                providerConfig.providerConfig,
            );

            // Provision пользователя (just-in-time)
            const user = await this.ssoRoleSyncService.provisionUser(
                ssoProfile,
                providerConfig,
                tenantId,
            );

            // Синхронизируем роли
            await this.ssoRoleSyncService.syncRoles(
                user.id,
                ssoProfile,
                providerConfig,
                tenantId,
            );

            this.logger.info(
                {
                    userId: user.id,
                    email: ssoProfile.email,
                    providerId,
                    tenantId,
                },
                'SSO authentication successful',
            );

            // Возвращаем пользователя для Passport
            done(null, {
                user,
                ssoProfile,
                providerConfig,
            });
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.error(
                { error: errorMessage },
                'SSO authentication failed',
            );

            done(error as Error);
        }
    }

    /**
     * Получение userInfo от провайдера
     * @private
     */
    private async fetchUserInfo(
        userInfoURL: string,
        accessToken: string,
    ): Promise<Record<string, unknown>> {
        const axios = (await import('axios')).default;
        const response = await axios.get(userInfoURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
            },
        });

        return response.data as Record<string, unknown>;
    }
}

