import { IOAuth2UserProfile } from '@app/domain/types/sso/sso-user-profile.types';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import { ExternalRoleSyncRepository } from '@app/infrastructure/repositories/role/external-role-sync.repository';
import { SSORoleSyncService } from '@app/infrastructure/services/role/sso/sso-role-sync.service';
import { SSOStateService } from '@app/infrastructure/services/role/sso/sso-state.service';
import { SSOUserProfileMapper } from '@app/infrastructure/services/role/sso/sso-user-profile.mapper';
import {
    HttpException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { PassportCustomStrategyWrapper } from './passport-custom-wrapper';

/**
 * Базовая OAuth 2.0 стратегия для SSO
 *
 * Использует passport-custom для полного контроля над OAuth 2.0 flow,
 * так как passport-oauth2 требует валидную конфигурацию при инициализации,
 * что не подходит для динамической конфигурации из БД.
 *
 * Особенности:
 * - Динамическая конфигурация из ExternalRoleConfig (tenant-specific)
 * - Использование state parameter для передачи providerId и tenantId
 * - Just-in-time provisioning через SSORoleSyncService
 * - Автоматическая синхронизация ролей
 * - Полный контроль над OAuth 2.0 flow (authorization code exchange, token exchange, userInfo fetch)
 *
 * Использование:
 * - Регистрируется как 'oauth2' стратегия
 * - Конфигурация получается из БД по providerId из state parameter
 */
@Injectable()
export class OAuth2SSOStrategy extends PassportStrategy(
    PassportCustomStrategyWrapper,
    'oauth2',
) {
    private readonly logger = createLogger('OAuth2SSOStrategy');

    constructor(
        private readonly externalRoleSyncRepository: ExternalRoleSyncRepository,
        private readonly ssoStateService: SSOStateService,
        private readonly ssoUserProfileMapper: SSOUserProfileMapper,
        private readonly ssoRoleSyncService: SSORoleSyncService,
    ) {
        // PassportStrategy создает callback из validate и передает его в super() как последний аргумент
        // PassportCustomStrategyWrapper извлекает callback из аргументов и передает его в passport-custom
        // как первый аргумент, что решает проблему несовместимости
        super();
    }

    /**
     * Валидация и обработка OAuth 2.0 callback
     * Используется как кастомная стратегия через passport-custom
     * Реализует полный OAuth 2.0 Authorization Code flow
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

            // Валидируем обязательные поля конфигурации
            if (
                !providerConfig.providerConfig.tokenURL ||
                !providerConfig.providerConfig.clientId ||
                !providerConfig.providerConfig.clientSecret
            ) {
                throw new UnauthorizedException(
                    'OAuth 2.0 конфигурация неполная. Отсутствуют обязательные поля: tokenURL, clientId, clientSecret',
                );
            }

            // Обмениваем authorization code на access token
            const { accessToken, refreshToken } =
                await this.exchangeCodeForToken(
                    code,
                    {
                        tokenURL: providerConfig.providerConfig.tokenURL,
                        clientId: providerConfig.providerConfig.clientId,
                        clientSecret:
                            providerConfig.providerConfig.clientSecret,
                        callbackURL:
                            providerConfig.providerConfig.callbackURL ??
                            `${req.protocol}://${req.get('host')}${req.path}`,
                    },
                    req,
                );

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

            // Создаем профиль из userInfo или используем пустой объект
            const fullProfile = userInfo ?? {};

            // Добавляем токены в профиль
            fullProfile.accessToken = accessToken;
            if (refreshToken) {
                fullProfile.refreshToken = refreshToken;
            }

            // Маппим профиль в стандартный формат
            const ssoProfile = this.ssoUserProfileMapper.mapProfile(
                fullProfile,
                providerConfig.providerConfig,
            ) as IOAuth2UserProfile;

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
                'SSO authentication failed',
            );

            // Пробрасываем ошибку дальше - она будет обработана в _verify
            throw error;
        }
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
                    : (message ?? error.message);
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

    /**
     * Обмен authorization code на access token
     * @private
     */
    private async exchangeCodeForToken(
        code: string,
        config: {
            tokenURL: string;
            clientId: string;
            clientSecret: string;
            callbackURL: string;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _req: Request,
    ): Promise<{ accessToken: string; refreshToken?: string }> {
        const axios = (await import('axios')).default;

        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', config.callbackURL);
        params.append('client_id', config.clientId);
        params.append('client_secret', config.clientSecret);

        const response = await axios.post(config.tokenURL, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
        });

        const tokenData = response.data as {
            access_token: string;
            refresh_token?: string;
            token_type?: string;
            expires_in?: number;
        };

        if (!tokenData.access_token) {
            throw new UnauthorizedException(
                'Access token не получен от провайдера',
            );
        }

        return {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
        };
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
