import { ExternalRoleProviderType } from '@app/domain/models';
import { IExternalRoleProvider } from '@app/domain/services/role/i-external-role-provider';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ADProvider } from './ldap/ad-provider';
import { LDAPProvider } from './ldap/ldap-provider';

/**
 * ExternalRoleProviderFactory
 *
 * Фабрика для получения провайдеров внешних систем управления ролями
 * по типу провайдера.
 *
 * Поддерживает:
 * - LDAP/AD провайдеры (реализуют IExternalRoleProvider для batch синхронизации)
 * - SSO провайдеры (OAuth2, SAML, OIDC) - синхронизация через SSORoleSyncService
 *
 * Примечание: SSO провайдеры не реализуют IExternalRoleProvider,
 * так как они работают через SSO flow (just-in-time provisioning),
 * а не через batch синхронизацию пользователей.
 */
@Injectable()
export class ExternalRoleProviderFactory {
    private readonly logger = new Logger(ExternalRoleProviderFactory.name);

    constructor(
        private readonly ldapProvider: LDAPProvider,
        private readonly adProvider: ADProvider,
    ) {}

    /**
     * Получить провайдер по типу
     * @param providerType - Тип провайдера
     * @returns Провайдер, реализующий IExternalRoleProvider, или null для SSO провайдеров
     * @throws BadRequestException если тип провайдера не поддерживается
     */
    public getProvider(
        providerType: ExternalRoleProviderType,
    ): IExternalRoleProvider | null {
        switch (providerType) {
            case 'LDAP':
                this.logger.debug('Получен LDAP провайдер');
                return this.ldapProvider;

            case 'AD':
                this.logger.debug('Получен AD провайдер');
                return this.adProvider;

            case 'AZURE_AD':
            case 'GOOGLE_WORKSPACE':
            case 'OKTA':
            case 'SAML':
            case 'OIDC':
            case 'GENERIC_OAUTH2':
                // SSO провайдеры не поддерживают batch синхронизацию через IExternalRoleProvider
                // Они работают через SSORoleSyncService (just-in-time provisioning)
                this.logger.debug(
                    {
                        providerType,
                    },
                    'SSO провайдер - синхронизация через SSORoleSyncService',
                );
                return null;

            default:
                this.logger.error(
                    {
                        providerType,
                    },
                    'Неподдерживаемый тип провайдера',
                );
                throw new BadRequestException(
                    `Неподдерживаемый тип провайдера: ${providerType}`,
                );
        }
    }

    /**
     * Проверить, поддерживает ли провайдер batch синхронизацию
     * @param providerType - Тип провайдера
     * @returns true если провайдер поддерживает batch синхронизацию
     */
    public supportsBatchSync(providerType: ExternalRoleProviderType): boolean {
        return providerType === 'LDAP' || providerType === 'AD';
    }

    /**
     * Проверить, является ли провайдер SSO провайдером
     * @param providerType - Тип провайдера
     * @returns true если провайдер является SSO провайдером
     */
    public isSSOProvider(providerType: ExternalRoleProviderType): boolean {
        return [
            'AZURE_AD',
            'GOOGLE_WORKSPACE',
            'OKTA',
            'SAML',
            'OIDC',
            'GENERIC_OAUTH2',
        ].includes(providerType);
    }
}
