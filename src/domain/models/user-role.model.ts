import { ApiProperty } from '@nestjs/swagger';
import { Op } from 'sequelize';
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
import { TenantModel } from './tenant.model';
import { UserModel } from './user.model';

interface IUserRoleModel {
    id: number;
    userId: number;
    roleId: number;
    tenantId: number;
    grantedBy: number | null;
    grantedAt: Date;
    expiresAt: Date | null;
    isActive: boolean;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

interface IUserRoleCreationAttributes {
    userId: number;
    roleId: number;
    tenantId: number;
    grantedBy?: number | null;
    grantedAt?: Date;
    expiresAt?: Date | null;
    isActive?: boolean;
    metadata?: Record<string, unknown>;
}

@Table({
    tableName: 'user_roles',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['createdAt', 'updatedAt'] },
    },
    scopes: {
        // Scope для активных назначений ролей
        active: {
            where: { isActive: true },
        },
        // Scope для истекших назначений ролей
        expired: {
            where: {
                expiresAt: {
                    [Op.lt]: new Date(),
                },
            },
        },
        // Scope для валидных назначений (активные + не истекшие)
        valid: {
            where: {
                isActive: true,
                [Op.or]: [
                    { expiresAt: null },
                    { expiresAt: { [Op.gte]: new Date() } },
                ],
            },
        },
        // Scope для поиска по пользователю
        byUser: (userId: number) => ({
            where: { userId },
        }),
        // Scope для поиска по роли
        byRole: (roleId: number) => ({
            where: { roleId },
        }),
        // Scope для поиска по тенанту
        byTenant: (tenantId: number) => ({
            where: { tenantId },
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
        // Scope для загрузки с пользователями
        withUsers: {
            include: [
                {
                    model: UserModel,
                    as: 'user',
                    attributes: ['id', 'email', 'firstName', 'lastName'],
                },
                {
                    model: UserModel,
                    as: 'grantedByUser',
                    attributes: ['id', 'email', 'firstName', 'lastName'],
                },
            ],
        },
    },
})
export class UserRoleModel
    extends Model<IUserRoleModel, IUserRoleCreationAttributes>
    implements IUserRoleModel
{
    @ApiProperty({
        example: 1,
        description: 'Уникальный идентификатор назначения роли',
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
        description: 'ID пользователя',
    })
    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'user_id',
    })
    userId!: number;

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
        example: 1,
        description: 'ID тенанта',
    })
    @ForeignKey(() => TenantModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'tenant_id',
    })
    tenantId!: number;

    @ApiProperty({
        example: 2,
        description:
            'ID пользователя, который назначил роль (NULL если системное назначение)',
    })
    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        field: 'granted_by',
    })
    grantedBy!: number | null;

    @ApiProperty({
        example: '2024-11-21T14:00:00Z',
        description: 'Дата и время назначения роли',
    })
    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: 'granted_at',
    })
    grantedAt!: Date;

    @ApiProperty({
        example: null,
        description: 'Дата и время истечения роли (NULL если бессрочная)',
    })
    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'expires_at',
    })
    expiresAt!: Date | null;

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
        example: {},
        description: 'Дополнительные метаданные назначения роли',
    })
    @Column({
        type: DataType.JSON,
        allowNull: true,
        defaultValue: null,
    })
    metadata!: Record<string, unknown>;

    // Связи
    @BelongsTo(() => UserModel, 'user_id')
    user?: UserModel;

    @BelongsTo(() => RoleModel, 'role_id')
    role?: RoleModel;

    @BelongsTo(() => TenantModel, 'tenant_id')
    tenant?: TenantModel;

    @BelongsTo(() => UserModel, 'granted_by')
    grantedByUser?: UserModel;

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
    // INSTANCE METHODS: Методы проверки истечения и валидности ролей
    // ============================================================================

    /**
     * Проверить, истекла ли временная роль
     * @returns true если роль истекла (expiresAt прошло)
     *
     * @example
     * const userRole = await UserRoleModel.findByPk(1);
     * if (userRole.isExpired()) {
     *   // Роль истекла, необходимо деактивировать
     * }
     */
    public isExpired(): boolean {
        if (this.expiresAt === null || this.expiresAt === undefined) {
            return false; // Бессрочная роль не истекает
        }

        return this.expiresAt < new Date();
    }

    /**
     * Комплексная проверка валидности назначения роли
     * @returns true если роль активна и не истекла
     *
     * @example
     * const userRole = await UserRoleModel.findByPk(1);
     * if (userRole.isValid()) {
     *   // Роль можно использовать для авторизации
     * }
     */
    public isValid(): boolean {
        return this.isActive && !this.isExpired();
    }

    /**
     * Получить оставшееся время до истечения роли (в миллисекундах)
     * @returns Время в миллисекундах или null если роль бессрочная
     *
     * @example
     * const userRole = await UserRoleModel.findByPk(1);
     * const remaining = userRole.getRemainingTime();
     * if (remaining && remaining < 86400000) {
     *   // Роль истекает через менее чем 24 часа
     *   await sendExpirationNotification(userRole);
     * }
     */
    public getRemainingTime(): number | null {
        if (this.expiresAt === null || this.expiresAt === undefined) {
            return null; // Бессрочная роль
        }

        const remaining = this.expiresAt.getTime() - Date.now();
        return remaining > 0 ? remaining : 0; // Не возвращаем отрицательные значения
    }

    /**
     * Рассчитать новую дату истечения при продлении роли
     * @param duration - Длительность продления в миллисекундах
     * @returns Новая дата истечения или null если роль бессрочная
     *
     * @example
     * const userRole = await UserRoleModel.findByPk(1);
     * const newExpiry = userRole.extend(30 * 24 * 60 * 60 * 1000); // +30 дней
     * if (newExpiry) {
     *   userRole.expiresAt = newExpiry;
     *   await userRole.save();
     * }
     */
    public extend(duration: number): Date | null {
        if (this.expiresAt === null || this.expiresAt === undefined) {
            return null; // Бессрочная роль не продлевается
        }

        return new Date(this.expiresAt.getTime() + duration);
    }
}
