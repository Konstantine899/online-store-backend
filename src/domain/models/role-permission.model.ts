import { ApiProperty } from '@nestjs/swagger';
import {
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt,
} from 'sequelize-typescript';
import { RoleModel } from './role.model';

interface IRolePermissionModel {
    id: number;
    roleId: number;
    resource: string;
    action: string;
    conditions: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

interface IRolePermissionCreationAttributes {
    roleId: number;
    resource: string;
    action: string;
    conditions?: Record<string, unknown>;
}

@Table({
    tableName: 'role_permissions',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['createdAt', 'updatedAt'] },
    },
    scopes: {
        // Scope для поиска по роли
        byRole: (roleId: number) => ({
            where: { roleId },
        }),
        // Scope для поиска по ресурсу
        byResource: (resource: string) => ({
            where: { resource },
        }),
        // Scope для поиска по действию
        byAction: (action: string) => ({
            where: { action },
        }),
        // Scope для поиска по ресурсу и действию
        byResourceAndAction: (resource: string, action: string) => ({
            where: { resource, action },
        }),
        // Scope для загрузки с ролью
        withRole: {
            include: [
                {
                    model: RoleModel,
                    attributes: ['id', 'role', 'description', 'level'],
                },
            ],
        },
    },
})
export class RolePermissionModel
    extends Model<IRolePermissionModel, IRolePermissionCreationAttributes>
    implements IRolePermissionModel
{
    @ApiProperty({
        example: 1,
        description: 'Уникальный идентификатор разрешения',
    })
    @PrimaryKey
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @ApiProperty({
        example: 1,
        description: 'ID роли',
    })
    @ForeignKey(() => RoleModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'role_id',
    })
    roleId!: number;

    @ApiProperty({
        example: 'products',
        description: 'Название ресурса (users, products, orders, catalog)',
    })
    @Column({
        type: DataType.STRING(100),
        allowNull: false,
    })
    resource!: string;

    @ApiProperty({
        example: 'create',
        description:
            'Действие над ресурсом (create, read, update, delete, list, manage)',
    })
    @Column({
        type: DataType.STRING(50),
        allowNull: false,
    })
    action!: string;

    @ApiProperty({
        example: { status: 'active' },
        description: 'Условия применения разрешения (JSON объект)',
    })
    @Column({
        type: DataType.JSON,
        allowNull: true,
        defaultValue: null,
    })
    conditions!: Record<string, unknown>;

    // Связь с ролью
    @BelongsTo(() => RoleModel)
    role?: RoleModel;

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
    // INSTANCE METHODS: Методы проверки разрешений
    // ============================================================================

    /**
     * Проверить соответствие разрешения указанным resource/action
     * @param resource - Название ресурса для проверки
     * @param action - Действие для проверки
     * @returns true если разрешение соответствует указанным параметрам
     *
     * @example
     * const permission = await RolePermissionModel.findByPk(1);
     * if (permission.matches('products', 'create')) {
     *   // Разрешение на создание продуктов
     * }
     */
    public matches(resource: string, action: string): boolean {
        return this.resource === resource && this.action === action;
    }

    /**
     * Проверить условия применения разрешения на основе контекста
     * @param context - Контекст для проверки (объект с параметрами)
     * @returns true если условия выполнены или условий нет
     *
     * @example
     * const permission = await RolePermissionModel.findByPk(1);
     * // permission.conditions = { status: 'active', tenantId: 1 }
     * if (permission.evaluateConditions({ status: 'active', tenantId: 1 })) {
     *   // Условия выполнены
     * }
     */
    public evaluateConditions(context: Record<string, unknown>): boolean {
        // Если условий нет, разрешение применяется всегда
        if (
            !this.conditions ||
            typeof this.conditions !== 'object' ||
            Object.keys(this.conditions).length === 0
        ) {
            return true;
        }

        // Проверяем все условия из this.conditions
        return Object.entries(this.conditions).every(([key, value]) => {
            // Если ключ отсутствует в контексте, условие не выполнено
            if (!(key in context)) {
                return false;
            }

            // Простое сравнение значений
            // В будущем можно расширить операторами ($eq, $ne, $in, $gt, $lt)
            return context[key] === value;
        });
    }

    /**
     * Проверить, является ли разрешение широким (wildcard)
     * @returns true если resource или action равны '*'
     *
     * @example
     * const permission = await RolePermissionModel.findByPk(1);
     * // permission.action = '*'
     * if (permission.isWildcard()) {
     *   // Разрешение применяется ко всем действиям
     * }
     */
    public isWildcard(): boolean {
        return this.resource === '*' || this.action === '*';
    }
}
