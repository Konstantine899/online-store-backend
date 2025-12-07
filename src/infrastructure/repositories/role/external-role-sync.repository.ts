import {
    ExternalRoleConfigModel,
    ExternalRoleConfigStatus,
    ExternalUserSyncLogModel,
    IExternalRoleConfigCreationAttributes,
    SyncStatus,
    SyncType,
} from '@app/domain/models';
import {
    IExternalRoleSyncRepository,
    IFindConfigsOptions,
    IFindSyncLogsOptions,
} from '@app/domain/repositories';
import { TenantContext } from '@app/infrastructure/common/context';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';

/**
 * ExternalRoleSyncRepository
 * Репозиторий для работы с конфигурациями внешних систем управления ролями
 * и логами синхронизации
 *
 * Все методы обеспечивают tenant isolation - пользователь видит только данные своего тенанта.
 */
@Injectable()
export class ExternalRoleSyncRepository
    implements IExternalRoleSyncRepository
{
    private readonly logger = new Logger(ExternalRoleSyncRepository.name);

    constructor(
        @InjectModel(ExternalRoleConfigModel)
        private externalRoleConfigModel: typeof ExternalRoleConfigModel,
        @InjectModel(ExternalUserSyncLogModel)
        private externalUserSyncLogModel: typeof ExternalUserSyncLogModel,
        private readonly tenantContext: TenantContext,
    ) {}

    /**
     * Получить tenantId с поддержкой test режима
     * @private
     */
    private getTenantIdSafe(): number | null {
        if (process.env.NODE_ENV === 'test') {
            return this.tenantContext.getTenantIdOrNull() ?? 1;
        }
        return this.tenantContext.getTenantIdOrNull();
    }

    /**
     * Создать новую конфигурацию
     */
    public async createConfig(
        data: IExternalRoleConfigCreationAttributes,
    ): Promise<ExternalRoleConfigModel> {
        try {
            const config = await this.externalRoleConfigModel.create({
                tenantId: data.tenantId,
                providerType: data.providerType,
                name: data.name,
                description: data.description ?? null,
                providerConfig: data.providerConfig,
                syncEnabled: data.syncEnabled ?? true,
                syncSchedule: data.syncSchedule ?? '0 */6 * * *',
                syncMode: data.syncMode ?? 'INCREMENTAL',
                lastSyncAt: data.lastSyncAt ?? null,
                nextSyncAt: data.nextSyncAt ?? null,
                credentialsEncrypted: data.credentialsEncrypted ?? true,
                verifySSL: data.verifySSL ?? true,
                timeoutMs: data.timeoutMs ?? 30000,
                status: data.status ?? 'ACTIVE',
                lastError: data.lastError ?? null,
                lastErrorAt: data.lastErrorAt ?? null,
                errorCount: data.errorCount ?? 0,
                createdBy: data.createdBy ?? null,
                updatedBy: data.updatedBy ?? null,
            });

            this.logger.log({
                configId: config.id,
                tenantId: config.tenantId,
                providerType: config.providerType,
                message: 'Создана новая конфигурация внешней системы',
            });

            return config;
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    data: { tenantId: data.tenantId, providerType: data.providerType },
                },
                'Ошибка при создании конфигурации',
            );
            throw error;
        }
    }

    /**
     * Найти конфигурацию по ID с tenant isolation
     */
    public async findConfigById(
        id: number,
        tenantId?: number | null,
    ): Promise<ExternalRoleConfigModel | null> {
        const effectiveTenantId = tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = {
            id,
        };

        // Tenant isolation: проверяем, что конфигурация принадлежит тенанту
        if (effectiveTenantId !== null) {
            where.tenantId = effectiveTenantId;
        }

        const config = await this.externalRoleConfigModel.findOne({ where });

        return config;
    }

    /**
     * Найти все конфигурации по опциям
     */
    public async findConfigs(
        options?: IFindConfigsOptions,
    ): Promise<ExternalRoleConfigModel[]> {
        const effectiveTenantId =
            options?.tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = {};

        // Tenant isolation
        if (effectiveTenantId !== null && effectiveTenantId !== undefined) {
            where.tenantId = effectiveTenantId;
        }

        // Фильтры
        if (options?.providerType) {
            where.providerType = options.providerType;
        }

        if (options?.status) {
            where.status = options.status;
        }

        if (options?.syncEnabled !== undefined) {
            where.syncEnabled = options.syncEnabled;
        }

        const configs = await this.externalRoleConfigModel.findAll({
            where,
            order: [['created_at', 'DESC']],
        });

        return configs;
    }

    /**
     * Обновить конфигурацию с tenant isolation
     */
    public async updateConfig(
        id: number,
        data: Partial<IExternalRoleConfigCreationAttributes>,
        tenantId?: number | null,
    ): Promise<ExternalRoleConfigModel | null> {
        const effectiveTenantId = tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = { id };

        // Tenant isolation
        if (effectiveTenantId !== null) {
            where.tenantId = effectiveTenantId;
        }

        const [affectedRows] =
            await this.externalRoleConfigModel.update(data, {
                where,
            });

        if (affectedRows === 0) {
            return null;
        }

        const updatedConfig = await this.externalRoleConfigModel.findOne({
            where,
        });

        if (updatedConfig) {
            this.logger.log({
                configId: id,
                tenantId: effectiveTenantId,
                message: 'Конфигурация обновлена',
            });
        }

        return updatedConfig;
    }

    /**
     * Удалить конфигурацию с tenant isolation
     */
    public async deleteConfig(
        id: number,
        tenantId?: number | null,
    ): Promise<number> {
        const effectiveTenantId = tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = { id };

        // Tenant isolation
        if (effectiveTenantId !== null) {
            where.tenantId = effectiveTenantId;
        }

        const deletedCount = await this.externalRoleConfigModel.destroy({
            where,
        });

        if (deletedCount > 0) {
            this.logger.log({
                configId: id,
                tenantId: effectiveTenantId,
                message: 'Конфигурация удалена',
            });
        }

        return deletedCount;
    }

    /**
     * Обновить статус конфигурации
     */
    public async updateConfigStatus(
        id: number,
        status: ExternalRoleConfigStatus,
        error?: string | null,
        tenantId?: number | null,
    ): Promise<void> {
        const effectiveTenantId = tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = { id };

        // Tenant isolation
        if (effectiveTenantId !== null) {
            where.tenantId = effectiveTenantId;
        }

        const updateData: Partial<IExternalRoleConfigCreationAttributes> = {
            status,
        };

        if (error !== undefined) {
            updateData.lastError = error;
            updateData.lastErrorAt = error ? new Date() : null;
            if (error) {
                // Инкремент счетчика ошибок
                await this.externalRoleConfigModel.increment('error_count', {
                    where,
                });
            }
        }

        await this.externalRoleConfigModel.update(updateData, { where });

        this.logger.log({
            configId: id,
            status,
            tenantId: effectiveTenantId,
            message: 'Статус конфигурации обновлен',
        });
    }

    /**
     * Обновить время синхронизации
     */
    public async updateSyncTimes(
        id: number,
        lastSyncAt: Date,
        nextSyncAt: Date | null,
        tenantId?: number | null,
    ): Promise<void> {
        const effectiveTenantId = tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = { id };

        // Tenant isolation
        if (effectiveTenantId !== null) {
            where.tenantId = effectiveTenantId;
        }

        await this.externalRoleConfigModel.update(
            {
                lastSyncAt,
                nextSyncAt,
            },
            { where },
        );
    }

    /**
     * Создать лог синхронизации
     */
    public async createSyncLog(
        data: {
            externalRoleConfigId: number;
            tenantId: number;
            syncType: SyncType;
            triggerType: 'SCHEDULED' | 'MANUAL' | 'SSO_LOGIN' | 'WEBHOOK';
            triggeredBy?: number | null;
            status?: SyncStatus;
            startedAt: Date;
        },
    ): Promise<ExternalUserSyncLogModel> {
        const log = await this.externalUserSyncLogModel.create({
            externalRoleConfigId: data.externalRoleConfigId,
            tenantId: data.tenantId,
            syncType: data.syncType,
            triggerType: data.triggerType,
            triggeredBy: data.triggeredBy ?? null,
            status: data.status ?? 'RUNNING',
            totalUsers: 0,
            createdUsers: 0,
            updatedUsers: 0,
            deletedUsers: 0,
            mappedUsers: 0,
            skippedUsers: 0,
            failedUsers: 0,
            startedAt: data.startedAt,
            completedAt: null,
            durationMs: null,
            errorMessage: null,
            errorDetails: null,
            metadata: null,
        });

        this.logger.log({
            logId: log.id,
            configId: data.externalRoleConfigId,
            tenantId: data.tenantId,
            syncType: data.syncType,
            message: 'Создан лог синхронизации',
        });

        return log;
    }

    /**
     * Обновить лог синхронизации
     */
    public async updateSyncLog(
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
    ): Promise<ExternalUserSyncLogModel | null> {
        const [affectedRows] = await this.externalUserSyncLogModel.update(
            data,
            {
                where: { id: logId },
            },
        );

        if (affectedRows === 0) {
            return null;
        }

        const updatedLog = await this.externalUserSyncLogModel.findByPk(logId);

        return updatedLog;
    }

    /**
     * Найти логи синхронизации по опциям
     */
    public async findSyncLogs(
        options?: IFindSyncLogsOptions,
    ): Promise<ExternalUserSyncLogModel[]> {
        const effectiveTenantId = options?.tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = {};

        // Tenant isolation
        if (effectiveTenantId !== null && effectiveTenantId !== undefined) {
            where.tenantId = effectiveTenantId;
        }

        // Фильтры
        if (options?.configId) {
            where.externalRoleConfigId = options.configId;
        }

        if (options?.status) {
            where.status = options.status;
        }

        if (options?.syncType) {
            where.syncType = options.syncType;
        }

        if (options?.startDate || options?.endDate) {
            where.startedAt = {};
            if (options.startDate) {
                where.startedAt[Op.gte] = options.startDate;
            }
            if (options.endDate) {
                where.startedAt[Op.lte] = options.endDate;
            }
        }

        const logs = await this.externalUserSyncLogModel.findAll({
            where,
            limit: options?.limit ?? 100,
            offset: options?.offset ?? 0,
            order: [['started_at', 'DESC']],
        });

        return logs;
    }

    /**
     * Найти последний лог синхронизации для конфигурации
     */
    public async findLastSyncLog(
        configId: number,
        tenantId?: number | null,
    ): Promise<ExternalUserSyncLogModel | null> {
        const effectiveTenantId = tenantId ?? this.getTenantIdSafe();

        const where: WhereOptions = {
            externalRoleConfigId: configId,
        };

        // Tenant isolation
        if (effectiveTenantId !== null) {
            where.tenantId = effectiveTenantId;
        }

        const log = await this.externalUserSyncLogModel.findOne({
            where,
            order: [['started_at', 'DESC']],
        });

        return log;
    }

    /**
     * Найти все конфигурации, которые нужно синхронизировать
     */
    public async findConfigsForSync(): Promise<ExternalRoleConfigModel[]> {
        const now = new Date();

        const configs = await this.externalRoleConfigModel.findAll({
            where: {
                syncEnabled: true,
                status: {
                    [Op.in]: ['ACTIVE', 'ERROR'],
                },
                [Op.or]: [
                    { nextSyncAt: null },
                    { nextSyncAt: { [Op.lte]: now } },
                ],
            },
            order: [['next_sync_at', 'ASC']],
        });

        return configs;
    }
}

