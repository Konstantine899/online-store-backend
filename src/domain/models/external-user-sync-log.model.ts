import { ApiProperty } from '@nestjs/swagger';
import {
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    Model,
    Table,
    UpdatedAt,
} from 'sequelize-typescript';
import { ExternalRoleConfigModel } from './external-role-config.model';
import { TenantModel } from './tenant.model';
import { UserModel } from './user.model';

/**
 * Типы синхронизации
 */
export type SyncType = 'FULL' | 'INCREMENTAL' | 'ON_DEMAND' | 'SSO_LOGIN';

/**
 * Типы триггеров синхронизации
 */
export type SyncTriggerType = 'SCHEDULED' | 'MANUAL' | 'SSO_LOGIN' | 'WEBHOOK';

/**
 * Статусы синхронизации
 */
export type SyncStatus = 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';

/**
 * Детали ошибок (массив объектов)
 */
export interface IErrorDetail {
    userId?: string | number;
    externalUserId?: string;
    error: string;
    timestamp: Date;
    [key: string]: unknown;
}

/**
 * Метаданные синхронизации
 */
export interface ISyncMetadata {
    providerType?: string;
    syncStartTime?: Date;
    syncEndTime?: Date;
    totalExternalUsers?: number;
    [key: string]: unknown;
}

export interface IExternalUserSyncLogModel {
    id: number;
    externalRoleConfigId: number;
    tenantId: number;
    syncType: SyncType;
    triggerType: SyncTriggerType;
    triggeredBy: number | null;
    status: SyncStatus;
    totalUsers: number;
    createdUsers: number;
    updatedUsers: number;
    deletedUsers: number;
    mappedUsers: number;
    skippedUsers: number;
    failedUsers: number;
    startedAt: Date;
    completedAt: Date | null;
    durationMs: number | null;
    errorMessage: string | null;
    errorDetails: IErrorDetail[] | null;
    metadata: ISyncMetadata | null;
    createdAt: Date;
    updatedAt: Date;
    externalRoleConfig?: ExternalRoleConfigModel;
    tenant?: TenantModel;
    triggeredByUser?: UserModel | null;
}

export interface IExternalUserSyncLogCreationAttributes {
    externalRoleConfigId: number;
    tenantId: number;
    syncType: SyncType;
    triggerType: SyncTriggerType;
    triggeredBy?: number | null;
    status?: SyncStatus;
    totalUsers?: number;
    createdUsers?: number;
    updatedUsers?: number;
    deletedUsers?: number;
    mappedUsers?: number;
    skippedUsers?: number;
    failedUsers?: number;
    startedAt: Date;
    completedAt?: Date | null;
    durationMs?: number | null;
    errorMessage?: string | null;
    errorDetails?: IErrorDetail[] | null;
    metadata?: ISyncMetadata | null;
}

@Table({
    tableName: 'external_user_sync_logs',
    underscored: true,
    timestamps: true,
    indexes: [
        {
            name: 'idx_external_user_sync_logs_config_id',
            fields: ['external_role_config_id'],
        },
        {
            name: 'idx_external_user_sync_logs_tenant_id',
            fields: ['tenant_id'],
        },
        {
            name: 'idx_external_user_sync_logs_status',
            fields: ['status'],
        },
        {
            name: 'idx_external_user_sync_logs_started_at',
            fields: ['started_at'],
        },
        {
            name: 'idx_external_user_sync_logs_trigger_type',
            fields: ['trigger_type'],
        },
        {
            name: 'idx_external_user_sync_logs_config_started',
            fields: ['external_role_config_id', 'started_at'],
        },
    ],
})
export class ExternalUserSyncLogModel
    extends Model<
        ExternalUserSyncLogModel,
        IExternalUserSyncLogCreationAttributes
    >
    implements IExternalUserSyncLogModel
{
    @ApiProperty({
        example: 1,
        description: 'Идентификатор лога синхронизации',
    })
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @ApiProperty({
        example: 1,
        description: 'ID конфигурации внешней системы',
    })
    @ForeignKey(() => ExternalRoleConfigModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'external_role_config_id',
        validate: {
            isInt: true,
            min: 1,
        },
    })
    declare externalRoleConfigId: number;

    @ApiProperty({
        example: 1,
        description: 'ID тенанта',
    })
    @ForeignKey(() => TenantModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'tenant_id',
        validate: {
            isInt: true,
            min: 1,
        },
    })
    declare tenantId: number;

    @ApiProperty({
        example: 'INCREMENTAL',
        description: 'Тип синхронизации',
        enum: ['FULL', 'INCREMENTAL', 'ON_DEMAND', 'SSO_LOGIN'],
    })
    @Column({
        type: DataType.ENUM('FULL', 'INCREMENTAL', 'ON_DEMAND', 'SSO_LOGIN'),
        allowNull: false,
        field: 'sync_type',
    })
    declare syncType: SyncType;

    @ApiProperty({
        example: 'SCHEDULED',
        description: 'Тип триггера синхронизации',
        enum: ['SCHEDULED', 'MANUAL', 'SSO_LOGIN', 'WEBHOOK'],
    })
    @Column({
        type: DataType.ENUM('SCHEDULED', 'MANUAL', 'SSO_LOGIN', 'WEBHOOK'),
        allowNull: false,
        field: 'trigger_type',
    })
    declare triggerType: SyncTriggerType;

    @ApiProperty({
        example: 1,
        description: 'ID пользователя, запустившего синхронизацию',
        required: false,
    })
    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        field: 'triggered_by',
    })
    declare triggeredBy: number | null;

    @ApiProperty({
        example: 'SUCCESS',
        description: 'Статус синхронизации',
        enum: ['RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED'],
    })
    @Column({
        type: DataType.ENUM('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED'),
        allowNull: false,
        defaultValue: 'RUNNING',
    })
    declare status: SyncStatus;

    @ApiProperty({
        example: 100,
        description: 'Общее количество обработанных пользователей',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_users',
        validate: {
            isInt: true,
            min: 0,
        },
    })
    declare totalUsers: number;

    @ApiProperty({
        example: 10,
        description: 'Количество созданных пользователей',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'created_users',
        validate: {
            isInt: true,
            min: 0,
        },
    })
    declare createdUsers: number;

    @ApiProperty({
        example: 50,
        description: 'Количество обновленных пользователей',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'updated_users',
        validate: {
            isInt: true,
            min: 0,
        },
    })
    declare updatedUsers: number;

    @ApiProperty({
        example: 5,
        description: 'Количество удаленных пользователей',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'deleted_users',
        validate: {
            isInt: true,
            min: 0,
        },
    })
    declare deletedUsers: number;

    @ApiProperty({
        example: 60,
        description: 'Количество пользователей с примененным маппингом',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'mapped_users',
        validate: {
            isInt: true,
            min: 0,
        },
    })
    declare mappedUsers: number;

    @ApiProperty({
        example: 30,
        description: 'Количество пропущенных пользователей',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'skipped_users',
        validate: {
            isInt: true,
            min: 0,
        },
    })
    declare skippedUsers: number;

    @ApiProperty({
        example: 5,
        description: 'Количество пользователей с ошибками',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'failed_users',
        validate: {
            isInt: true,
            min: 0,
        },
    })
    declare failedUsers: number;

    @ApiProperty({
        example: '2025-12-07T12:00:00Z',
        description: 'Время начала синхронизации',
    })
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'started_at',
    })
    declare startedAt: Date;

    @ApiProperty({
        example: '2025-12-07T12:05:00Z',
        description: 'Время завершения синхронизации',
        required: false,
    })
    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'completed_at',
    })
    declare completedAt: Date | null;

    @ApiProperty({
        example: 300000,
        description: 'Длительность синхронизации в миллисекундах',
        required: false,
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        field: 'duration_ms',
        validate: {
            isInt: true,
            min: 0,
        },
    })
    declare durationMs: number | null;

    @ApiProperty({
        example: 'Connection timeout',
        description: 'Сообщение об ошибке (если есть)',
        required: false,
    })
    @Column({
        type: DataType.TEXT,
        allowNull: true,
        field: 'error_message',
    })
    declare errorMessage: string | null;

    @ApiProperty({
        example: [
            {
                userId: 123,
                externalUserId: 'ldap-user-456',
                error: 'Failed to map role',
                timestamp: '2025-12-07T12:02:00Z',
            },
        ],
        description: 'Детали ошибок (массив)',
        required: false,
    })
    @Column({
        type: DataType.JSON,
        allowNull: true,
        field: 'error_details',
        validate: {
            isArrayOrNull(value: unknown): void {
                if (value !== null && !Array.isArray(value)) {
                    throw new Error('error_details должен быть массивом или null');
                }
            },
        },
    })
    declare errorDetails: IErrorDetail[] | null;

    @ApiProperty({
        example: {
            providerType: 'LDAP',
            totalExternalUsers: 100,
        },
        description: 'Дополнительная информация о синхронизации',
        required: false,
    })
    @Column({
        type: DataType.JSON,
        allowNull: true,
        validate: {
            isObjectOrNull(value: unknown): void {
                if (value !== null && typeof value !== 'object') {
                    throw new Error('metadata должен быть объектом или null');
                }
            },
        },
    })
    declare metadata: ISyncMetadata | null;

    @CreatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'created_at',
    })
    declare createdAt: Date;

    @UpdatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'updated_at',
    })
    declare updatedAt: Date;

    @BelongsTo(() => ExternalRoleConfigModel, 'external_role_config_id')
    declare externalRoleConfig?: ExternalRoleConfigModel;

    @BelongsTo(() => TenantModel, 'tenant_id')
    declare tenant?: TenantModel;

    @BelongsTo(() => UserModel, 'triggered_by')
    declare triggeredByUser?: UserModel | null;
}

