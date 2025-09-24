import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { UserRoleModel, UserRoleCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class UserRole extends Model<UserRoleModel, UserRoleCreationAttributes> implements UserRoleModel {
    declare id: number;
    declare roleId: number;
    declare userId: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(): void {
      // UserRole is a junction table, associations are handled by the main models
    }
  }

  UserRole.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLE_NAMES.ROLE,
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLE_NAMES.USER,
          key: 'id',
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: TABLE_NAMES.USER_ROLE,
      tableName: TABLE_NAMES.USER_ROLE,
      timestamps: true,
      underscored: false,
    },
  );

  return UserRole;
};
