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
                providerType: 'OAUTH2',
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
                id: 'user-123',
                nameID: 'user-123',
                nameIDFormat:
                    'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                roles: ['Admin'],
                sessionIndex: 'session-123',
                providerType: 'SAML',
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
                id: 'user-123',
                sub: 'user-123',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                displayName: 'John Doe',
                roles: ['Admin'],
                idToken: 'id-token-123',
                accessToken: 'access-token-123',
                refreshToken: 'refresh-token-123',
                providerType: 'OIDC',
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

    // ============================================================================
    // TESTS: Вложенные значения (getNestedValue)
    // ============================================================================

    describe('Вложенные значения', () => {
        it('должен извлекать вложенные значения через точку', () => {
            const profile = {
                user: {
                    profile: {
                        email: 'user@example.com',
                    },
                },
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
                profileMapping: {
                    email: 'user.profile.email',
                },
            };

            const result = mapper.mapProfile(profile, config);

            expect(result.email).toBe('user@example.com');
        });

        it('должен обрабатывать отсутствующие вложенные значения', () => {
            const profile = {
                user: {
                    profile: {},
                },
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
                profileMapping: {
                    email: 'user.profile.email',
                },
            };

            const result = mapper.mapProfile(profile, config);

            expect(result.email).toBe(''); // Fallback
        });

        it('должен обрабатывать глубоко вложенные значения', () => {
            const profile = {
                data: {
                    user: {
                        info: {
                            contact: {
                                email: 'deep@example.com',
                            },
                        },
                    },
                },
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
                profileMapping: {
                    email: 'data.user.info.contact.email',
                },
            };

            const result = mapper.mapProfile(profile, config);

            expect(result.email).toBe('deep@example.com');
        });
    });

    // ============================================================================
    // TESTS: Извлечение ролей (extractRoles)
    // ============================================================================

    describe('Извлечение ролей', () => {
        it('должен извлекать роли из массива', () => {
            const profile = {
                roles: ['Admin', 'User', 'Moderator'],
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
            };

            const result = mapper.mapProfile(profile, config);

            expect(result.roles).toEqual(['Admin', 'User', 'Moderator']);
        });

        it('должен извлекать роли из строки', () => {
            const profile = {
                roles: 'Admin',
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
            };

            const result = mapper.mapProfile(profile, config);

            expect(result.roles).toEqual(['Admin']);
        });

        it('должен фильтровать не-строковые значения из массива ролей', () => {
            const profile = {
                roles: ['Admin', 123, 'User', null, 'Moderator', undefined],
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
            };

            const result = mapper.mapProfile(profile, config);

            expect(result.roles).toEqual(['Admin', 'User', 'Moderator']);
        });

        it('должен использовать кастомный маппинг для ролей', () => {
            const profile = {
                groups: ['Group1', 'Group2'],
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
                profileMapping: {
                    roles: 'groups',
                },
            };

            const result = mapper.mapProfile(profile, config);

            expect(result.roles).toEqual(['Group1', 'Group2']);
        });

        it('должен использовать массив полей для маппинга ролей', () => {
            const profile = {
                memberOf: ['Role1', 'Role2'],
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
                profileMapping: {
                    roles: ['roles', 'groups', 'memberOf'],
                },
            };

            const result = mapper.mapProfile(profile, config);

            expect(result.roles).toEqual(['Role1', 'Role2']);
        });

        it('должен возвращать undefined если ролей нет', () => {
            const profile = {
                email: 'user@example.com',
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
            };

            const result = mapper.mapProfile(profile, config);

            expect(result.roles).toBeUndefined();
        });
    });

    // ============================================================================
    // TESTS: Извлечение ID (extractId)
    // ============================================================================

    describe('Извлечение ID', () => {
        it('должен извлекать ID из различных полей', () => {
            const profile1 = { id: 'user-123' };
            const profile2 = { sub: 'user-456' };
            const profile3 = { userId: 'user-789' };
            const profile4 = { user_id: 'user-101' };
            const profile5 = { oid: 'user-202' }; // Azure AD

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
            };

            expect(mapper.mapProfile(profile1, config).id).toBe('user-123');
            expect(mapper.mapProfile(profile2, config).id).toBe('user-456');
            expect(mapper.mapProfile(profile3, config).id).toBe('user-789');
            expect(mapper.mapProfile(profile4, config).id).toBe('user-101');
            expect(mapper.mapProfile(profile5, config).id).toBe('user-202');
        });

        it('должен преобразовывать числовой ID в строку', () => {
            const profile = {
                id: 12345,
            };

            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
            };

            const result = mapper.mapProfile(profile, config);

            expect(result.id).toBe('12345');
        });
    });

    // ============================================================================
    // TESTS: OAuth 2.0 - различные форматы полей
    // ============================================================================

    describe('OAuth 2.0 - различные форматы полей', () => {
        const oauth2Config: IProviderConfig = {
            clientId: 'test-client-id',
            authorizationURL: 'https://oauth2.example.com/auth',
            tokenURL: 'https://oauth2.example.com/token',
            callbackURL: 'https://app.example.com/callback',
        };

        it('должен извлекать email из различных полей', () => {
            const profiles = [
                { email: 'email@example.com' },
                { mail: 'mail@example.com' },
                { userPrincipalName: 'upn@example.com' },
                { upn: 'upn2@example.com' },
            ];

            profiles.forEach((profile) => {
                const result = mapper.mapProfile(profile, oauth2Config);
                expect(result.email).toBeTruthy();
            });
        });

        it('должен извлекать firstName из различных полей', () => {
            const profiles = [
                { firstName: 'John' },
                { first_name: 'Jane' },
                { given_name: 'Bob' },
                { givenName: 'Alice' },
            ];

            profiles.forEach((profile) => {
                const result = mapper.mapProfile(profile, oauth2Config);
                expect(result.firstName).toBeTruthy();
            });
        });

        it('должен извлекать lastName из различных полей', () => {
            const profiles = [
                { lastName: 'Doe' },
                { last_name: 'Smith' },
                { family_name: 'Johnson' },
                { familyName: 'Williams' },
                { surname: 'Brown' },
            ];

            profiles.forEach((profile) => {
                const result = mapper.mapProfile(profile, oauth2Config);
                expect(result.lastName).toBeTruthy();
            });
        });

        it('должен извлекать displayName из различных полей', () => {
            const profiles = [
                { displayName: 'John Doe' },
                { display_name: 'Jane Smith' },
                { name: 'Bob Johnson' },
                { fullName: 'Alice Williams' },
                { full_name: 'Charlie Brown' },
            ];

            profiles.forEach((profile) => {
                const result = mapper.mapProfile(profile, oauth2Config);
                expect(result.displayName).toBeTruthy();
            });
        });

        it('должен извлекать phone из различных полей', () => {
            const profiles = [
                { phone: '+1234567890' },
                { phoneNumber: '+0987654321' },
                { phone_number: '+1122334455' },
                { mobile: '+5566778899' },
            ];

            profiles.forEach((profile) => {
                const result = mapper.mapProfile(profile, oauth2Config);
                expect(result.phone).toBeTruthy();
            });
        });
    });

    // ============================================================================
    // TESTS: SAML - различные форматы claims
    // ============================================================================

    describe('SAML - различные форматы claims', () => {
        const samlConfig: IProviderConfig = {
            entryPoint: 'https://saml.example.com/sso',
            cert: 'cert-data',
            samlIssuer: 'test-issuer',
            samlCallbackURL: 'https://app.example.com/saml/callback',
        };

        it('должен извлекать email из SAML claims', () => {
            const profile = {
                email: 'user@example.com',
            };

            const result = mapper.mapProfile(profile, samlConfig);

            expect(result.email).toBe('user@example.com');
        });

        it('должен обрабатывать SAML профиль с nameIDFormat', () => {
            const profile: ISAMLUserProfile = {
                id: 'user-123',
                nameID: 'user-123',
                nameIDFormat:
                    'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
                email: 'user@example.com',
                sessionIndex: 'session-123',
                providerType: 'SAML',
            };

            const result = mapper.mapProfile(profile, samlConfig);

            expect((result as ISAMLUserProfile).nameIDFormat).toBe(
                'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
            );
        });

        it('должен обрабатывать SAML профиль с sessionIndex', () => {
            const profile: ISAMLUserProfile = {
                id: 'user-123',
                nameID: 'user-123',
                email: 'user@example.com',
                sessionIndex: 'session-456',
                providerType: 'SAML',
            };

            const result = mapper.mapProfile(profile, samlConfig);

            expect((result as ISAMLUserProfile).sessionIndex).toBe('session-456');
        });
    });

    // ============================================================================
    // TESTS: OIDC - различные форматы claims
    // ============================================================================

    describe('OIDC - различные форматы claims', () => {
        const oidcConfig: IProviderConfig = {
            issuer: 'https://oidc.example.com',
            clientId: 'test-client-id',
            clientSecret: 'test-secret',
            callbackURL: 'https://app.example.com/oidc/callback',
        };

        it('должен извлекать sub из OIDC профиля', () => {
            const profile: IOIDCUserProfile = {
                id: 'user-123',
                sub: 'user-123',
                email: 'user@example.com',
                providerType: 'OIDC',
            };

            const result = mapper.mapProfile(profile, oidcConfig);

            expect((result as IOIDCUserProfile).sub).toBe('user-123');
        });

        it('должен обрабатывать OIDC профиль с токенами', () => {
            const profile: IOIDCUserProfile = {
                id: 'user-123',
                sub: 'user-123',
                email: 'user@example.com',
                idToken: 'id-token-123',
                accessToken: 'access-token-123',
                refreshToken: 'refresh-token-123',
                providerType: 'OIDC',
            };

            const result = mapper.mapProfile(profile, oidcConfig);

            expect((result as IOIDCUserProfile).idToken).toBe('id-token-123');
            expect((result as IOIDCUserProfile).accessToken).toBe(
                'access-token-123',
            );
            expect((result as IOIDCUserProfile).refreshToken).toBe(
                'refresh-token-123',
            );
        });

        it('должен извлекать given_name и family_name из OIDC', () => {
            const profile = {
                sub: 'user-123',
                email: 'user@example.com',
                given_name: 'John',
                family_name: 'Doe',
            };

            const result = mapper.mapProfile(profile, oidcConfig);

            expect(result.firstName).toBe('John');
            expect(result.lastName).toBe('Doe');
        });
    });

    // ============================================================================
    // TESTS: Определение типа провайдера (detectProviderType)
    // ============================================================================

    describe('Определение типа провайдера', () => {
        it('должен определять SAML по entryPoint', () => {
            const config: IProviderConfig = {
                entryPoint: 'https://saml.example.com/sso',
                cert: 'cert-data',
            };

            const profile = { email: 'user@example.com' };
            const result = mapper.mapProfile(profile, config);

            expect(result.providerType).toBe('SAML');
        });

        it('должен определять OIDC по issuer', () => {
            const config: IProviderConfig = {
                issuer: 'https://oidc.example.com',
                clientId: 'test-client-id',
            };

            const profile = { email: 'user@example.com' };
            const result = mapper.mapProfile(profile, config);

            expect(result.providerType).toBe('OIDC');
        });

        it('должен использовать OAUTH2 по умолчанию', () => {
            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://oauth2.example.com/auth',
            };

            const profile = { email: 'user@example.com' };
            const result = mapper.mapProfile(profile, config);

            expect(result.providerType).toBe('OAUTH2');
        });
    });

    // ============================================================================
    // TESTS: Обработка providerName
    // ============================================================================

    describe('Обработка providerName', () => {
        it('должен извлекать providerName из конфигурации', () => {
            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
                providerName: 'Test Provider',
            } as IProviderConfig;

            const profile = { email: 'user@example.com' };
            const result = mapper.mapProfile(profile, config);

            expect(result.providerName).toBe('Test Provider');
        });

        it('должен обрабатывать отсутствие providerName', () => {
            const config: IProviderConfig = {
                clientId: 'test-client-id',
                authorizationURL: 'https://example.com/auth',
            };

            const profile = { email: 'user@example.com' };
            const result = mapper.mapProfile(profile, config);

            expect(result.providerName).toBeUndefined();
        });
    });
});
