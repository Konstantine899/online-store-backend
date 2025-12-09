import { PassportStrategy } from '@nestjs/passport';
import { MultiSamlStrategy } from '@node-saml/passport-saml';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import { ExternalRoleSyncRepository } from '@app/infrastructure/repositories/role/external-role-sync.repository';
import { SSOStateService } from '@app/infrastructure/services/role/sso/sso-state.service';
import { SSOUserProfileMapper } from '@app/infrastructure/services/role/sso/sso-user-profile.mapper';
import { SSORoleSyncService } from '@app/infrastructure/services/role/sso/sso-role-sync.service';
import { ExternalRoleConfigModel } from '@app/domain/models/external-role-config.model';
import { ISAMLUserProfile } from '@app/domain/types/sso/sso-user-profile.types';
import { IProviderConfig } from '@app/domain/models/external-role-config.model';

/**
 * SAML стратегия для SSO
 *
 * Использует MultiSamlStrategy для динамической конфигурации из БД.
 * Конфигурация получается из ExternalRoleConfig по providerId из RelayState.
 *
 * Особенности:
 * - Динамическая конфигурация через getSamlOptions
 * - Использование RelayState для передачи providerId и tenantId
 * - Just-in-time provisioning
 * - Автоматическая синхронизация ролей
 */
@Injectable()
export class SAMLSSOStrategy extends PassportStrategy(
    MultiSamlStrategy,
    'saml',
) {
    private readonly logger = createLogger('SAMLSSOStrategy');

    constructor(
        private readonly externalRoleSyncRepository: ExternalRoleSyncRepository,
        private readonly ssoStateService: SSOStateService,
        private readonly ssoUserProfileMapper: SSOUserProfileMapper,
        private readonly ssoRoleSyncService: SSORoleSyncService,
    ) {
        super({
            passReqToCallback: true, // Для получения request в getSamlOptions и validate
            getSamlOptions: async (req: Request, done: (err: Error | null, samlOptions?: unknown) => void) => {
                try {
                    // Извлекаем RelayState из query параметров
                    const relayState = (req.query.RelayState as string) ?? req.body?.RelayState;

                    if (!relayState) {
                        return done(
                            new UnauthorizedException(
                                'RelayState отсутствует в SAML запросе',
                            ) as Error,
                        );
                    }

                    // Валидируем state и получаем tenantId и providerId
                    const stateData = this.ssoStateService.validateState(relayState);
                    if (!stateData) {
                        return done(
                            new UnauthorizedException(
                                'Невалидный или истекший RelayState',
                            ) as Error,
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
                        return done(
                            new UnauthorizedException(
                                `Конфигурация провайдера ${providerId} не найдена`,
                            ) as Error,
                        );
                    }

                    if (providerConfig.status !== 'ACTIVE') {
                        return done(
                            new UnauthorizedException(
                                `Провайдер ${providerConfig.name} неактивен`,
                            ) as Error,
                        );
                    }

                    // Сохраняем providerConfig и tenantId в request для использования в validate
                    (req as Request & { ssoProviderConfig?: ExternalRoleConfigModel; ssoTenantId?: number }).ssoProviderConfig = providerConfig;
                    (req as Request & { ssoProviderConfig?: ExternalRoleConfigModel; ssoTenantId?: number }).ssoTenantId = tenantId;

                    // Строим SAML конфигурацию
                    const samlOptions = this.buildSamlOptions(
                        providerConfig.providerConfig,
                    );

                    done(null, samlOptions);
                } catch (error: unknown) {
                    const errorMessage =
                        error instanceof Error ? error.message : String(error);
                    this.logger.error(
                        { error: errorMessage },
                        'Failed to get SAML options',
                    );
                    done(error as Error);
                }
            },
        });
    }

    /**
     * Валидация и обработка SAML callback
     */
    public async validate(
        req: Request & { ssoProviderConfig?: ExternalRoleConfigModel; ssoTenantId?: number },
        profile: Record<string, unknown>,
        done: (error: Error | null, user?: unknown) => void,
    ): Promise<void> {
        try {
            const providerConfig = req.ssoProviderConfig;
            const tenantId = req.ssoTenantId;

            if (!providerConfig || !tenantId) {
                throw new UnauthorizedException(
                    'Конфигурация провайдера не найдена в request',
                );
            }

            // Маппим SAML профиль в стандартный формат
            const ssoProfile = this.ssoUserProfileMapper.mapProfile(
                profile,
                providerConfig.providerConfig,
            ) as ISAMLUserProfile;

            // Добавляем SAML-специфичные поля
            ssoProfile.nameID = profile.nameID as string | undefined;
            ssoProfile.nameIDFormat = profile.nameIDFormat as string | undefined;
            ssoProfile.sessionIndex = profile.sessionIndex as string | undefined;

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
                    providerId: providerConfig.id,
                    tenantId,
                },
                'SAML SSO authentication successful',
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
                'SAML SSO authentication failed',
            );

            done(error as Error);
        }
    }

    /**
     * Построение SAML конфигурации из IProviderConfig
     * @private
     */
    private buildSamlOptions(config: IProviderConfig): Record<string, unknown> {
        return {
            entryPoint: config.entryPoint,
            issuer: config.samlIssuer,
            callbackUrl: config.samlCallbackURL,
            cert: config.cert,
            privateKey: config.privateKey,
            signatureAlgorithm: 'sha256',
            identifierFormat: null, // Или 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
            authnContext: [
                'http://schemas.microsoft.com/ws/2008/06/identity/authenticationmethod/password',
            ],
            validateInResponseTo: false, // Для упрощения, можно включить для production
            disableRequestedAuthnContext: false,
        };
    }
}

