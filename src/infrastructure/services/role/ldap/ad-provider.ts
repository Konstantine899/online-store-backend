import { ExternalRoleProviderType } from '@app/domain/models';
import { Injectable } from '@nestjs/common';
import { LDAPProvider } from './ldap-provider';

/**
 * ADProvider
 *
 * Провайдер для работы с Active Directory.
 * Наследуется от LDAPProvider и переопределяет тип провайдера на 'AD'.
 *
 * Active Directory использует те же LDAP протоколы, но имеет специфичные атрибуты:
 * - objectGUID вместо DN для уникальной идентификации
 * - sAMAccountName для логина
 * - userPrincipalName для email
 * - memberOf для групп
 */
@Injectable()
export class ADProvider extends LDAPProvider {
    /**
     * Получить тип провайдера (AD вместо LDAP)
     */
    public override getProviderType(): ExternalRoleProviderType {
        return 'AD';
    }
}


