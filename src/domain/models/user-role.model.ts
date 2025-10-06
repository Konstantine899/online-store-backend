import {
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    CreatedAt,
    UpdatedAt,
} from 'sequelize-typescript';
import { UserModel } from './user.model';
import { RoleModel } from './role.model';

interface IUserRoleModel {
    id: number;
    roleId: number;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
}

interface IUserRoleCreationAttributes {
    roleId: number;
    userId: number;
}

@Table({
    tableName: 'user_role',
    timestamps: true,
})
export class UserRoleModel
    extends Model<IUserRoleModel, IUserRoleCreationAttributes>
    implements IUserRoleModel
{
    @PrimaryKey
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        allowNull: false,
    })
    declare id: number;

    @ForeignKey(() => RoleModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'role_id',
    })
    roleId!: number;

    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        field: 'user_id',
    })
    userId!: number;

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
