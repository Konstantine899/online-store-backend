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
}
