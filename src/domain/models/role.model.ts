import {
    BelongsToMany,
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
    CreatedAt,
    UpdatedAt,
} from 'sequelize-typescript';
import { UserModel } from './user.model';
import { UserRoleModel } from './user-role.model';
import { TenantModel } from './tenant.model';
import { ApiProperty } from '@nestjs/swagger';
import { Op } from 'sequelize';

interface IRoleModel {
    id: number;
    role: string;
    description: string;
    level: number;
    permissions: unknown[];
    isSystemRole: boolean;
    isActive: boolean;
    tenantId: number | null;
    users: UserModel[];
    tenant?: TenantModel;
    createdAt: Date;
    updatedAt: Date;
}

interface IRoleCreationAttributes {
    role: string;
    description: string;
    level?: number;
    permissions?: unknown[];
    isSystemRole?: boolean;
    isActive?: boolean;
    tenantId?: number | null;
}

@Table({
    tableName: 'roles',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
    scopes: {
        // Scope для поиска по роли
        byRole: (role: string) => ({
            where: { role },
        }),
        // Scope для поиска по описанию
        byDescription: (description: string) => ({
            where: {
                description: {
                    [Op.like]: `%${description}%`,
                },
            },
        }),
        // Scope для загрузки с пользователями
        withUsers: {
            include: [
                {
                    model: UserModel,
                    through: { attributes: [] },
                    attributes: ['id', 'email', 'name'],
                },
            ],
        },
        // Scope для активных ролей (с пользователями)
        active: {
            include: [
                {
                    model: UserModel,
                    through: { attributes: [] },
                    attributes: [],
                    required: true,
                },
            ],
        },
        // Scope для системных ролей
        systemRoles: {
            where: { isSystemRole: true },
        },
        // Scope для tenant-specific ролей
        tenantRoles: (tenantId: number) => ({
            where: { isSystemRole: false, tenantId },
        }),
        // Scope для ролей по уровню иерархии
        byLevel: (minLevel: number, maxLevel?: number) => ({
            where: maxLevel
                ? { level: { [Op.between]: [minLevel, maxLevel] } }
                : { level: { [Op.gte]: minLevel } },
        }),
    },
})
export class RoleModel
    extends Model<RoleModel, IRoleCreationAttributes>
    implements IRoleModel
{
    @ApiProperty({
        example: 1,
        description: 'Идентификатор роли',
    })
    @Column({
        type: DataType.INTEGER,
        unique: true,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @ApiProperty({
        example: 'USER',
        description: 'Роль',
    })
    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false,
    })
    role!: string;

    @ApiProperty({
        example: 'Пользователь',
        description: 'Описание роли',
    })
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    description!: string;

    @ApiProperty({
        example: 50,
        description: 'Уровень иерархии роли (0-100, где 100 - SUPER_ADMIN)',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    level!: number;

    @ApiProperty({
        example: [],
        description: 'Массив разрешений роли (resources, actions)',
    })
    @Column({
        type: DataType.JSON,
        allowNull: true,
        defaultValue: null,
    })
    permissions!: unknown[];

    @ApiProperty({
        example: false,
        description: 'Системная роль (true) или tenant-specific роль (false)',
    })
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_system_role',
    })
    isSystemRole!: boolean;

    @ApiProperty({
        example: true,
        description: 'Активна ли роль',
    })
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
    })
    isActive!: boolean;

    @ApiProperty({
        example: 1,
        description:
            'ID тенанта (NULL для системных ролей, NOT NULL для tenant-specific)',
    })
    @ForeignKey(() => TenantModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        field: 'tenant_id',
    })
    tenantId!: number | null;

    // Связь с тенантом (для tenant-specific ролей)
    @BelongsTo(() => TenantModel)
    tenant?: TenantModel;

    // Многие ко многим через промежуточную таблицу UserRoleModel
    @BelongsToMany(() => UserModel, () => UserRoleModel)
    users!: UserModel[];

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
}
