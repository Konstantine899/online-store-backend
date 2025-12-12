import type { ExternalRoleProviderType } from '@app/domain/models';
import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ExternalRoleProviderFactory } from '../external-role-provider.factory';
import { ADProvider } from '../ldap/ad-provider';
import { LDAPProvider } from '../ldap/ldap-provider';

describe('ExternalRoleProviderFactory', () => {
    let factory: ExternalRoleProviderFactory;
    let ldapProvider: jest.Mocked<LDAPProvider>;
    let adProvider: jest.Mocked<ADProvider>;

    beforeEach(async () => {
        // Создаем моки провайдеров
        ldapProvider = {
            getProviderType: jest.fn().mockReturnValue('LDAP'),
        } as unknown as jest.Mocked<LDAPProvider>;

        adProvider = {
            getProviderType: jest.fn().mockReturnValue('AD'),
        } as unknown as jest.Mocked<ADProvider>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExternalRoleProviderFactory,
                {
                    provide: LDAPProvider,
                    useValue: ldapProvider,
                },
                {
                    provide: ADProvider,
                    useValue: adProvider,
                },
            ],
        }).compile();

        factory = module.get<ExternalRoleProviderFactory>(
            ExternalRoleProviderFactory,
        );
    });

    describe('getProvider', () => {
        it('должен вернуть LDAP провайдер для типа LDAP', () => {
            const provider = factory.getProvider('LDAP');

            expect(provider).toBe(ldapProvider);
            expect(ldapProvider.getProviderType).toHaveBeenCalledTimes(0); // Не вызывается в getProvider
        });

        it('должен вернуть AD провайдер для типа AD', () => {
            const provider = factory.getProvider('AD');

            expect(provider).toBe(adProvider);
        });

        it('должен вернуть null для SSO провайдеров (AZURE_AD)', () => {
            const provider = factory.getProvider('AZURE_AD');

            expect(provider).toBeNull();
        });

        it('должен вернуть null для SSO провайдеров (GOOGLE_WORKSPACE)', () => {
            const provider = factory.getProvider('GOOGLE_WORKSPACE');

            expect(provider).toBeNull();
        });

        it('должен вернуть null для SSO провайдеров (SAML)', () => {
            const provider = factory.getProvider('SAML');

            expect(provider).toBeNull();
        });

        it('должен вернуть null для SSO провайдеров (OIDC)', () => {
            const provider = factory.getProvider('OIDC');

            expect(provider).toBeNull();
        });

        it('должен вернуть null для SSO провайдеров (GENERIC_OAUTH2)', () => {
            const provider = factory.getProvider('GENERIC_OAUTH2');

            expect(provider).toBeNull();
        });

        it('должен вернуть null для SSO провайдеров (OKTA)', () => {
            const provider = factory.getProvider('OKTA');

            expect(provider).toBeNull();
        });

        it('должен выбросить BadRequestException для неподдерживаемого типа', () => {
            expect(() => {
                factory.getProvider('UNKNOWN' as ExternalRoleProviderType);
            }).toThrow(BadRequestException);
        });
    });

    describe('supportsBatchSync', () => {
        it('должен вернуть true для LDAP', () => {
            expect(factory.supportsBatchSync('LDAP')).toBe(true);
        });

        it('должен вернуть true для AD', () => {
            expect(factory.supportsBatchSync('AD')).toBe(true);
        });

        it('должен вернуть false для SSO провайдеров', () => {
            expect(factory.supportsBatchSync('AZURE_AD')).toBe(false);
            expect(factory.supportsBatchSync('GOOGLE_WORKSPACE')).toBe(false);
            expect(factory.supportsBatchSync('SAML')).toBe(false);
            expect(factory.supportsBatchSync('OIDC')).toBe(false);
            expect(factory.supportsBatchSync('GENERIC_OAUTH2')).toBe(false);
            expect(factory.supportsBatchSync('OKTA')).toBe(false);
        });
    });

    describe('isSSOProvider', () => {
        it('должен вернуть false для LDAP', () => {
            expect(factory.isSSOProvider('LDAP')).toBe(false);
        });

        it('должен вернуть false для AD', () => {
            expect(factory.isSSOProvider('AD')).toBe(false);
        });

        it('должен вернуть true для всех SSO провайдеров', () => {
            expect(factory.isSSOProvider('AZURE_AD')).toBe(true);
            expect(factory.isSSOProvider('GOOGLE_WORKSPACE')).toBe(true);
            expect(factory.isSSOProvider('OKTA')).toBe(true);
            expect(factory.isSSOProvider('SAML')).toBe(true);
            expect(factory.isSSOProvider('OIDC')).toBe(true);
            expect(factory.isSSOProvider('GENERIC_OAUTH2')).toBe(true);
        });
    });
});
