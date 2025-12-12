import { canManageRole } from '@app/infrastructure/controllers/role/role-constants';
import { ApiProperty } from '@nestjs/swagger';
import { Op } from 'sequelize';
import {
    BelongsTo,
    BelongsToMany,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    Model,
    Table,
    UpdatedAt,
} from 'sequelize-typescript';
import { TenantModel } from './tenant.model';
import { UserRoleModel } from './user-role.model';
import { UserModel } from './user.model';

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
    indexes: [
        // Уникальный индекс для role уже создается автоматически через unique: true
        // Индекс для быстрого поиска системных ролей
        {
            name: 'idx_roles_is_system_role',
            fields: ['is_system_role'],
        },
        // Составной индекс для поиска системных/tenant ролей
        {
            name: 'idx_roles_tenant_id_is_system_role',
            fields: ['tenant_id', 'is_system_role'],
        },
    ],
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
    declare role: string;

    @ApiProperty({
        example: 'Пользователь',
        description: 'Описание роли',
    })
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare description: string;

    @ApiProperty({
        example: 50,
        description: 'Уровень иерархии роли (0-100, где 100 - SUPER_ADMIN)',
    })
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    declare level: number;

    @ApiProperty({
        example: [],
        description: 'Массив разрешений роли (resources, actions)',
    })
    @Column({
        type: DataType.JSON,
        allowNull: true,
        defaultValue: null,
    })
    declare permissions: unknown[];

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
    declare isSystemRole: boolean;

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
    declare isActive: boolean;

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
    declare tenantId: number | null;

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

    // ============================================================================
    // INSTANCE METHODS: Методы работы с иерархией и разрешениями
    // ============================================================================

    /**
     * Проверить наличие разрешения у роли
     * @param resource - Название ресурса (users, products, orders)
     * @param action - Действие (create, read, update, delete)
     * @returns true если роль имеет указанное разрешение
     *
     * @example
     * const role = await RoleModel.findByPk(1);
     * if (role.hasPermission('products', 'create')) {
     *   // Разрешено создание продуктов
     * }
     */
    public hasPermission(resource: string, action: string): boolean {
        if (!this.permissions || !Array.isArray(this.permissions)) {
            return false;
        }

        return this.permissions.some(
            (permission: unknown) =>
                typeof permission === 'object' &&
                permission !== null &&
                'resource' in permission &&
                'action' in permission &&
                (permission as { resource: string; action: string })
                    .resource === resource &&
                (permission as { resource: string; action: string }).action ===
                    action,
        );
    }

    /**
     * Проверить, может ли роль получить доступ к указанному уровню иерархии
     * @param targetLevel - Целевой уровень (0-100)
     * @returns true если роль может получить доступ (уровень роли >= целевого)
     *
     * @example
     * const adminRole = await RoleModel.findOne({ where: { role: 'TENANT_ADMIN' } });
     * if (adminRole.canAccessLevel(50)) {
     *   // TENANT_ADMIN (level 60) может управлять MANAGER (level 50)
     * }
     */
    public canAccessLevel(targetLevel: number): boolean {
        return this.level >= targetLevel;
    }

    /**
     * Проверить, может ли роль управлять другой ролью
     * @param targetRole - Целевая роль для управления
     * @returns true если роль может управлять целевой ролью
     *
     * @example
     * const adminRole = await RoleModel.findOne({ where: { role: 'TENANT_ADMIN' } });
     * const managerRole = await RoleModel.findOne({ where: { role: 'MANAGER' } });
     * if (adminRole.canManage(managerRole)) {
     *   // TENANT_ADMIN может управлять MANAGER
     * }
     */
    public canManage(targetRole: RoleModel): boolean {
        return canManageRole(this.role, targetRole.role);
    }

    /**
     * Проверить, является ли роль неактивной (истекшей)
     * @returns true если роль неактивна
     *
     * @example
     * const role = await RoleModel.findByPk(1);
     * if (role.isExpired()) {
     *   // Роль неактивна
     * }
     */
    public isExpired(): boolean {
        return !this.isActive;
    }

    /**
     * Получить все эффективные разрешения роли
     * @returns Массив разрешений с типизацией
     *
     * @example
     * const role = await RoleModel.findByPk(1);
     * const permissions = role.getEffectivePermissions();
     * // [{ resource: 'products', action: 'create' }, ...]
     */
    public getEffectivePermissions(): Array<{
        resource: string;
        action: string;
    }> {
        if (!this.permissions || !Array.isArray(this.permissions)) {
            return [];
        }

        return this.permissions
            .filter(
                (permission: unknown) =>
                    typeof permission === 'object' &&
                    permission !== null &&
                    'resource' in permission &&
                    'action' in permission &&
                    typeof (permission as { resource: unknown }).resource ===
                        'string' &&
                    typeof (permission as { action: unknown }).action ===
                        'string',
            )
            .map(
                (permission) =>
                    permission as { resource: string; action: string },
            );
    }

    // ============================================================================
    // STATIC METHODS: Утилитарные функции для работы с ролями
    // ============================================================================

    /**
     * Сравнить две роли по уровню иерархии
     * @param role1 - Первая роль
     * @param role2 - Вторая роль
     * @returns -1 если role1 < role2, 0 если равны, 1 если role1 > role2
     *
     * @example
     * const comparison = RoleModel.compareHierarchy(adminRole, managerRole);
     * if (comparison > 0) {
     *   // adminRole выше в иерархии
     * }
     */
    public static compareHierarchy(role1: RoleModel, role2: RoleModel): number {
        if (role1.level < role2.level) {
            return -1;
        } else if (role1.level > role2.level) {
            return 1;
        }
        return 0;
    }

    /**
     * Получить роль с максимальным уровнем из массива ролей
     * @param roles - Массив ролей
     * @returns Роль с максимальным уровнем или null если массив пустой
     *
     * @example
     * const userRoles = [adminRole, managerRole, customerRole];
     * const highestRole = RoleModel.getHighestRole(userRoles);
     * // Вернёт adminRole (level 60)
     */
    public static getHighestRole(roles: RoleModel[]): RoleModel | null {
        if (!roles || roles.length === 0) {
            return null;
        }

        return roles.reduce((highest, current) => {
            return current.level > highest.level ? current : highest;
        });
    }
}
