import { PassportStrategy } from '@nestjs/passport';
import { CustomPassportStrategy } from './custom-passport-strategy';
import {
    HttpException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import * as oidc from 'openid-client';
import { ExternalRoleSyncRepository } from '@app/infrastructure/repositories/role/external-role-sync.repository';
import { SSOStateService } from '@app/infrastructure/services/role/sso/sso-state.service';
import { SSOUserProfileMapper } from '@app/infrastructure/services/role/sso/sso-user-profile.mapper';
import { SSORoleSyncService } from '@app/infrastructure/services/role/sso/sso-role-sync.service';
import { IOIDCUserProfile } from '@app/domain/types/sso/sso-user-profile.types';
import { IProviderConfig } from '@app/domain/models/external-role-config.model';

/**
 * OIDC стратегия для SSO
 *
 * Использует openid-client (panva) для работы с OpenID Connect.
 * Создает обертку над openid-client для интеграции с NestJS Passport.
 *
 * Особенности:
 * - Динамическая конфигурация через discovery
 * - Использование state parameter для передачи providerId и tenantId
 * - Just-in-time provisioning
 * - Автоматическая синхронизация ролей
 *
 * Примечание: Использует passport-custom для создания кастомной стратегии,
 * так как openid-client не является Passport стратегией напрямую.
 */
@Injectable()
export class OIDCSSOStrategy extends PassportStrategy(
    CustomPassportStrategy,
    'oidc',
) {
    private readonly logger = createLogger('OIDCSSOStrategy');
    private readonly clientCache = new Map<
        number,
        { client: oidc.Client; expiresAt: number }
    >();
    private readonly CLIENT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 час

    constructor(
        private readonly externalRoleSyncRepository: ExternalRoleSyncRepository,
        private readonly ssoStateService: SSOStateService,
        private readonly ssoUserProfileMapper: SSOUserProfileMapper,
        private readonly ssoRoleSyncService: SSORoleSyncService,
    ) {
        // CustomPassportStrategy извлекает callback из аргументов и устанавливает его как _verify
        // на прототипе для правильной работы с Object.create(prototype)
        super();
    }

    /**
     * Валидация и обработка OIDC callback
     * Используется как кастомная стратегия через passport-custom
     */
    public async validate(req: Request): Promise<unknown> {
        try {
            // Извлекаем state и code из query параметров
            const state = (req.query.state as string) ?? req.body?.state;
            const code = (req.query.code as string) ?? req.body?.code;

            if (!state) {
                throw new UnauthorizedException(
                    'State parameter отсутствует в callback',
                );
            }

            if (!code) {
                throw new UnauthorizedException(
                    'Authorization code отсутствует в callback',
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

            // Получаем или создаем OIDC client
            const client = await this.getOrCreateClient(
                providerConfig.providerConfig,
                providerId,
            );

            // Обмениваем code на токены
            const params = client.callbackParams(req.url);
            const tokenSet = await client.callback(
                providerConfig.providerConfig.callbackURL ?? '',
                params,
                {
                    state,
                },
            );

            // Получаем userinfo (если access_token доступен)
            let userinfo: Record<string, unknown> = {};
            if (tokenSet.access_token) {
                try {
                    userinfo = (await client.userinfo(
                        tokenSet.access_token,
                    )) as Record<string, unknown>;
                } catch (error: unknown) {
                    this.logger.warn(
                        {
                            error:
                                error instanceof Error
                                    ? error.message
                                    : String(error),
                        },
                        'Failed to fetch userinfo, using id_token claims',
                    );
                    // Если userinfo недоступен, используем claims из id_token
                    if (tokenSet.claims) {
                        userinfo = tokenSet.claims as Record<string, unknown>;
                    }
                }
            } else if (tokenSet.claims) {
                // Используем claims из id_token если нет access_token
                userinfo = tokenSet.claims as Record<string, unknown>;
            }

            // Строим профиль из userinfo и id_token
            const profile: Record<string, unknown> = {
                ...userinfo,
                idToken: tokenSet.id_token,
                accessToken: tokenSet.access_token,
                refreshToken: tokenSet.refresh_token,
            };

            // Маппим профиль в стандартный формат
            const ssoProfile = this.ssoUserProfileMapper.mapProfile(
                profile,
                providerConfig.providerConfig,
            ) as IOIDCUserProfile;

            // Добавляем OIDC-специфичные поля
            ssoProfile.sub = userinfo.sub as string | undefined;
            ssoProfile.idToken = tokenSet.id_token;
            ssoProfile.accessToken = tokenSet.access_token;
            ssoProfile.refreshToken = tokenSet.refresh_token;

            // Provision пользователя (just-in-time)
            const user = await this.ssoRoleSyncService.provisionUser(ssoProfile);

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
                'OIDC SSO authentication successful',
            );

            // Возвращаем пользователя для Passport
            return {
                user,
                ssoProfile,
                providerConfig,
            };
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            this.logger.error(
                { error: errorMessage },
                'OIDC SSO authentication failed',
            );

            throw error;
        }
    }

    /**
     * Получить или создать OIDC client (с кэшированием)
     * @private
     */
    private async getOrCreateClient(
        config: IProviderConfig,
        providerId: number,
    ): Promise<oidc.Client> {
        // Проверяем кэш
        const cached = this.clientCache.get(providerId);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.client;
        }

        // Создаем новый client через discovery
        const issuer = config.issuer;
        if (!issuer) {
            throw new UnauthorizedException(
                'OIDC issuer не указан в конфигурации',
            );
        }

        const server = new URL(issuer);
        const clientId = config.clientId;
        const clientSecret = config.clientSecret;

        if (!clientId) {
            throw new UnauthorizedException(
                'OIDC clientId не указан в конфигурации',
            );
        }

        // Discovery конфигурации сервера и создание client
        const client = await oidc.discovery(
            server,
            clientId,
            clientSecret
                ? oidc.ClientSecretPost(clientSecret)
                : oidc.None(),
        );

        // Кэшируем client
        this.clientCache.set(providerId, {
            client,
            expiresAt: Date.now() + this.CLIENT_CACHE_TTL_MS,
        });

        this.logger.debug(
            { providerId, issuer },
            'OIDC client created and cached',
        );

        return client;
    }

    /**
     * Преобразует NestJS исключения в стандартные Error для Passport
     * Сохраняет статус-код в свойстве statusCode для обработки exception filter
     * @private
     */
    private convertToPassportError(error: unknown): Error {
        if (error instanceof HttpException) {
            // Создаем стандартный Error с сохранением статус-кода
            const statusCode = error.getStatus();
            const response = error.getResponse();
            let errorMessage: string;

            if (typeof response === 'string') {
                errorMessage = response;
            } else if (
                typeof response === 'object' &&
                response !== null &&
                'message' in response
            ) {
                const message = (response as { message?: string | string[] })
                    .message;
                errorMessage = Array.isArray(message)
                    ? message.join(', ')
                    : message ?? error.message;
            } else {
                errorMessage = error.message;
            }

            const passportError = new Error(errorMessage);
            // Сохраняем статус-код для обработки exception filter
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (passportError as any).statusCode = statusCode;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (passportError as any).response = response;

            return passportError;
        }

        if (error instanceof Error) {
            return error;
        }

        // Для неизвестных ошибок создаем стандартный Error
        const unknownError = new Error(String(error));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (unknownError as any).statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        return unknownError;
    }
}

