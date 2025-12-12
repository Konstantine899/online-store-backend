/**
 * SSO User Profile Types
 *
 * Типы для представления профилей пользователей из различных SSO провайдеров
 * (OAuth 2.0, SAML, OpenID Connect)
 */

/**
 * Базовый профиль пользователя из SSO провайдера
 */
export interface ISSOUserProfile {
    /** Уникальный идентификатор пользователя в провайдере */
    id: string;
    /** Email пользователя */
    email: string;
    /** Имя пользователя */
    firstName?: string;
    /** Фамилия пользователя */
    lastName?: string;
    /** Отображаемое имя */
    displayName?: string;
    /** Телефон */
    phone?: string;
    /** Роли пользователя в провайдере */
    roles?: string[];
    /** Дополнительные атрибуты из провайдера */
    attributes?: Record<string, unknown>;
    /** Тип провайдера */
    providerType: 'OAUTH2' | 'SAML' | 'OIDC';
    /** Имя провайдера (Azure AD, Google Workspace и т.д.) */
    providerName?: string;
}

/**
 * OAuth 2.0 профиль пользователя
 */
export interface IOAuth2UserProfile extends ISSOUserProfile {
    providerType: 'OAUTH2';
    /** Access token (для получения дополнительных данных) */
    accessToken?: string;
    /** Refresh token (если доступен) */
    refreshToken?: string;
}

/**
 * SAML профиль пользователя
 */
export interface ISAMLUserProfile extends ISSOUserProfile {
    providerType: 'SAML';
    /** NameID из SAML assertion */
    nameID?: string;
    /** NameID Format */
    nameIDFormat?: string;
    /** Session index для logout */
    sessionIndex?: string;
}

/**
 * OpenID Connect профиль пользователя
 */
export interface IOIDCUserProfile extends ISSOUserProfile {
    providerType: 'OIDC';
    /** Subject (sub claim) */
    sub?: string;
    /** ID Token (JWT) */
    idToken?: string;
    /** Access token */
    accessToken?: string;
    /** Refresh token (если доступен) */
    refreshToken?: string;
}

/**
 * Маппинг полей профиля SSO на поля локального пользователя
 */
export interface ISSOProfileMapping {
    /** Маппинг email */
    email?: string | string[];
    /** Маппинг firstName */
    firstName?: string | string[];
    /** Маппинг lastName */
    lastName?: string | string[];
    /** Маппинг phone */
    phone?: string | string[];
    /** Маппинг displayName */
    displayName?: string | string[];
    /** Маппинг ролей */
    roles?: string | string[];
}

