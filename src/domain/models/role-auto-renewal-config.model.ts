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
import { UserRoleModel } from './user-role.model';

interface IRoleAutoRenewalConfigModel {
    id: number;
    userRoleId: number;
    isEnabled: boolean;
    renewalDurationMs: number;
    maxRenewals: number;
    currentRenewalCount: number;
    lastRenewedAt: Date | null;
    notificationEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface IRoleAutoRenewalConfigCreationAttributes {
    userRoleId: number;
    isEnabled?: boolean;
    renewalDurationMs: number;
    maxRenewals?: number;
    currentRenewalCount?: number;
    lastRenewedAt?: Date | null;
    notificationEnabled?: boolean;
}

@Table({
    tableName: 'role_auto_renewal_config',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['createdAt', 'updatedAt'] },
    },
    indexes: [
        {
            name: 'idx_role_auto_renewal_config_user_role_id',
            fields: ['user_role_id'],
            unique: true,
        },
        {
            name: 'idx_role_auto_renewal_config_is_enabled',
            fields: ['is_enabled'],
        },
        {
            name: 'idx_role_auto_renewal_config_user_role_enabled',
            fields: ['user_role_id', 'is_enabled'],
        },
    ],
})
export class RoleAutoRenewalConfigModel
    extends Model<
        IRoleAutoRenewalConfigModel,
        IRoleAutoRenewalConfigCreationAttributes
    >
    implements IRoleAutoRenewalConfigModel
{
    @ApiProperty({
        example: 1,
        description:
            'Уникальный идентификатор конфигурации автоматического продления',
    })
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @ApiProperty({
        example: 42,
        description: 'ID назначения роли (FK → user_roles.id)',
    })
    @ForeignKey(() => UserRoleModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        unique: true,
        field: 'user_role_id',
    })
    declare userRoleId: number;

    @ApiProperty({
        example: true,
        description: 'Включено ли автоматическое продление',
    })
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_enabled',
    })
    declare isEnabled: boolean;

    @ApiProperty({
        example: 2592000000,
        description:
            'Длительность продления роли в миллисекундах (например, 2592000000 = 30 дней)',
    })
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
        field: 'renewal_duration_ms',
        validate: {
            min: 1, // Минимум 1 миллисекунда
        },
    })
    declare renewalDurationMs: number;

    @ApiProperty({
        example: 12,
        description:
            'Максимальное количество автоматических продлений (0 = без ограничений)',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 12,
        field: 'max_renewals',
        validate: {
            min: 0, // 0 = без ограничений
        },
    })
    declare maxRenewals: number;

    @ApiProperty({
        example: 3,
        description: 'Текущее количество выполненных продлений',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'current_renewal_count',
        validate: {
            min: 0,
        },
    })
    declare currentRenewalCount: number;

    @ApiProperty({
        example: '2025-12-03T10:00:00Z',
        description:
            'Дата и время последнего автоматического продления (NULL если еще не продлевалась)',
        required: false,
    })
    @Column({
        type: DataType.DATE,
        allowNull: true,
        defaultValue: null,
        field: 'last_renewed_at',
    })
    declare lastRenewedAt: Date | null;

    @ApiProperty({
        example: true,
        description: 'Включены ли уведомления об истечении для этой роли',
    })
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'notification_enabled',
    })
    declare notificationEnabled: boolean;

    @BelongsTo(() => UserRoleModel, {
        foreignKey: 'user_role_id',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        as: 'userRole', // Явное имя ассоциации для использования в запросах
    })
    declare userRole: UserRoleModel;

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

    // ============================================================================
    // INSTANCE METHODS: Методы проверки и валидации
    // ============================================================================

    /**
     * Проверить, можно ли выполнить еще одно продление
     * @returns true если можно продлить (isEnabled && (maxRenewals === 0 || currentRenewalCount < maxRenewals))
     *
     * @example
     * const config = await RoleAutoRenewalConfigModel.findByPk(1);
     * if (config.canRenew()) {
     *   await config.renew();
     * }
     */
    public canRenew(): boolean {
        if (!this.isEnabled) {
            return false;
        }
        // Если maxRenewals === 0, то продления без ограничений
        if (this.maxRenewals === 0) {
            return true;
        }
        return this.currentRenewalCount < this.maxRenewals;
    }

    /**
     * Проверить, достигнут ли лимит продлений
     * @returns true если достигнут лимит (maxRenewals > 0 && currentRenewalCount >= maxRenewals)
     *
     * @example
     * const config = await RoleAutoRenewalConfigModel.findByPk(1);
     * if (config.hasReachedLimit()) {
     *   config.isEnabled = false; // Отключаем автоматическое продление
     *   await config.save();
     * }
     */
    public hasReachedLimit(): boolean {
        if (this.maxRenewals === 0) {
            return false; // Без ограничений
        }
        return this.currentRenewalCount >= this.maxRenewals;
    }
}
