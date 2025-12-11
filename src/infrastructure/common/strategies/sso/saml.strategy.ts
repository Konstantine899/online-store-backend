import {
    ExternalRoleConfigModel,
    IProviderConfig,
} from '@app/domain/models/external-role-config.model';
import { ISAMLUserProfile } from '@app/domain/types/sso/sso-user-profile.types';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import { ExternalRoleSyncRepository } from '@app/infrastructure/repositories/role/external-role-sync.repository';
import { SSORoleSyncService } from '@app/infrastructure/services/role/sso/sso-role-sync.service';
import { SSOStateService } from '@app/infrastructure/services/role/sso/sso-state.service';
import { SSOUserProfileMapper } from '@app/infrastructure/services/role/sso/sso-user-profile.mapper';
import {
    BadRequestException,
    HttpException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { MultiSamlStrategy } from '@node-saml/passport-saml';
import { Request } from 'express';

/**
 * КРИТИЧНО: Переопределяем authenticate на прототипе MultiSamlStrategy глобально
 * Это должно произойти ДО создания любого экземпляра SAMLSSOStrategy
 * для гарантии, что passport.authenticate будет использовать переопределенный метод
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MultiSamlStrategyProto = MultiSamlStrategy.prototype as any;
if (
    MultiSamlStrategyProto.authenticate &&
    typeof MultiSamlStrategyProto.authenticate === 'function' &&
    !MultiSamlStrategyProto._samlAuthenticateOverridden
) {
    const originalAuthenticate = MultiSamlStrategyProto.authenticate;
    MultiSamlStrategyProto._originalAuthenticate = originalAuthenticate;

    MultiSamlStrategyProto.authenticate = function (req: Request): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const self = this as any;

        // КРИТИЧНО: ВСЕГДА восстанавливаем options ПЕРЕД вызовом originalAuthenticate
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proto = (self.constructor as any).prototype;

        if (proto && proto._samlOptions) {
            // Восстанавливаем options из прототипа
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            self.options = proto._samlOptions;
        } else {
            // Если options не найдены, вызываем error
            const errorMsg = 'SAML options not found on prototype';
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                const BaseStrategy = require('passport-strategy').Strategy;
                if (BaseStrategy?.prototype?.error && typeof BaseStrategy.prototype.error === 'function') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return (BaseStrategy.prototype.error as any).call(self, new Error(errorMsg));
                }
            } catch {
                // Игнорируем ошибки require
            }
            if (typeof self.error === 'function') {
                return self.error(new Error(errorMsg));
            }
            return;
        }

        // Вызываем оригинальный authenticate
        const originalAuth = MultiSamlStrategyProto._originalAuthenticate ?? originalAuthenticate;
        if (originalAuth && typeof originalAuth === 'function') {
            return originalAuth.call(self, req);
        }
        return originalAuthenticate.call(self, req);
    };

    MultiSamlStrategyProto._samlAuthenticateOverridden = true;
}

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

        // MultiSamlStrategy требует:
        // 1. Конфигурацию с getSamlOptions
        // 2. Функцию signon (validate) - для обработки профиля после успешной аутентификации
        // 3. Функцию logout (опционально) - для обработки logout
        // PassportStrategy автоматически создает _verify из метода validate,
        // но для MultiSamlStrategy нужно передать функции в конструктор
        super(
            {
                passReqToCallback: true, // Для получения request в getSamlOptions и validate
                getSamlOptions: async (
                    req: Request,
                    done: (err: Error | null, samlOptions?: unknown) => void,
                ) => {
                    try {
                        // Извлекаем RelayState из query параметров
                        const relayState =
                            (req.query.RelayState as string) ??
                            req.body?.RelayState;

                        if (!relayState) {
                            const error = new UnauthorizedException(
                                'RelayState отсутствует в SAML запросе',
                            );
                            return done(this.convertToPassportError(error));
                        }

                        // Валидируем state и получаем tenantId и providerId
                        const stateData =
                            this.ssoStateService.validateState(relayState);
                        if (!stateData) {
                            const error = new UnauthorizedException(
                                'Невалидный или истекший RelayState',
                            );
                            return done(this.convertToPassportError(error));
                        }

                        const { tenantId, providerId } = stateData;

                        // Получаем конфигурацию провайдера из БД
                        const providerConfig =
                            await this.externalRoleSyncRepository.findConfigById(
                                providerId,
                                tenantId,
                            );

                        if (!providerConfig) {
                            const error = new UnauthorizedException(
                                `Конфигурация провайдера ${providerId} не найдена`,
                            );
                            return done(this.convertToPassportError(error));
                        }

                        if (providerConfig.status !== 'ACTIVE') {
                            const error = new BadRequestException({
                                statusCode: HttpStatus.BAD_REQUEST,
                                message: `Провайдер ${providerConfig.name} неактивен (статус: ${providerConfig.status})`,
                            });
                            return done(this.convertToPassportError(error));
                        }

                        // Сохраняем providerConfig и tenantId в request для использования в validate
                        (
                            req as Request & {
                                ssoProviderConfig?: ExternalRoleConfigModel;
                                ssoTenantId?: number;
                            }
                        ).ssoProviderConfig = providerConfig;
                        (
                            req as Request & {
                                ssoProviderConfig?: ExternalRoleConfigModel;
                                ssoTenantId?: number;
                            }
                        ).ssoTenantId = tenantId;

                        // Строим SAML конфигурацию
                        const samlOptions = this.buildSamlOptions(
                            providerConfig.providerConfig,
                        );

                        done(null, samlOptions);
                    } catch (error: unknown) {
                        const errorMessage =
                            error instanceof Error
                                ? error.message
                                : String(error);
                        this.logger.error(
                            { error: errorMessage },
                            'Failed to get SAML options',
                        );
                        done(error as Error);
                    }
                },
            },
            // Функция signon (validate) - вызывается после успешной аутентификации
            async (
                req: Request & {
                    ssoProviderConfig?: ExternalRoleConfigModel;
                    ssoTenantId?: number;
                },
                profile: Record<string, unknown>,
                done: (error: Error | null, user?: unknown) => void,
            ) => {
                // Вызываем метод validate
                await this.validate(req, profile, done);
            },
            // Функция logout (опционально) - вызывается при logout
            async (
                req: Request & {
                    ssoProviderConfig?: ExternalRoleConfigModel;
                    ssoTenantId?: number;
                },
                profile: Record<string, unknown>,
                done: (error: Error | null, user?: unknown) => void,
            ) => {
                // Для logout используем ту же логику, что и для signon
                // В будущем можно добавить специальную логику для logout
                await this.validate(req, profile, done);
            },
        );

        // PassportStrategy может пытаться создать _verify из validate,
        // но MultiSamlStrategy использует функции signon/logout напрямую
        // Переопределяем _verify, чтобы избежать ошибок
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)._verify = (
            req: Request & {
                ssoProviderConfig?: ExternalRoleConfigModel;
                ssoTenantId?: number;
            },
            profile: Record<string, unknown>,
            done: (error: Error | null, user?: unknown) => void,
        ): void => {
            // Вызываем validate и обрабатываем результат
            this.validate(req, profile, done).catch((error) => {
                // Преобразуем NestJS исключения в стандартные Error
                const passportError = this.convertToPassportError(error);
                done(passportError);
            });
        };

        // КРИТИЧНО: Сохраняем options на прототипе для работы с Object.create(prototype)
        // MultiSamlStrategy создает новый экземпляр через Object.create(prototype) без вызова конструктора,
        // поэтому this.options может быть undefined. Сохраняем options на прототипе.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proto = (this.constructor as any).prototype;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentOptions = (this as any).options;
        if (proto && currentOptions) {
            // Сохраняем options на прототипе
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.defineProperty(proto, '_samlOptions', {
                value: currentOptions,
                writable: true,
                configurable: true,
                enumerable: false,
            });
            this.logger.debug(
                {
                    hasGetSamlOptions: !!currentOptions.getSamlOptions,
                },
                'SAML options saved on prototype',
            );
        } else {
            this.logger.warn(
                {
                    hasProto: !!proto,
                    hasOptions: !!currentOptions,
                },
                'Failed to save SAML options on prototype',
            );
        }

        // Переопределение authenticate уже выполнено на уровне модуля (до создания экземпляра)
        // Здесь только сохраняем options на прототипе для восстановления при Object.create(prototype)

    /**
     * Переопределяет authenticate на прототипе MultiSamlStrategy для работы с Object.create(prototype)
     * Должен вызываться из onModuleInit после создания экземпляра стратегии
     * @public
     */
    public ensureAuthenticateOverride(): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const MultiSamlStrategyProto = MultiSamlStrategy.prototype as any;

        // Проверяем, не переопределен ли уже метод (защита от множественных вызовов)
        if (MultiSamlStrategyProto._samlAuthenticateOverridden) {
            return;
        }

        const originalAuthenticate = MultiSamlStrategyProto.authenticate;

        if (
            originalAuthenticate &&
            typeof originalAuthenticate === 'function'
        ) {
            // Сохраняем оригинальный метод
            MultiSamlStrategyProto._originalAuthenticate = originalAuthenticate;

            // Переопределяем authenticate на прототипе MultiSamlStrategy
            MultiSamlStrategyProto.authenticate = function (req: Request): void {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const self = this as any;

                // КРИТИЧНО: ВСЕГДА восстанавливаем options ПЕРЕД вызовом originalAuthenticate
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const proto = (self.constructor as any).prototype;

                if (proto && proto._samlOptions) {
                    // Восстанавливаем options из прототипа
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    self.options = proto._samlOptions;
                } else {
                    // Если options не найдены, вызываем error
                    const errorMsg = 'SAML options not found on prototype';
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                        const BaseStrategy = require('passport-strategy').Strategy;
                        if (BaseStrategy?.prototype?.error && typeof BaseStrategy.prototype.error === 'function') {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            return (BaseStrategy.prototype.error as any).call(self, new Error(errorMsg));
                        }
                    } catch {
                        // Игнорируем ошибки require
                    }
                    if (typeof self.error === 'function') {
                        return self.error(new Error(errorMsg));
                    }
                    return;
                }

                // Вызываем оригинальный authenticate
                const originalAuth = MultiSamlStrategyProto._originalAuthenticate ?? originalAuthenticate;
                if (originalAuth && typeof originalAuth === 'function') {
                    return originalAuth.call(self, req);
                }
                return originalAuthenticate.call(self, req);
            };

            // Помечаем, что переопределение выполнено
            MultiSamlStrategyProto._samlAuthenticateOverridden = true;
        }
    }

    /**
     * Переопределяет authenticate на прототипе MultiSamlStrategy для работы с Object.create(prototype)
     * Должен вызываться из onModuleInit после создания экземпляра стратегии
     * @public
     */
    public ensureAuthenticateOverride(): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const MultiSamlStrategyProto = MultiSamlStrategy.prototype as any;
        const originalAuthenticate = MultiSamlStrategyProto.authenticate;

        // Проверяем, не переопределен ли уже метод
        if (MultiSamlStrategyProto._samlAuthenticateOverridden) {
            this.logger.debug('SAML authenticate already overridden');
            return;
        }

        if (
            originalAuthenticate &&
            typeof originalAuthenticate === 'function'
        ) {
            // Сохраняем оригинальный метод только если он еще не сохранен
            if (!MultiSamlStrategyProto._originalAuthenticate) {
                MultiSamlStrategyProto._originalAuthenticate = originalAuthenticate;
            }

            // Переопределяем authenticate на прототипе MultiSamlStrategy
            MultiSamlStrategyProto.authenticate = function (req: Request): void {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const self = this as any;

                // КРИТИЧНО: ВСЕГДА восстанавливаем options ПЕРЕД вызовом originalAuthenticate
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const proto = (self.constructor as any).prototype;

                if (proto && proto._samlOptions) {
                    // Восстанавливаем options из прототипа
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    self.options = proto._samlOptions;
                } else {
                    // Если options не найдены, вызываем error
                    const errorMsg = 'SAML options not found on prototype';
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                        const BaseStrategy = require('passport-strategy').Strategy;
                        if (BaseStrategy?.prototype?.error && typeof BaseStrategy.prototype.error === 'function') {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            return (BaseStrategy.prototype.error as any).call(self, new Error(errorMsg));
                        }
                    } catch {
                        // Игнорируем ошибки require
                    }
                    if (typeof self.error === 'function') {
                        return self.error(new Error(errorMsg));
                    }
                    return;
                }

                // Вызываем оригинальный authenticate
                const originalAuth = MultiSamlStrategyProto._originalAuthenticate ?? originalAuthenticate;
                if (originalAuth && typeof originalAuth === 'function') {
                    return originalAuth.call(self, req);
                }
                return originalAuthenticate.call(self, req);
            };

            // Помечаем, что переопределение выполнено
            MultiSamlStrategyProto._samlAuthenticateOverridden = true;
            this.logger.debug('SAML authenticate method overridden on MultiSamlStrategy.prototype');
        } else {
            this.logger.warn('Cannot override SAML authenticate - original method not found');
        }
    }

    /**
     * Валидация и обработка SAML callback
     */
    public async validate(
        req: Request & {
            ssoProviderConfig?: ExternalRoleConfigModel;
            ssoTenantId?: number;
        },
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
            ssoProfile.nameIDFormat = profile.nameIDFormat as
                | string
                | undefined;
            ssoProfile.sessionIndex = profile.sessionIndex as
                | string
                | undefined;

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

            // Преобразуем NestJS исключения в стандартные Error
            const passportError = this.convertToPassportError(error);
            done(passportError);
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
