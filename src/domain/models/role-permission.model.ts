import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    CreatedAt,
    UpdatedAt,
} from 'sequelize-typescript';
import { RoleModel } from './role.model';
import { ApiProperty } from '@nestjs/swagger';

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
}

