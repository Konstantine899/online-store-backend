import type { SyncStatus, SyncType } from '@app/domain/models';

/**
 * Результат синхронизации
 */
export interface ISyncResult {
    success: boolean;
    syncLogId: number;
    status: SyncStatus;
    statistics: {
        totalUsers: number;
        createdUsers: number;
        updatedUsers: number;
        deletedUsers: number;
        mappedUsers: number;
        skippedUsers: number;
        failedUsers: number;
    };
    errors?: Array<{
        userId?: string;
        externalUserId?: string;
        error: string;
        timestamp: Date;
    }>;
    durationMs: number;
}

/**
 * Статус синхронизации
 */
export interface ISyncStatus {
    configId: number;
    isRunning: boolean;
    lastSyncAt: Date | null;
    nextSyncAt: Date | null;
    lastStatus: SyncStatus | null;
    errorCount: number;
    lastError: string | null;
    lastErrorAt: Date | null;
}

/**
 * Интерфейс сервиса синхронизации внешних систем управления ролями
 *
 * Координирует работу провайдеров, управляет синхронизацией пользователей
 * и назначением ролей на основе маппингов.
 */
export interface IExternalRoleSyncService {
    /**
     * Синхронизировать пользователей для конкретной конфигурации
     * @param configId - ID конфигурации внешней системы
     * @param syncType - Тип синхронизации (FULL, INCREMENTAL, ON_DEMAND)
     * @param tenantId - ID тенанта (для проверки доступа)
     * @param triggeredBy - ID пользователя, запустившего синхронизацию
     * @returns Результат синхронизации
     */
    syncTenant(
        configId: number,
        syncType: SyncType,
        tenantId: number,
        triggeredBy?: number | null,
    ): Promise<ISyncResult>;

    /**
     * Синхронизировать всех пользователей для всех активных конфигураций
     * @returns Массив результатов синхронизации
     */
    syncAllTenants(): Promise<ISyncResult[]>;

    /**
     * Получить статус последней синхронизации
     * @param configId - ID конфигурации
     * @param tenantId - ID тенанта (для проверки доступа)
     * @returns Статус синхронизации
     */
    getSyncStatus(
        configId: number,
        tenantId: number,
    ): Promise<ISyncStatus | null>;

    /**
     * Повторить failed синхронизацию
     * @param configId - ID конфигурации
     * @param tenantId - ID тенанта (для проверки доступа)
     * @returns Результат повторной синхронизации
     */
    retryFailedSync(configId: number, tenantId: number): Promise<ISyncResult>;

    /**
     * Приостановить автоматическую синхронизацию
     * @param configId - ID конфигурации
     * @param tenantId - ID тенанта (для проверки доступа)
     */
    pauseSync(configId: number, tenantId: number): Promise<void>;

    /**
     * Возобновить автоматическую синхронизацию
     * @param configId - ID конфигурации
     * @param tenantId - ID тенанта (для проверки доступа)
     */
    resumeSync(configId: number, tenantId: number): Promise<void>;

    /**
     * Тестировать подключение к внешней системе
     * @param configId - ID конфигурации
     * @param tenantId - ID тенанта (для проверки доступа)
     * @returns Результат проверки подключения
     */
    testConnection(
        configId: number,
        tenantId: number,
    ): Promise<{
        success: boolean;
        error?: string;
        providerInfo?: {
            name: string;
            version?: string;
            capabilities?: string[];
        };
    }>;
}
