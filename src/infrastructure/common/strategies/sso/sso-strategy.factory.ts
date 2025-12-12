import {
    BadRequestException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import { ExternalRoleSyncRepository } from '@app/infrastructure/repositories/role/external-role-sync.repository';
import { SSOStateService } from '@app/infrastructure/services/role/sso/sso-state.service';
import { ExternalRoleConfigModel, ExternalRoleProviderType } from '@app/domain/models/external-role-config.model';
import { IProviderConfig } from '@app/domain/models/external-role-config.model';

/**
 * SSOStrategyFactory - Фабрика для динамического создания SSO authorization URLs
 *
 * Используется для:
 * - Генерации authorization URLs с state parameter
 * - Валидации конфигураций провайдеров
 * - Определения типа стратегии по провайдеру
 */
@Injectable()
export class SSOStrategyFactory {
    private readonly logger = createLogger('SSOStrategyFactory');

    constructor(
        private readonly externalRoleSyncRepository: ExternalRoleSyncRepository,
        private readonly ssoStateService: SSOStateService,
    ) {}

    /**
     * Создать authorization URL для OAuth 2.0 провайдера
     * @param providerId - ID конфигурации провайдера
     * @param tenantId - ID тенанта
     * @param baseUrl - Базовый URL приложения (для callback)
     * @returns Authorization URL с state parameter
     */
    public async createOAuth2AuthorizationUrl(
        providerId: number,
        tenantId: number,
        baseUrl: string,
    ): Promise<string> {
        // Пропускаем проверку статуса, так как контроллер уже проверил
        const config = await this.getActiveConfig(providerId, tenantId, true);

        // Валидация OAuth 2.0 конфигурации
        this.validateOAuth2Config(config.providerConfig);

        // Генерируем state parameter
        const state = this.ssoStateService.generateState(tenantId, providerId);

        // Валидируем и строим authorization URL
        const authorizationURL = config.providerConfig.authorizationURL ?? '';
        if (!authorizationURL) {
            throw new BadRequestException(
                'OAuth 2.0 конфигурация должна содержать authorizationURL',
            );
        }

        const authURL = this.validateAndCreateURL(
            authorizationURL,
            'authorizationURL',
        );
        authURL.searchParams.set('client_id', config.providerConfig.clientId ?? '');
        authURL.searchParams.set('redirect_uri', config.providerConfig.callbackURL ?? `${baseUrl}/auth/sso/oauth2/callback`);
        authURL.searchParams.set('response_type', 'code');
        authURL.searchParams.set('scope', (config.providerConfig.scope ?? ['openid', 'profile', 'email']).join(' '));
        authURL.searchParams.set('state', state);

        this.logger.debug(
            {
                providerId,
                tenantId,
                authURL: authURL.toString(),
            },
            'Generated OAuth2 authorization URL',
        );

        return authURL.toString();
    }

    /**
     * Создать authorization URL для SAML провайдера
     * @param providerId - ID конфигурации провайдера
     * @param tenantId - ID тенанта
     * @param baseUrl - Базовый URL приложения (для callback)
     * @returns Authorization URL (SAML SSO URL) с RelayState
     */
    public async createSAMLAuthorizationUrl(
        providerId: number,
        tenantId: number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _baseUrl: string,
    ): Promise<string> {
        // Пропускаем проверку статуса, так как контроллер уже проверил
        const config = await this.getActiveConfig(providerId, tenantId, true);

        // Валидация SAML конфигурации
        this.validateSAMLConfig(config.providerConfig);

        // Генерируем state parameter (используется как RelayState в SAML)
        const state = this.ssoStateService.generateState(tenantId, providerId);

        // SAML entry point уже содержит все необходимые параметры
        const entryPoint = config.providerConfig.entryPoint ?? '';
        if (!entryPoint) {
            throw new BadRequestException(
                'SAML конфигурация должна содержать entryPoint',
            );
        }

        const entryURL = this.validateAndCreateURL(entryPoint, 'entryPoint');
        entryURL.searchParams.set('RelayState', state);

        this.logger.debug(
            {
                providerId,
                tenantId,
                entryPoint: entryURL.toString(),
            },
            'Generated SAML authorization URL',
        );

        return entryURL.toString();
    }

    /**
     * Создать authorization URL для OIDC провайдера
     * @param providerId - ID конфигурации провайдера
     * @param tenantId - ID тенанта
     * @param baseUrl - Базовый URL приложения (для callback)
     * @returns Authorization URL с state parameter
     */
    public async createOIDCAuthorizationUrl(
        providerId: number,
        tenantId: number,
        baseUrl: string,
    ): Promise<string> {
        // Пропускаем проверку статуса, так как контроллер уже проверил
        const config = await this.getActiveConfig(providerId, tenantId, true);

        // Валидация OIDC конфигурации
        this.validateOIDCConfig(config.providerConfig);

        // Генерируем state parameter
        const state = this.ssoStateService.generateState(tenantId, providerId);

        // OIDC использует authorization endpoint из issuer
        // Для упрощения используем authorizationURL если есть, иначе строим из issuer
        let authURL: string;
        if (config.providerConfig.authorizationURL) {
            authURL = config.providerConfig.authorizationURL;
        } else if (config.providerConfig.issuer) {
            authURL = `${config.providerConfig.issuer}/authorize`;
        } else {
            throw new BadRequestException(
                'OIDC конфигурация должна содержать authorizationURL или issuer',
            );
        }

        const url = this.validateAndCreateURL(authURL, 'authorizationURL или issuer');
        url.searchParams.set('client_id', config.providerConfig.clientId ?? '');
        url.searchParams.set('redirect_uri', config.providerConfig.callbackURL ?? `${baseUrl}/auth/sso/oidc/callback`);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', (config.providerConfig.scope ?? ['openid', 'profile', 'email']).join(' '));
        url.searchParams.set('state', state);

        this.logger.debug(
            {
                providerId,
                tenantId,
                authURL: url.toString(),
            },
            'Generated OIDC authorization URL',
        );

        return url.toString();
    }

    /**
     * Получить активную конфигурацию провайдера
     * @private
     * @param skipStatusCheck - Пропустить проверку статуса (если уже проверено в контроллере)
     */
    private async getActiveConfig(
        providerId: number,
        tenantId: number,
        skipStatusCheck = false,
    ): Promise<ExternalRoleConfigModel> {
        const config =
            await this.externalRoleSyncRepository.findConfigById(
                providerId,
                tenantId,
            );

        if (!config) {
            throw new NotFoundException(
                `Конфигурация провайдера ${providerId} не найдена`,
            );
        }

        // Проверяем статус только если не пропущена проверка
        // (контроллер уже проверил статус перед вызовом create*AuthorizationUrl)
        if (!skipStatusCheck && config.status !== 'ACTIVE') {
            throw new BadRequestException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `Провайдер ${config.name} неактивен (статус: ${config.status})`,
            });
        }

        return config;
    }

    /**
     * Валидация OAuth 2.0 конфигурации
     * @private
     */
    private validateOAuth2Config(config: IProviderConfig): void {
        const required = ['authorizationURL', 'tokenURL', 'clientId', 'clientSecret', 'callbackURL'];
        const missing = required.filter((field) => !config[field as keyof IProviderConfig]);

        if (missing.length > 0) {
            throw new BadRequestException(
                `OAuth 2.0 конфигурация неполная. Отсутствуют: ${missing.join(', ')}`,
            );
        }
    }

    /**
     * Валидация SAML конфигурации
     * @private
     */
    private validateSAMLConfig(config: IProviderConfig): void {
        const required = ['entryPoint', 'cert', 'samlIssuer', 'samlCallbackURL'];
        const missing = required.filter((field) => !config[field as keyof IProviderConfig]);

        if (missing.length > 0) {
            throw new BadRequestException(
                `SAML конфигурация неполная. Отсутствуют: ${missing.join(', ')}`,
            );
        }
    }

    /**
     * Валидация OIDC конфигурации
     * @private
     */
    private validateOIDCConfig(config: IProviderConfig): void {
        const required = ['issuer', 'clientId', 'clientSecret', 'callbackURL'];
        const missing = required.filter((field) => !config[field as keyof IProviderConfig]);

        if (missing.length > 0) {
            throw new BadRequestException(
                `OIDC конфигурация неполная. Отсутствуют: ${missing.join(', ')}`,
            );
        }
    }

    /**
     * Валидация и создание URL объекта
     * @private
     * @param urlString - строка URL для валидации
     * @param fieldName - имя поля для сообщения об ошибке
     * @returns Валидный URL объект
     * @throws BadRequestException если URL невалиден
     */
    private validateAndCreateURL(urlString: string, fieldName: string): URL {
        try {
            const url = new URL(urlString);
            // Дополнительная проверка: URL должен быть http или https
            if (!['http:', 'https:'].includes(url.protocol)) {
                throw new BadRequestException(
                    `${fieldName} должен использовать протокол http или https`,
                );
            }
            return url;
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            this.logger.warn(
                { urlString, fieldName, error: errorMessage },
                'Invalid URL in SSO configuration',
            );
            throw new BadRequestException(
                `Невалидный URL в поле ${fieldName}: ${errorMessage}`,
            );
        }
    }

    /**
     * Определить тип стратегии по типу провайдера
     */
    public getStrategyType(
        providerType: ExternalRoleProviderType,
    ): 'oauth2' | 'saml' | 'oidc' {
        switch (providerType) {
            case 'AZURE_AD':
            case 'GOOGLE_WORKSPACE':
            case 'GENERIC_OAUTH2':
                return 'oauth2';
            case 'SAML':
                return 'saml';
            case 'OIDC':
                return 'oidc';
            default:
                throw new BadRequestException(
                    `Неподдерживаемый тип провайдера: ${providerType}`,
                );
        }
    }
}

