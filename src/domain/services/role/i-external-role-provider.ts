import type {
    ExternalRoleProviderType,
    IProviderConfig,
} from '@app/domain/models';

/**
 * Информация о пользователе из внешней системы
 */
export interface IExternalUser {
    externalId: string; // Уникальный ID во внешней системе
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phone?: string;
    externalRoles: string[]; // Список ролей/групп во внешней системе
    attributes?: Record<string, unknown>; // Дополнительные атрибуты
}

/**
 * Результат подключения к провайдеру
 */
export interface IProviderConnectionResult {
    success: boolean;
    error?: string;
    providerInfo?: {
        name: string;
        version?: string;
        capabilities?: string[];
    };
}

/**
 * Результат поиска пользователей
 */
export interface ISearchUsersResult {
    users: IExternalUser[];
    totalCount: number;
    hasMore: boolean;
    nextCursor?: string; // Для пагинации
}

/**
 * Интерфейс провайдера внешних систем управления ролями
 *
 * Каждый провайдер (LDAP, Azure AD, Google Workspace, SAML, etc.)
 * должен реализовать этот интерфейс для унифицированной работы
 * с внешними системами.
 */
export interface IExternalRoleProvider {
    /**
     * Получить тип провайдера
     */
    getProviderType(): ExternalRoleProviderType;

    /**
     * Проверить подключение к внешней системе
     * @param config - Конфигурация провайдера
     * @returns Результат проверки подключения
     */
    testConnection(config: IProviderConfig): Promise<IProviderConnectionResult>;

    /**
     * Поиск пользователей во внешней системе
     * @param config - Конфигурация провайдера
     * @param options - Опции поиска (фильтры, пагинация)
     * @returns Результат поиска с пользователями
     */
    searchUsers(
        config: IProviderConfig,
        options?: {
            filter?: string;
            limit?: number;
            offset?: number;
            cursor?: string;
            modifiedSince?: Date; // Для инкрементальной синхронизации
        },
    ): Promise<ISearchUsersResult>;

    /**
     * Получить информацию о конкретном пользователе по ID
     * @param config - Конфигурация провайдера
     * @param externalUserId - ID пользователя во внешней системе
     * @returns Информация о пользователе или null если не найден
     */
    getUserById(
        config: IProviderConfig,
        externalUserId: string,
    ): Promise<IExternalUser | null>;

    /**
     * Получить информацию о пользователе по email
     * @param config - Конфигурация провайдера
     * @param email - Email пользователя
     * @returns Информация о пользователе или null если не найден
     */
    getUserByEmail(
        config: IProviderConfig,
        email: string,
    ): Promise<IExternalUser | null>;

    /**
     * Получить список ролей/групп пользователя
     * @param config - Конфигурация провайдера
     * @param externalUserId - ID пользователя во внешней системе
     * @returns Список названий ролей/групп
     */
    getUserRoles(
        config: IProviderConfig,
        externalUserId: string,
    ): Promise<string[]>;

    /**
     * Валидация конфигурации провайдера
     * @param config - Конфигурация для валидации
     * @returns true если конфигурация валидна, false иначе
     */
    validateConfig(config: IProviderConfig): Promise<{
        valid: boolean;
        errors: string[];
    }>;
}

