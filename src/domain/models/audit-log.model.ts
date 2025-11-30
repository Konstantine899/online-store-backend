import {
    Model,
    DataType,
    Column,
    Table,
    BelongsTo,
    ForeignKey,
    Index,
} from 'sequelize-typescript';
import { UserModel } from './user.model';

/**
 * Типы действий для аудита
 */
export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    ASSIGN = 'ASSIGN',
    REVOKE = 'REVOKE',
    GRANT_PERMISSION = 'GRANT_PERMISSION',
    REVOKE_PERMISSION = 'REVOKE_PERMISSION',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
}

/**
 * Интерфейс для модели AuditLog
 */
export interface IAuditLogModel {
    id: number;
    entityType: string;
    entityId: number;
    action: AuditAction;
    userId: number | null;
    oldValues: Record<string, unknown> | null;
    newValues: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
    requestId: string | null;
    tenantId: number | null;
    createdAt: Date;
    user?: UserModel;
}

/**
 * Интерфейс для создания AuditLog
 */
export interface IAuditLogCreationAttributes {
    entityType: string;
    entityId: number;
    action: AuditAction;
    userId?: number | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
    tenantId?: number | null;
}

/**
 * Модель для логирования аудита
 * Отслеживает все изменения в системе с детальной информацией
 */
@Table({
    tableName: 'audit_logs',
    underscored: true,
    timestamps: false,
    indexes: [
        {
            name: 'idx_audit_logs_entity',
            fields: ['entity_type', 'entity_id'],
        },
        {
            name: 'idx_audit_logs_action',
            fields: ['action'],
        },
        {
            name: 'idx_audit_logs_user_id',
            fields: ['user_id'],
        },
        {
            name: 'idx_audit_logs_tenant_id',
            fields: ['tenant_id'],
        },
        {
            name: 'idx_audit_logs_created_at',
            fields: ['created_at'],
        },
        {
            name: 'idx_audit_logs_request_id',
            fields: ['request_id'],
        },
        {
            name: 'idx_audit_logs_tenant_created',
            fields: ['tenant_id', 'created_at'],
        },
    ],
})
export class AuditLogModel
    extends Model<AuditLogModel, IAuditLogCreationAttributes>
    implements IAuditLogModel
{
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Index
    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        field: 'entity_type',
        comment: 'Тип сущности (role, user_role, role_permission)',
    })
    declare entityType: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'entity_id',
        comment: 'ID сущности',
    })
    declare entityId: number;

    @Index
    @Column({
        type: DataType.ENUM(...Object.values(AuditAction)),
        allowNull: false,
        comment: 'Тип действия',
    })
    declare action: AuditAction;

    @ForeignKey(() => UserModel)
    @Index
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        field: 'user_id',
        comment: 'ID пользователя, выполнившего действие (null для системных операций)',
    })
    declare userId: number | null;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        field: 'old_values',
        comment: 'Старые значения (для UPDATE, DELETE)',
    })
    declare oldValues: Record<string, unknown> | null;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        field: 'new_values',
        comment: 'Новые значения (для CREATE, UPDATE)',
    })
    declare newValues: Record<string, unknown> | null;

    @Column({
        type: DataType.INET,
        allowNull: true,
        field: 'ip_address',
        comment: 'IP адрес пользователя',
    })
    declare ipAddress: string | null;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        field: 'user_agent',
        comment: 'User-Agent браузера',
    })
    declare userAgent: string | null;

    @Index
    @Column({
        type: DataType.STRING(255),
        allowNull: true,
        field: 'request_id',
        comment: 'Correlation ID для трассировки запросов',
    })
    declare requestId: string | null;

    @Index
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        field: 'tenant_id',
        comment: 'ID тенанта для tenant isolation',
    })
    declare tenantId: number | null;

    @Index
    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: 'created_at',
        comment: 'Timestamp операции',
    })
    declare createdAt: Date;

    // Связи
    @BelongsTo(() => UserModel)
    declare user: UserModel;

    // Вспомогательные методы для проверки типа действия
    get isCreateAction(): boolean {
        return this.action === AuditAction.CREATE;
    }

    get isUpdateAction(): boolean {
        return this.action === AuditAction.UPDATE;
    }

    get isDeleteAction(): boolean {
        return this.action === AuditAction.DELETE;
    }

    get isAssignAction(): boolean {
        return this.action === AuditAction.ASSIGN;
    }

    get isRevokeAction(): boolean {
        return this.action === AuditAction.REVOKE;
    }

    get isPermissionAction(): boolean {
        return (
            this.action === AuditAction.GRANT_PERMISSION ||
            this.action === AuditAction.REVOKE_PERMISSION
        );
    }

    get hasChanges(): boolean {
        return this.oldValues !== null && this.newValues !== null;
    }

    /**
     * Статический метод для создания записи аудита
     */
    static async createAuditLog(
        data: IAuditLogCreationAttributes,
    ): Promise<AuditLogModel> {
        return this.create(data);
    }
}

