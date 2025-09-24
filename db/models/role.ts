import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { RoleModel, RoleCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class Role extends Model<RoleModel, RoleCreationAttributes> implements RoleModel {
    declare id: number;
    declare role: string;
    declare description: string;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: any): void {
      this.belongsToMany(models.user, {
        through: TABLE_NAMES.USER_ROLE,
        as: TABLE_NAMES.USER,
      });
    }
  }

  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
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
      modelName: TABLE_NAMES.ROLE,
      tableName: TABLE_NAMES.ROLE,
      timestamps: true,
      underscored: false,
    },
  );

  return Role;
};
