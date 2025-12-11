/**
 * Unit тесты для SSOStrategyFactory
 * Покрывают генерацию authorization URLs и валидацию конфигураций
 *
 * Related to: SAAS-017-19, Этап 3
 */

import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SSOStrategyFactory } from '../sso-strategy.factory';
import { ExternalRoleSyncRepository } from '@app/infrastructure/repositories/role/external-role-sync.repository';
import { SSOStateService } from '@app/infrastructure/services/role/sso/sso-state.service';
import {
    ExternalRoleConfigModel,
    ExternalRoleProviderType,
    IProviderConfig,
} from '@app/domain/models/external-role-config.model';

describe('SSOStrategyFactory (unit)', () => {
    let factory: SSOStrategyFactory;
    let externalRoleSyncRepository: jest.Mocked<ExternalRoleSyncRepository>;
    let ssoStateService: jest.Mocked<SSOStateService>;

    const mockTenantId = 1;
    const mockProviderId = 100;
    const mockBaseUrl = 'https://example.com';

    const createMockConfig = (
        providerType: ExternalRoleProviderType,
        status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE',
        providerConfig: Partial<IProviderConfig> = {},
    ): ExternalRoleConfigModel => {
        const baseConfig: Partial<ExternalRoleConfigModel> = {
            id: mockProviderId,
            tenantId: mockTenantId,
            providerType,
            name: 'Test Provider',
            description: 'Test Description',
            status,
            syncEnabled: true,
            syncSchedule: '0 0 * * *',
            syncMode: 'FULL',
            credentialsEncrypted: true,
            verifySSL: true,
            timeoutMs: 30000,
            errorCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return {
            ...baseConfig,
            providerConfig: providerConfig as IProviderConfig,
        } as ExternalRoleConfigModel;
    };

    beforeEach(async () => {
        const mockExternalRoleSyncRepository = {
            findConfigById: jest.fn(),
        };

        const mockSSOStateService = {
            generateState: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SSOStrategyFactory,
                {
                    provide: ExternalRoleSyncRepository,
                    useValue: mockExternalRoleSyncRepository,
                },
                {
                    provide: SSOStateService,
                    useValue: mockSSOStateService,
                },
            ],
        }).compile();

        factory = module.get<SSOStrategyFactory>(SSOStrategyFactory);
        externalRoleSyncRepository = module.get(
            ExternalRoleSyncRepository,
        ) as jest.Mocked<ExternalRoleSyncRepository>;
        ssoStateService = module.get(SSOStateService) as jest.Mocked<SSOStateService>;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================================
    // TESTS: getStrategyType()
    // ============================================================================

    describe('getStrategyType', () => {
        it('должен возвращать "oauth2" для OAuth 2.0 провайдеров', () => {
            expect(factory.getStrategyType('AZURE_AD')).toBe('oauth2');
            expect(factory.getStrategyType('GOOGLE_WORKSPACE')).toBe('oauth2');
            expect(factory.getStrategyType('GENERIC_OAUTH2')).toBe('oauth2');
        });

        it('должен возвращать "saml" для SAML провайдера', () => {
            expect(factory.getStrategyType('SAML')).toBe('saml');
        });

        it('должен возвращать "oidc" для OIDC провайдера', () => {
            expect(factory.getStrategyType('OIDC')).toBe('oidc');
        });

        it('должен выбрасывать BadRequestException для неподдерживаемого типа', () => {
            expect(() => {
                factory.getStrategyType('LDAP' as ExternalRoleProviderType);
            }).toThrow(BadRequestException);
        });
    });

    // ============================================================================
    // TESTS: createOAuth2AuthorizationUrl()
    // ============================================================================

    describe('createOAuth2AuthorizationUrl', () => {
        const oauth2Config: Partial<IProviderConfig> = {
            authorizationURL: 'https://oauth2.example.com/authorize',
            tokenURL: 'https://oauth2.example.com/token',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            callbackURL: 'https://example.com/auth/sso/oauth2/callback',
            scope: ['openid', 'profile', 'email'],
        };

        beforeEach(() => {
            ssoStateService.generateState.mockReturnValue('test-state-12345');
        });

        it('должен создавать корректный OAuth 2.0 authorization URL', async () => {
            const config = createMockConfig('AZURE_AD', 'ACTIVE', oauth2Config);
            externalRoleSyncRepository.findConfigById.mockResolvedValue(config);

            const url = await factory.createOAuth2AuthorizationUrl(
                mockProviderId,
                mockTenantId,
                mockBaseUrl,
            );

            expect(url).toContain('https://oauth2.example.com/authorize');
            expect(url).toContain('client_id=test-client-id');
            expect(url).toContain('redirect_uri=');
            expect(url).toMatch(/redirect_uri=.*(auth\/sso\/oauth2\/callback|auth%2Fsso%2Foauth2%2Fcallback)/);
            expect(url).toContain('response_type=code');
            expect(url).toContain('scope=');
            expect(url).toMatch(/scope=(openid%20profile%20email|openid\+profile\+email)/);
            expect(url).toContain('state=test-state-12345');
            expect(ssoStateService.generateState).toHaveBeenCalledWith(
                mockTenantId,
                mockProviderId,
            );
        });

        it('должен выбрасывать BadRequestException если callbackURL отсутствует в конфигурации', async () => {
            const config = createMockConfig('GOOGLE_WORKSPACE', 'ACTIVE', {
                ...oauth2Config,
                callbackURL: undefined,
            });
            externalRoleSyncRepository.findConfigById.mockResolvedValue(config);

            await expect(
                factory.createOAuth2AuthorizationUrl(
                    mockProviderId,
                    mockTenantId,
                    mockBaseUrl,
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен использовать дефолтные scope если они не указаны', async () => {
            const config = createMockConfig('GENERIC_OAUTH2', 'ACTIVE', {
                ...oauth2Config,
                scope: undefined,
            });
            externalRoleSyncRepository.findConfigById.mockResolvedValue(config);

            const url = await factory.createOAuth2AuthorizationUrl(
                mockProviderId,
                mockTenantId,
                mockBaseUrl,
            );

            expect(url).toContain('scope=');
            expect(url).toMatch(/scope=(openid%20profile%20email|openid\+profile\+email)/);
        });

        it('должен выбрасывать NotFoundException если конфигурация не найдена', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(null);

            await expect(
                factory.createOAuth2AuthorizationUrl(
                    mockProviderId,
                    mockTenantId,
                    mockBaseUrl,
                ),
            ).rejects.toThrow(NotFoundException);
        });

        it('должен выбрасывать BadRequestException если отсутствуют обязательные поля', async () => {
            const config = createMockConfig('AZURE_AD', 'ACTIVE', {
                authorizationURL: 'https://oauth2.example.com/authorize',
                // Отсутствуют tokenURL, clientId, clientSecret, callbackURL
            });
            externalRoleSyncRepository.findConfigById.mockResolvedValue(config);

            await expect(
                factory.createOAuth2AuthorizationUrl(
                    mockProviderId,
                    mockTenantId,
                    mockBaseUrl,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ============================================================================
    // TESTS: createSAMLAuthorizationUrl()
    // ============================================================================

    describe('createSAMLAuthorizationUrl', () => {
        const samlConfig: Partial<IProviderConfig> = {
            entryPoint: 'https://saml.example.com/sso',
            cert: '-----BEGIN CERTIFICATE-----',
            samlIssuer: 'test-issuer',
            samlCallbackURL: 'https://example.com/auth/sso/saml/callback',
        };

        beforeEach(() => {
            ssoStateService.generateState.mockReturnValue('test-relay-state-12345');
        });

        it('должен создавать корректный SAML authorization URL с RelayState', async () => {
            const config = createMockConfig('SAML', 'ACTIVE', samlConfig);
            externalRoleSyncRepository.findConfigById.mockResolvedValue(config);

            const url = await factory.createSAMLAuthorizationUrl(
                mockProviderId,
                mockTenantId,
                mockBaseUrl,
            );

            expect(url).toContain('https://saml.example.com/sso');
            expect(url).toContain('RelayState=test-relay-state-12345');
            expect(ssoStateService.generateState).toHaveBeenCalledWith(
                mockTenantId,
                mockProviderId,
            );
        });

        it('должен выбрасывать NotFoundException если конфигурация не найдена', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(null);

            await expect(
                factory.createSAMLAuthorizationUrl(
                    mockProviderId,
                    mockTenantId,
                    mockBaseUrl,
                ),
            ).rejects.toThrow(NotFoundException);
        });

        it('должен выбрасывать BadRequestException если отсутствуют обязательные поля', async () => {
            const config = createMockConfig('SAML', 'ACTIVE', {
                entryPoint: 'https://saml.example.com/sso',
                // Отсутствуют cert, samlIssuer, samlCallbackURL
            });
            externalRoleSyncRepository.findConfigById.mockResolvedValue(config);

            await expect(
                factory.createSAMLAuthorizationUrl(
                    mockProviderId,
                    mockTenantId,
                    mockBaseUrl,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ============================================================================
    // TESTS: createOIDCAuthorizationUrl()
    // ============================================================================

    describe('createOIDCAuthorizationUrl', () => {
        const oidcConfig: Partial<IProviderConfig> = {
            issuer: 'https://oidc.example.com',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            callbackURL: 'https://example.com/auth/sso/oidc/callback',
            scope: ['openid', 'profile', 'email'],
        };

        beforeEach(() => {
            ssoStateService.generateState.mockReturnValue('test-state-oidc-12345');
        });

        it('должен создавать корректный OIDC authorization URL используя issuer', async () => {
            const config = createMockConfig('OIDC', 'ACTIVE', oidcConfig);
            externalRoleSyncRepository.findConfigById.mockResolvedValue(config);

            const url = await factory.createOIDCAuthorizationUrl(
                mockProviderId,
                mockTenantId,
                mockBaseUrl,
            );

            expect(url).toContain('https://oidc.example.com/authorize');
            expect(url).toContain('client_id=test-client-id');
            expect(url).toContain('redirect_uri=');
            expect(url).toMatch(/redirect_uri=.*(auth\/sso\/oidc\/callback|auth%2Fsso%2Foidc%2Fcallback)/);
            expect(url).toContain('response_type=code');
            expect(url).toContain('scope=');
            expect(url).toMatch(/scope=(openid%20profile%20email|openid\+profile\+email)/);
            expect(url).toContain('state=test-state-oidc-12345');
            expect(ssoStateService.generateState).toHaveBeenCalledWith(
                mockTenantId,
                mockProviderId,
            );
        });

        it('должен использовать authorizationURL если он указан вместо issuer', async () => {
            const config = createMockConfig('OIDC', 'ACTIVE', {
                ...oidcConfig,
                authorizationURL: 'https://custom-auth.example.com/auth',
            });
            externalRoleSyncRepository.findConfigById.mockResolvedValue(config);

            const url = await factory.createOIDCAuthorizationUrl(
                mockProviderId,
                mockTenantId,
                mockBaseUrl,
            );

            expect(url).toContain('https://custom-auth.example.com/auth');
            expect(url).not.toContain('https://oidc.example.com/authorize');
        });

        it('должен выбрасывать BadRequestException если callbackURL отсутствует в конфигурации', async () => {
            const config = createMockConfig('OIDC', 'ACTIVE', {
                ...oidcConfig,
                callbackURL: undefined,
            });
            externalRoleSyncRepository.findConfigById.mockResolvedValue(config);

            await expect(
                factory.createOIDCAuthorizationUrl(
                    mockProviderId,
                    mockTenantId,
                    mockBaseUrl,
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен использовать дефолтные scope если они не указаны', async () => {
            const config = createMockConfig('OIDC', 'ACTIVE', {
                ...oidcConfig,
                scope: undefined,
            });
            externalRoleSyncRepository.findConfigById.mockResolvedValue(config);

            const url = await factory.createOIDCAuthorizationUrl(
                mockProviderId,
                mockTenantId,
                mockBaseUrl,
            );

            expect(url).toContain('scope=');
            expect(url).toMatch(/scope=(openid%20profile%20email|openid\+profile\+email)/);
        });

        it('должен выбрасывать BadRequestException если нет ни authorizationURL ни issuer', async () => {
            const config = createMockConfig('OIDC', 'ACTIVE', {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                callbackURL: 'https://example.com/auth/sso/oidc/callback',
                // Отсутствуют authorizationURL и issuer
            });
            externalRoleSyncRepository.findConfigById.mockResolvedValue(config);

            await expect(
                factory.createOIDCAuthorizationUrl(
                    mockProviderId,
                    mockTenantId,
                    mockBaseUrl,
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен выбрасывать NotFoundException если конфигурация не найдена', async () => {
            externalRoleSyncRepository.findConfigById.mockResolvedValue(null);

            await expect(
                factory.createOIDCAuthorizationUrl(
                    mockProviderId,
                    mockTenantId,
                    mockBaseUrl,
                ),
            ).rejects.toThrow(NotFoundException);
        });

        it('должен выбрасывать BadRequestException если отсутствуют обязательные поля', async () => {
            const config = createMockConfig('OIDC', 'ACTIVE', {
                issuer: 'https://oidc.example.com',
                // Отсутствуют clientId, clientSecret, callbackURL
            });
            externalRoleSyncRepository.findConfigById.mockResolvedValue(config);

            await expect(
                factory.createOIDCAuthorizationUrl(
                    mockProviderId,
                    mockTenantId,
                    mockBaseUrl,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
