import type {
    ExternalRoleConfigModel,
    ExternalRoleConfigStatus,
    ExternalRoleProviderType,
    ExternalUserSyncLogModel,
    IExternalRoleConfigCreationAttributes,
    SyncStatus,
    SyncType,
} from '@app/domain/models';

/**
 * Опции поиска конфигураций
 */
export interface IFindConfigsOptions {
    tenantId?: number | null;
    providerType?: ExternalRoleProviderType;
    status?: ExternalRoleConfigStatus;
    syncEnabled?: boolean;
}

/**
 * Опции поиска логов синхронизации
 */
export interface IFindSyncLogsOptions {
    configId?: number;
    tenantId?: number;
    status?: SyncStatus;
    syncType?: SyncType;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
}

/**
 * Интерфейс репозитория для работы с конфигурациями внешних систем
 * и логами синхронизации
 */
export interface IExternalRoleSyncRepository {
    /**
     * Создать новую конфигурацию
     * @param data - Данные конфигурации
     * @returns Созданная конфигурация
     */
    createConfig(
        data: IExternalRoleConfigCreationAttributes,
    ): Promise<ExternalRoleConfigModel>;

    /**
     * Найти конфигурацию по ID
     * @param id - ID конфигурации
     * @param tenantId - ID тенанта (для tenant isolation)
     * @returns Конфигурация или null
     */
    findConfigById(
        id: number,
        tenantId?: number | null,
    ): Promise<ExternalRoleConfigModel | null>;

    /**
     * Найти все конфигурации по опциям
     * @param options - Опции поиска
     * @returns Массив конфигураций
     */
    findConfigs(
        options?: IFindConfigsOptions,
    ): Promise<ExternalRoleConfigModel[]>;

    /**
     * Обновить конфигурацию
     * @param id - ID конфигурации
     * @param data - Данные для обновления
     * @param tenantId - ID тенанта (для tenant isolation)
     * @returns Обновленная конфигурация или null
     */
    updateConfig(
        id: number,
        data: Partial<IExternalRoleConfigCreationAttributes>,
        tenantId?: number | null,
    ): Promise<ExternalRoleConfigModel | null>;

    /**
     * Удалить конфигурацию
     * @param id - ID конфигурации
     * @param tenantId - ID тенанта (для tenant isolation)
     * @returns Количество удаленных записей
     */
    deleteConfig(id: number, tenantId?: number | null): Promise<number>;

    /**
     * Обновить статус конфигурации
     * @param id - ID конфигурации
     * @param status - Новый статус
     * @param error - Текст ошибки (если есть)
     * @param tenantId - ID тенанта (для tenant isolation)
     */
    updateConfigStatus(
        id: number,
        status: ExternalRoleConfigStatus,
        error?: string | null,
        tenantId?: number | null,
    ): Promise<void>;

    /**
     * Обновить время последней синхронизации
     * @param id - ID конфигурации
     * @param lastSyncAt - Время последней синхронизации
     * @param nextSyncAt - Время следующей синхронизации
     * @param tenantId - ID тенанта (для tenant isolation)
     */
    updateSyncTimes(
        id: number,
        lastSyncAt: Date,
        nextSyncAt: Date | null,
        tenantId?: number | null,
    ): Promise<void>;

    /**
     * Создать лог синхронизации
     * @param data - Данные лога
     * @returns Созданный лог
     */
    createSyncLog(
        data: {
            externalRoleConfigId: number;
            tenantId: number;
            syncType: SyncType;
            triggerType: 'SCHEDULED' | 'MANUAL' | 'SSO_LOGIN' | 'WEBHOOK';
            triggeredBy?: number | null;
            status?: SyncStatus;
            startedAt: Date;
        },
    ): Promise<ExternalUserSyncLogModel>;

    /**
     * Обновить лог синхронизации
     * @param logId - ID лога
     * @param data - Данные для обновления
     * @returns Обновленный лог или null
     */
    updateSyncLog(
        logId: number,
        data: {
            status?: SyncStatus;
            completedAt?: Date;
            durationMs?: number;
            totalUsers?: number;
            createdUsers?: number;
            updatedUsers?: number;
            deletedUsers?: number;
            mappedUsers?: number;
            skippedUsers?: number;
            failedUsers?: number;
            errorMessage?: string | null;
            errorDetails?: Array<{
                userId?: string | number;
                externalUserId?: string;
                error: string;
                timestamp: Date;
            }> | null;
            metadata?: Record<string, unknown> | null;
        },
    ): Promise<ExternalUserSyncLogModel | null>;

    /**
     * Найти логи синхронизации по опциям
     * @param options - Опции поиска
     * @returns Массив логов
     */
    findSyncLogs(
        options?: IFindSyncLogsOptions,
    ): Promise<ExternalUserSyncLogModel[]>;

    /**
     * Найти последний лог синхронизации для конфигурации
     * @param configId - ID конфигурации
     * @param tenantId - ID тенанта (для tenant isolation)
     * @returns Последний лог или null
     */
    findLastSyncLog(
        configId: number,
        tenantId?: number | null,
    ): Promise<ExternalUserSyncLogModel | null>;

    /**
     * Найти все конфигурации, которые нужно синхронизировать
     * (sync_enabled = true и next_sync_at <= now)
     * @returns Массив конфигураций
     */
    findConfigsForSync(): Promise<ExternalRoleConfigModel[]>;
}

