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
import { RoleModel } from './role.model';
import { TenantModel } from './tenant.model';

/**
 * Правила маппинга (JSON структура)
 */
export interface IMappingRules {
    conditions?: Array<{
        if: Record<string, unknown>;
        then: string | number;
    }>;
    default?: string | number;
    [key: string]: unknown;
}

export interface IRoleMappingModel {
    id: number;
    externalRoleConfigId: number;
    tenantId: number;
    externalRoleName: string;
    externalRoleId: string | null;
    internalRoleId: number;
    mappingRules: IMappingRules | null;
    priority: number;
    isActive: boolean;
    isDefault: boolean;
    mappedUsersCount: number;
    lastAppliedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    externalRoleConfig?: ExternalRoleConfigModel;
    internalRole?: RoleModel;
    tenant?: TenantModel;
}

export interface IRoleMappingCreationAttributes {
    externalRoleConfigId: number;
    tenantId: number;
    externalRoleName: string;
    externalRoleId?: string | null;
    internalRoleId: number;
    mappingRules?: IMappingRules | null;
    priority?: number;
    isActive?: boolean;
    isDefault?: boolean;
    mappedUsersCount?: number;
    lastAppliedAt?: Date | null;
}

@Table({
    tableName: 'role_mappings',
    underscored: true,
    timestamps: true,
    indexes: [
        {
            name: 'idx_role_mappings_config_id',
            fields: ['external_role_config_id'],
        },
        {
            name: 'idx_role_mappings_tenant_id',
            fields: ['tenant_id'],
        },
        {
            name: 'idx_role_mappings_internal_role_id',
            fields: ['internal_role_id'],
        },
        {
            name: 'idx_role_mappings_external_role_name',
            fields: ['external_role_name'],
        },
        {
            name: 'idx_role_mappings_priority',
            fields: ['priority'],
        },
        {
            name: 'idx_role_mappings_active',
            fields: ['is_active'],
        },
        {
            name: 'uk_role_mappings_config_external',
            fields: ['external_role_config_id', 'external_role_name'],
            unique: true,
        },
    ],
})
export class RoleMappingModel
    extends Model<RoleMappingModel, IRoleMappingCreationAttributes>
    implements IRoleMappingModel
{
    @ApiProperty({
        example: 1,
        description: 'Идентификатор маппинга',
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
        example: 'cn=admins,ou=groups',
        description: 'Название роли/группы во внешней системе',
    })
    @Column({
        type: DataType.STRING(255),
        allowNull: false,
        field: 'external_role_name',
        validate: {
            len: [1, 255],
            notEmpty: true,
        },
    })
    declare externalRoleName: string;

    @ApiProperty({
        example: 'ad-group-12345',
        description: 'ID роли во внешней системе (если доступен)',
        required: false,
    })
    @Column({
        type: DataType.STRING(255),
        allowNull: true,
        field: 'external_role_id',
    })
    declare externalRoleId: string | null;

    @ApiProperty({
        example: 5,
        description: 'ID роли в нашей системе',
    })
    @ForeignKey(() => RoleModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'internal_role_id',
        validate: {
            isInt: true,
            min: 1,
        },
    })
    declare internalRoleId: number;

    @ApiProperty({
        example: {
            conditions: [
                {
                    if: { department: 'IT', external_role: 'admin' },
                    then: 'TENANT_ADMIN',
                },
            ],
            default: 'USER',
        },
        description: 'Дополнительные правила маппинга (условия, фильтры)',
        required: false,
    })
    @Column({
        type: DataType.JSON,
        allowNull: true,
        field: 'mapping_rules',
        validate: {
            isObjectOrNull(value: unknown): void {
                if (value !== null && typeof value !== 'object') {
                    throw new Error('mapping_rules должен быть объектом или null');
                }
            },
        },
    })
    declare mappingRules: IMappingRules | null;

    @ApiProperty({
        example: 100,
        description: 'Приоритет применения (меньше = выше приоритет)',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 100,
        validate: {
            isInt: true,
            min: 0,
            max: 1000,
        },
    })
    declare priority: number;

    @ApiProperty({
        example: true,
        description: 'Активен ли маппинг',
    })
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
    })
    declare isActive: boolean;

    @ApiProperty({
        example: false,
        description: 'Использовать как default роль, если нет других совпадений',
    })
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_default',
    })
    declare isDefault: boolean;

    @ApiProperty({
        example: 42,
        description: 'Количество пользователей с этим маппингом',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'mapped_users_count',
        validate: {
            isInt: true,
            min: 0,
        },
    })
    declare mappedUsersCount: number;

    @ApiProperty({
        example: '2025-12-07T12:00:00Z',
        description: 'Время последнего применения маппинга',
        required: false,
    })
    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'last_applied_at',
    })
    declare lastAppliedAt: Date | null;

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

    @BelongsTo(() => RoleModel, 'internal_role_id')
    declare internalRole?: RoleModel;

    @BelongsTo(() => TenantModel, 'tenant_id')
    declare tenant?: TenantModel;
}

