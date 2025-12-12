import { ApiProperty } from '@nestjs/swagger';
import {
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    Table,
    UpdatedAt,
} from 'sequelize-typescript';
import { ExternalUserSyncLogModel } from './external-user-sync-log.model';
import { RoleMappingModel } from './role-mapping.model';
import { TenantModel } from './tenant.model';
import { UserModel } from './user.model';

/**
 * Типы провайдеров внешних систем управления ролями
 */
export type ExternalRoleProviderType =
    | 'LDAP'
    | 'AD'
    | 'AZURE_AD'
    | 'GOOGLE_WORKSPACE'
    | 'OKTA'
    | 'SAML'
    | 'OIDC'
    | 'GENERIC_OAUTH2';

/**
 * Режимы синхронизации
 */
export type SyncMode = 'FULL' | 'INCREMENTAL' | 'ON_DEMAND';

/**
 * Статусы конфигурации
 */
export type ExternalRoleConfigStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'SYNCING';

/**
 * Конфигурация провайдера (JSON)
 */
export interface IProviderConfig {
    // LDAP/AD
    host?: string;
    port?: number;
    baseDN?: string;
    bindDN?: string;
    bindCredentials?: string; // Зашифровано
    searchBase?: string;
    searchFilter?: string;
    tlsOptions?: {
        rejectUnauthorized: boolean;
        ca?: string[];
    };

    // OAuth 2.0 / OIDC
    clientId?: string;
    clientSecret?: string; // Зашифровано
    authorizationURL?: string;
    tokenURL?: string;
    userInfoURL?: string;
    callbackURL?: string;
    scope?: string[];
    issuer?: string;

    // SAML
    entryPoint?: string;
    cert?: string;
    privateKey?: string; // Зашифровано
    samlIssuer?: string; // Переименовано для избежания конфликта с OIDC issuer
    samlCallbackURL?: string; // Переименовано для избежания конфликта с OIDC callbackURL

    // Общие
    verifySSL?: boolean;
    timeout?: number;
    [key: string]: unknown;
}

export interface IExternalRoleConfigModel {
    id: number;
    tenantId: number;
    providerType: ExternalRoleProviderType;
    name: string;
    description: string | null;
    providerConfig: IProviderConfig;
    syncEnabled: boolean;
    syncSchedule: string;
    syncMode: SyncMode;
    lastSyncAt: Date | null;
    nextSyncAt: Date | null;
    credentialsEncrypted: boolean;
    verifySSL: boolean;
    timeoutMs: number;
    status: ExternalRoleConfigStatus;
    lastError: string | null;
    lastErrorAt: Date | null;
    errorCount: number;
    createdBy: number | null;
    updatedBy: number | null;
    createdAt: Date;
    updatedAt: Date;
    tenant?: TenantModel;
    createdByUser?: UserModel;
    updatedByUser?: UserModel;
}

export interface IExternalRoleConfigCreationAttributes {
    tenantId: number;
    providerType: ExternalRoleProviderType;
    name: string;
    description?: string | null;
    providerConfig: IProviderConfig;
    syncEnabled?: boolean;
    syncSchedule?: string;
    syncMode?: SyncMode;
    lastSyncAt?: Date | null;
    nextSyncAt?: Date | null;
    credentialsEncrypted?: boolean;
    verifySSL?: boolean;
    timeoutMs?: number;
    status?: ExternalRoleConfigStatus;
    lastError?: string | null;
    lastErrorAt?: Date | null;
    errorCount?: number;
    createdBy?: number | null;
    updatedBy?: number | null;
}

@Table({
    tableName: 'external_role_configs',
    underscored: true,
    timestamps: true,
    indexes: [
        {
            name: 'idx_external_role_configs_tenant_id',
            fields: ['tenant_id'],
        },
        {
            name: 'idx_external_role_configs_provider_type',
            fields: ['provider_type'],
        },
        {
            name: 'idx_external_role_configs_status',
            fields: ['status'],
        },
        {
            name: 'idx_external_role_configs_sync_enabled',
            fields: ['sync_enabled'],
        },
        {
            name: 'idx_external_role_configs_next_sync_at',
            fields: ['next_sync_at'],
        },
        {
            name: 'uk_external_role_configs_tenant_provider',
            fields: ['tenant_id', 'provider_type', 'name'],
            unique: true,
        },
    ],
})
export class ExternalRoleConfigModel
    extends Model<
        ExternalRoleConfigModel,
        IExternalRoleConfigCreationAttributes
    >
    implements IExternalRoleConfigModel
{
    @ApiProperty({
        example: 1,
        description: 'Идентификатор конфигурации',
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
        example: 'LDAP',
        description: 'Тип провайдера',
        enum: [
            'LDAP',
            'AD',
            'AZURE_AD',
            'GOOGLE_WORKSPACE',
            'OKTA',
            'SAML',
            'OIDC',
            'GENERIC_OAUTH2',
        ],
    })
    @Column({
        type: DataType.ENUM(
            'LDAP',
            'AD',
            'AZURE_AD',
            'GOOGLE_WORKSPACE',
            'OKTA',
            'SAML',
            'OIDC',
            'GENERIC_OAUTH2',
        ),
        allowNull: false,
        field: 'provider_type',
    })
    declare providerType: ExternalRoleProviderType;

    @ApiProperty({
        example: 'Corporate LDAP',
        description: 'Название конфигурации',
    })
    @Column({
        type: DataType.STRING(255),
        allowNull: false,
        validate: {
            len: [1, 255],
            notEmpty: true,
        },
    })
    declare name: string;

    @ApiProperty({
        example: 'Интеграция с корпоративным LDAP сервером',
        description: 'Описание конфигурации',
        required: false,
    })
    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare description: string | null;

    @ApiProperty({
        example: { host: 'ldap.company.com', port: 389 },
        description: 'Конфигурация провайдера (JSON)',
    })
    @Column({
        type: DataType.JSON,
        allowNull: false,
        field: 'provider_config',
        validate: {
            isObject(value: unknown): void {
                if (typeof value !== 'object' || value === null) {
                    throw new Error('provider_config должен быть объектом');
                }
            },
        },
    })
    declare providerConfig: IProviderConfig;

    @ApiProperty({
        example: true,
        description: 'Включена ли автоматическая синхронизация',
    })
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'sync_enabled',
    })
    declare syncEnabled: boolean;

    @ApiProperty({
        example: '0 */6 * * *',
        description: 'Cron выражение для автоматической синхронизации',
    })
    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        defaultValue: '0 */6 * * *',
        field: 'sync_schedule',
        validate: {
            len: [1, 50],
        },
    })
    declare syncSchedule: string;

    @ApiProperty({
        example: 'INCREMENTAL',
        description: 'Режим синхронизации',
        enum: ['FULL', 'INCREMENTAL', 'ON_DEMAND'],
    })
    @Column({
        type: DataType.ENUM('FULL', 'INCREMENTAL', 'ON_DEMAND'),
        allowNull: false,
        defaultValue: 'INCREMENTAL',
        field: 'sync_mode',
    })
    declare syncMode: SyncMode;

    @ApiProperty({
        example: '2025-12-07T12:00:00Z',
        description: 'Время последней синхронизации',
        required: false,
    })
    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'last_sync_at',
    })
    declare lastSyncAt: Date | null;

    @ApiProperty({
        example: '2025-12-07T18:00:00Z',
        description: 'Время следующей синхронизации',
        required: false,
    })
    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'next_sync_at',
    })
    declare nextSyncAt: Date | null;

    @ApiProperty({
        example: true,
        description: 'Зашифрованы ли credentials',
    })
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'credentials_encrypted',
    })
    declare credentialsEncrypted: boolean;

    @ApiProperty({
        example: true,
        description: 'Проверять ли SSL сертификат',
    })
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'verify_ssl',
    })
    declare verifySSL: boolean;

    @ApiProperty({
        example: 30000,
        description: 'Таймаут запросов в миллисекундах',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 30000,
        field: 'timeout_ms',
        validate: {
            isInt: true,
            min: 1000,
            max: 300000, // 5 минут максимум
        },
    })
    declare timeoutMs: number;

    @ApiProperty({
        example: 'ACTIVE',
        description: 'Статус конфигурации',
        enum: ['ACTIVE', 'INACTIVE', 'ERROR', 'SYNCING'],
    })
    @Column({
        type: DataType.ENUM('ACTIVE', 'INACTIVE', 'ERROR', 'SYNCING'),
        allowNull: false,
        defaultValue: 'ACTIVE',
    })
    declare status: ExternalRoleConfigStatus;

    @ApiProperty({
        example: 'Connection timeout',
        description: 'Последняя ошибка синхронизации',
        required: false,
    })
    @Column({
        type: DataType.TEXT,
        allowNull: true,
        field: 'last_error',
    })
    declare lastError: string | null;

    @ApiProperty({
        example: '2025-12-07T12:00:00Z',
        description: 'Время последней ошибки',
        required: false,
    })
    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'last_error_at',
    })
    declare lastErrorAt: Date | null;

    @ApiProperty({
        example: 0,
        description: 'Количество ошибок',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'error_count',
        validate: {
            isInt: true,
            min: 0,
        },
    })
    declare errorCount: number;

    @ApiProperty({
        example: 1,
        description: 'ID пользователя, создавшего конфигурацию',
        required: false,
    })
    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        field: 'created_by',
    })
    declare createdBy: number | null;

    @ApiProperty({
        example: 1,
        description: 'ID пользователя, обновившего конфигурацию',
        required: false,
    })
    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        field: 'updated_by',
    })
    declare updatedBy: number | null;

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

    @BelongsTo(() => TenantModel, 'tenant_id')
    declare tenant?: TenantModel;

    @BelongsTo(() => UserModel, 'created_by')
    declare createdByUser?: UserModel;

    @BelongsTo(() => UserModel, 'updated_by')
    declare updatedByUser?: UserModel;

    @HasMany(() => RoleMappingModel, {
        foreignKey: 'external_role_config_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        as: 'roleMappings',
    })
    declare roleMappings?: RoleMappingModel[];

    @HasMany(() => ExternalUserSyncLogModel, {
        foreignKey: 'external_role_config_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        as: 'syncLogs',
    })
    declare syncLogs?: ExternalUserSyncLogModel[];
}

