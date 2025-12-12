import {
    IOAuth2UserProfile,
    IOIDCUserProfile,
    ISAMLUserProfile,
    ISSOProfileMapping,
    ISSOUserProfile,
} from '@app/domain/types/sso/sso-user-profile.types';
import { Injectable } from '@nestjs/common';
import { createLogger } from '@app/infrastructure/common/utils/logging';
import { IProviderConfig } from '@app/domain/models/external-role-config.model';

/**
 * SSOUserProfileMapper - Маппинг профилей из SSO провайдеров в локальные пользователи
 *
 * Поддерживает различные форматы профилей от разных провайдеров:
 * - OAuth 2.0 (Azure AD, Google Workspace, Generic)
 * - SAML 2.0
 * - OpenID Connect
 *
 * Маппинг полей настраивается через IProviderConfig.profileMapping
 */
@Injectable()
export class SSOUserProfileMapper {
    private readonly logger = createLogger('SSOUserProfileMapper');

    /**
     * Маппинг профиля из SSO провайдера в стандартный формат
     * @param profile - профиль от провайдера (может быть в разных форматах)
     * @param providerConfig - конфигурация провайдера
     * @returns Стандартизированный профиль пользователя
     */
    public mapProfile(
        profile: unknown,
        providerConfig: IProviderConfig,
    ): ISSOUserProfile {
        // Определяем тип провайдера по конфигурации
        const providerType = this.detectProviderType(providerConfig);

        switch (providerType) {
            case 'OAUTH2':
                return this.mapOAuth2Profile(
                    profile as IOAuth2UserProfile,
                    providerConfig,
                );
            case 'SAML':
                return this.mapSAMLProfile(
                    profile as ISAMLUserProfile,
                    providerConfig,
                );
            case 'OIDC':
                return this.mapOIDCProfile(
                    profile as IOIDCUserProfile,
                    providerConfig,
                );
            default:
                this.logger.warn(
                    { providerType },
                    'Unknown provider type, using generic mapping',
                );
                return this.mapGenericProfile(profile, providerConfig);
        }
    }

    /**
     * Маппинг OAuth 2.0 профиля
     */
    private mapOAuth2Profile(
        profile: IOAuth2UserProfile | Record<string, unknown>,
        config: IProviderConfig,
    ): IOAuth2UserProfile {
        const mapping = (config.profileMapping as ISSOProfileMapping) ?? {};

        // Извлечение email (приоритет: mapping > стандартные поля)
        const email = this.extractField(profile, mapping.email, [
            'email',
            'mail',
            'userPrincipalName',
            'upn',
        ]);

        // Извлечение имени
        const firstName = this.extractField(profile, mapping.firstName, [
            'firstName',
            'first_name',
            'given_name',
            'givenName',
        ]);

        // Извлечение фамилии
        const lastName = this.extractField(profile, mapping.lastName, [
            'lastName',
            'last_name',
            'family_name',
            'familyName',
            'surname',
        ]);

        // Извлечение отображаемого имени
        const displayName = this.extractField(profile, mapping.displayName, [
            'displayName',
            'display_name',
            'name',
            'fullName',
            'full_name',
        ]);

        // Извлечение телефона
        const phone = this.extractField(profile, mapping.phone, [
            'phone',
            'phoneNumber',
            'phone_number',
            'mobile',
        ]);

        // Извлечение ролей
        const roles = this.extractRoles(profile, mapping.roles, [
            'roles',
            'groups',
            'memberOf',
            'groups',
        ]);

        // Извлечение ID
        const id = this.extractId(profile, [
            'id',
            'sub',
            'userId',
            'user_id',
            'oid', // Azure AD
        ]);

        return {
            id: id ?? email ?? 'unknown',
            email: email ?? '',
            firstName: firstName ?? undefined,
            lastName: lastName ?? undefined,
            displayName: displayName ?? undefined,
            phone: phone ?? undefined,
            roles: roles.length > 0 ? roles : undefined,
            attributes: profile as Record<string, unknown>,
            providerType: 'OAUTH2',
            providerName: (config as Record<string, unknown>).providerName as
                | string
                | undefined,
        };
    }

    /**
     * Маппинг SAML профиля
     */
    private mapSAMLProfile(
        profile: ISAMLUserProfile | Record<string, unknown>,
        config: IProviderConfig,
    ): ISAMLUserProfile {
        const mapping = (config.profileMapping as ISSOProfileMapping) ?? {};

        // SAML использует claims в формате http://schemas.xmlsoap.org/ws/2005/05/identity/claims/email
        const email = this.extractField(profile, mapping.email, [
            'email',
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/email',
            'mail',
        ]);

        const firstName = this.extractField(profile, mapping.firstName, [
            'firstName',
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
            'givenName',
        ]);

        const lastName = this.extractField(profile, mapping.lastName, [
            'lastName',
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
            'surname',
        ]);

        const displayName = this.extractField(profile, mapping.displayName, [
            'displayName',
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
            'name',
        ]);

        const nameID =
            (profile as ISAMLUserProfile).nameID ?? profile['nameID'];
        const nameIDFormat =
            (profile as ISAMLUserProfile).nameIDFormat ??
            profile['nameIDFormat'];
        const sessionIndex =
            (profile as ISAMLUserProfile).sessionIndex ??
            profile['sessionIndex'];

        const roles = this.extractRoles(profile, mapping.roles, [
            'roles',
            'groups',
            'http://schemas.xmlsoap.org/claims/Group',
            'memberOf',
        ]);

        return {
            id: nameID ?? email ?? 'unknown',
            email: email ?? '',
            firstName: firstName ?? undefined,
            lastName: lastName ?? undefined,
            displayName: displayName ?? undefined,
            roles: roles.length > 0 ? roles : undefined,
            attributes: profile as Record<string, unknown>,
            providerType: 'SAML',
            providerName: (config as Record<string, unknown>).providerName as
                | string
                | undefined,
            nameID: nameID as string | undefined,
            nameIDFormat: nameIDFormat as string | undefined,
            sessionIndex: sessionIndex as string | undefined,
        };
    }

    /**
     * Маппинг OpenID Connect профиля
     */
    private mapOIDCProfile(
        profile: IOIDCUserProfile | Record<string, unknown>,
        config: IProviderConfig,
    ): IOIDCUserProfile {
        const mapping = (config.profileMapping as ISSOProfileMapping) ?? {};

        // OIDC использует стандартные claims (sub, email, given_name, family_name)
        const sub = (profile as IOIDCUserProfile).sub ?? profile['sub'];
        const email = this.extractField(profile, mapping.email, [
            'email',
            'email_verified',
        ]);

        const firstName = this.extractField(profile, mapping.firstName, [
            'given_name',
            'givenName',
            'firstName',
        ]);

        const lastName = this.extractField(profile, mapping.lastName, [
            'family_name',
            'familyName',
            'lastName',
        ]);

        const displayName = this.extractField(profile, mapping.displayName, [
            'name',
            'displayName',
            'preferred_username',
        ]);

        const roles = this.extractRoles(profile, mapping.roles, [
            'roles',
            'groups',
            'groups',
        ]);

        return {
            id: sub ?? email ?? 'unknown',
            email: email ?? '',
            firstName: firstName ?? undefined,
            lastName: lastName ?? undefined,
            displayName: displayName ?? undefined,
            roles: roles.length > 0 ? roles : undefined,
            attributes: profile as Record<string, unknown>,
            providerType: 'OIDC',
            providerName: (config as Record<string, unknown>).providerName as
                | string
                | undefined,
            sub: sub as string | undefined,
            idToken: (profile as IOIDCUserProfile).idToken,
            accessToken: (profile as IOIDCUserProfile).accessToken,
            refreshToken: (profile as IOIDCUserProfile).refreshToken,
        };
    }

    /**
     * Маппинг generic профиля (fallback)
     */
    private mapGenericProfile(
        profile: unknown,
        config: IProviderConfig,
    ): ISSOUserProfile {
        const profileObj = profile as Record<string, unknown>;
        const mapping = (config.profileMapping as ISSOProfileMapping) ?? {};

        return {
            id:
                this.extractId(profileObj, ['id', 'sub', 'userId']) ??
                'unknown',
            email:
                this.extractField(profileObj, mapping.email, ['email']) ?? '',
            firstName: this.extractField(profileObj, mapping.firstName, [
                'firstName',
                'first_name',
            ]),
            lastName: this.extractField(profileObj, mapping.lastName, [
                'lastName',
                'last_name',
            ]),
            displayName: this.extractField(profileObj, mapping.displayName, [
                'displayName',
                'name',
            ]),
            roles: this.extractRoles(profileObj, mapping.roles, ['roles']),
            attributes: profileObj,
            providerType: 'OAUTH2', // По умолчанию
            providerName: (config as Record<string, unknown>).providerName as
                | string
                | undefined,
        };
    }

    /**
     * Извлечение поля из профиля с учетом маппинга
     */
    private extractField(
        profile: Record<string, unknown>,
        mapping: string | string[] | undefined,
        defaultFields: string[],
    ): string | undefined {
        // Если есть маппинг, используем его
        if (mapping) {
            const fields = Array.isArray(mapping) ? mapping : [mapping];
            for (const field of fields) {
                const value = this.getNestedValue(profile, field);
                if (value && typeof value === 'string') {
                    return value;
                }
            }
        }

        // Иначе используем стандартные поля
        for (const field of defaultFields) {
            const value = this.getNestedValue(profile, field);
            if (value && typeof value === 'string') {
                return value;
            }
        }

        return undefined;
    }

    /**
     * Извлечение ролей из профиля
     */
    private extractRoles(
        profile: Record<string, unknown>,
        mapping: string | string[] | undefined,
        defaultFields: string[],
    ): string[] {
        let roles: unknown = undefined;

        // Если есть маппинг, используем его
        if (mapping) {
            const fields = Array.isArray(mapping) ? mapping : [mapping];
            for (const field of fields) {
                roles = this.getNestedValue(profile, field);
                if (roles) break;
            }
        }

        // Иначе используем стандартные поля
        if (!roles) {
            for (const field of defaultFields) {
                roles = this.getNestedValue(profile, field);
                if (roles) break;
            }
        }

        // Преобразуем в массив строк
        if (Array.isArray(roles)) {
            return roles.filter((r): r is string => typeof r === 'string');
        }
        if (typeof roles === 'string') {
            return [roles];
        }

        return [];
    }

    /**
     * Извлечение ID из профиля
     */
    private extractId(
        profile: Record<string, unknown>,
        fields: string[],
    ): string | undefined {
        for (const field of fields) {
            const value = this.getNestedValue(profile, field);
            if (value) {
                return String(value);
            }
        }
        return undefined;
    }

    /**
     * Получение вложенного значения по пути (например, "user.profile.email")
     */
    private getNestedValue(
        obj: Record<string, unknown>,
        path: string,
    ): unknown {
        const parts = path.split('.');
        let current: unknown = obj;

        for (const part of parts) {
            if (
                current &&
                typeof current === 'object' &&
                part in (current as Record<string, unknown>)
            ) {
                current = (current as Record<string, unknown>)[part];
            } else {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Определение типа провайдера по конфигурации
     */
    private detectProviderType(
        config: IProviderConfig,
    ): 'OAUTH2' | 'SAML' | 'OIDC' {
        // SAML определяется по наличию entryPoint
        if (config.entryPoint) {
            return 'SAML';
        }

        // OIDC определяется по наличию issuer
        if (config.issuer) {
            return 'OIDC';
        }

        // По умолчанию OAuth 2.0
        return 'OAUTH2';
    }
}

