import type { Sequelize } from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import type { UserRoleModel, UserRoleCreationAttributes } from './types';

class UserRole
    extends Model<UserRoleModel, UserRoleCreationAttributes>
    implements UserRoleModel
{
    declare id: number;
    declare roleId: number;
    declare userId: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(): void {
        // UserRole is a junction table, associations are handled by the main models
    }
}

export default function defineUserRole(sequelize: Sequelize): typeof UserRole {
    UserRole.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            roleId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: 'role_id',
                references: {
                    model: TABLE_NAMES.ROLE,
                    key: 'id',
                } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: 'user_id',
                references: {
                    model: TABLE_NAMES.USER,
                    key: 'id',
                } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                field: 'created_at',
                defaultValue: DataTypes.NOW,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                field: 'updated_at',
                defaultValue: DataTypes.NOW,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        {
            sequelize,
            modelName: TABLE_NAMES.USER_ROLE,
            tableName: 'user_role',
            timestamps: true,
            underscored: false,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return UserRole;
}
