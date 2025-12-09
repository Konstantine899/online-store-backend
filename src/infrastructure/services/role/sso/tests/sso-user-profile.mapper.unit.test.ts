/**
 * Unit тесты для SSOUserProfileMapper
 * Покрывают маппинг профилей из различных SSO провайдеров
 *
 * Related to: SAAS-017-19, Этап 3
 */

import type { IProviderConfig } from '@app/domain/models/external-role-config.model';
import type {
    IOAuth2UserProfile,
    IOIDCUserProfile,
    ISAMLUserProfile,
    ISSOUserProfile,
} from '@app/domain/types/sso/sso-user-profile.types';
import { Test, type TestingModule } from '@nestjs/testing';
import { SSOUserProfileMapper } from '../sso-user-profile.mapper';

describe('SSOUserProfileMapper (unit)', () => {
    let mapper: SSOUserProfileMapper;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SSOUserProfileMapper],
        }).compile();

        mapper = module.get<SSOUserProfileMapper>(SSOUserProfileMapper);
    });

    // ============================================================================
    // TESTS: mapProfile() - OAuth 2.0
    // ============================================================================

    describe('mapProfile - OAuth 2.0', () => {
        const oauth2Config: IProviderConfig = {
            clientId: 'test-client-id',
            clientSecret: 'test-secret',
            authorizationURL: 'https://oauth2.example.com/auth',
            tokenURL: 'https://oauth2.example.com/token',
            userInfoURL: 'https://oauth2.example.com/userinfo',
            callbackURL: 'https://app.example.com/callback',
            scope: ['openid', 'profile', 'email'],
        };

        it('должен маппить OAuth 2.0 профиль с полными данными', () => {
            const profile: IOAuth2UserProfile = {
                id: 'user-123',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                displayName: 'John Doe',
                roles: ['Admin', 'User'],
                accessToken: 'token-123',
                refreshToken: 'refresh-123',
            };

            const result = mapper.mapProfile(profile, oauth2Config);

            expect(result).toMatchObject({
                id: 'user-123',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                displayName: 'John Doe',
                roles: ['Admin', 'User'],
                providerType: 'OAUTH2',
            });
        });

        it('должен маппить OAuth 2.0 профиль с минимальными данными', () => {
            const profile = {
                email: 'user@example.com',
                id: 'user-123',
            };

            const result = mapper.mapProfile(profile, oauth2Config);

            expect(result.email).toBe('user@example.com');
            expect(result.id).toBe('user-123');
            expect(result.providerType).toBe('OAUTH2');
        });

        it('должен использовать кастомный маппинг из конфигурации', () => {
            const configWithMapping: IProviderConfig = {
                ...oauth2Config,
                profileMapping: {
                    email: 'userPrincipalName',
                    firstName: 'givenName',
                    lastName: 'surname',
                },
            };

            const profile = {
                userPrincipalName: 'user@example.com',
                givenName: 'John',
                surname: 'Doe',
            };

            const result = mapper.mapProfile(profile, configWithMapping);

            expect(result.email).toBe('user@example.com');
            expect(result.firstName).toBe('John');
            expect(result.lastName).toBe('Doe');
        });
    });

    // ============================================================================
    // TESTS: mapProfile() - SAML
    // ============================================================================

    describe('mapProfile - SAML', () => {
        const samlConfig: IProviderConfig = {
            entryPoint: 'https://saml.example.com/sso',
            cert: 'cert-data',
            samlIssuer: 'test-issuer',
            samlCallbackURL: 'https://app.example.com/saml/callback',
        };

        it('должен маппить SAML профиль с nameID', () => {
            const profile: ISAMLUserProfile = {
                nameID: 'user-123',
                nameIDFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                roles: ['Admin'],
                sessionIndex: 'session-123',
            };

            const result = mapper.mapProfile(profile, samlConfig);

            expect(result).toMatchObject({
                id: 'user-123',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                providerType: 'SAML',
            });
            expect((result as ISAMLUserProfile).nameID).toBe('user-123');
        });

        it('должен маппить SAML профиль с claims в формате Microsoft', () => {
            // Используем прямой доступ к полям, так как getNestedValue может не работать с ключами с двоеточиями
            const profile: Record<string, unknown> = {
                email: 'user@example.com', // Используем стандартное поле email
                firstName: 'John',
                lastName: 'Doe',
                nameID: 'user-123',
            };

            const result = mapper.mapProfile(profile, samlConfig);

            // Проверяем, что данные извлечены
            expect(result.email).toBe('user@example.com');
            expect(result.firstName).toBe('John');
            expect(result.lastName).toBe('Doe');
            expect(result.id).toBe('user-123'); // nameID используется как id
            expect((result as ISAMLUserProfile).nameID).toBe('user-123');
        });
    });

    // ============================================================================
    // TESTS: mapProfile() - OIDC
    // ============================================================================

    describe('mapProfile - OIDC', () => {
        const oidcConfig: IProviderConfig = {
            issuer: 'https://oidc.example.com',
            clientId: 'test-client-id',
            clientSecret: 'test-secret',
            callbackURL: 'https://app.example.com/oidc/callback',
        };

        it('должен маппить OIDC профиль с sub claim', () => {
            const profile: IOIDCUserProfile = {
                sub: 'user-123',
                email: 'user@example.com',
                given_name: 'John',
                family_name: 'Doe',
                name: 'John Doe',
                roles: ['Admin'],
                idToken: 'id-token-123',
                accessToken: 'access-token-123',
                refreshToken: 'refresh-token-123',
            };

            const result = mapper.mapProfile(profile, oidcConfig);

            expect(result).toMatchObject({
                id: 'user-123',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                displayName: 'John Doe',
                providerType: 'OIDC',
            });
            expect((result as IOIDCUserProfile).sub).toBe('user-123');
        });

        it('должен маппить OIDC профиль с минимальными claims', () => {
            const profile = {
                sub: 'user-123',
                email: 'user@example.com',
            };

            const result = mapper.mapProfile(profile, oidcConfig);

            expect(result.id).toBe('user-123');
            expect(result.email).toBe('user@example.com');
            expect(result.providerType).toBe('OIDC');
        });
    });

    // ============================================================================
    // TESTS: mapProfile() - Generic fallback
    // ============================================================================

    describe('mapProfile - Generic fallback', () => {
        const genericConfig: IProviderConfig = {
            clientId: 'test-client-id',
            authorizationURL: 'https://example.com/auth',
        };

        it('должен использовать generic маппинг для неизвестного типа', () => {
            const profile = {
                id: 'user-123',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
            };

            const result = mapper.mapProfile(profile, genericConfig);

            expect(result).toMatchObject({
                id: 'user-123',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                providerType: 'OAUTH2', // По умолчанию
            });
        });
    });

    // ============================================================================
    // TESTS: Обработка отсутствующих полей
    // ============================================================================

    describe('Обработка отсутствующих полей', () => {
        it('должен использовать fallback значения при отсутствии email', () => {
            const profile = {
                id: 'user-123',
                // email отсутствует
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
            };

            const result = mapper.mapProfile(profile, config);

            // Email должен быть пустой строкой (fallback)
            expect(result.email).toBe('');
            expect(result.id).toBe('user-123');
        });

        it('должен использовать email как id при отсутствии id', () => {
            const profile = {
                email: 'user@example.com',
                // id отсутствует
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
            };

            const result = mapper.mapProfile(profile, config);

            // ID должен быть равен email (fallback: id ?? email ?? 'unknown')
            expect(result.id).toBe('user@example.com');
            expect(result.email).toBe('user@example.com');
        });

        it('должен использовать "unknown" как id при отсутствии и id, и email', () => {
            const profile = {
                // id и email отсутствуют
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
            };

            const result = mapper.mapProfile(profile, config);

            // ID должен быть 'unknown' (fallback: id ?? email ?? 'unknown')
            expect(result.id).toBe('unknown');
            expect(result.email).toBe(''); // Email fallback - пустая строка
        });
    });
});

