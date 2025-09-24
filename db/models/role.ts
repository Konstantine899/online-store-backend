import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { RoleModel, RoleCreationAttributes } from './types';

class Role extends Model<RoleModel, RoleCreationAttributes> implements RoleModel {
    declare id: number;
    declare role: string;
    declare description: string;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: Record<string, any>): void { // eslint-disable-line @typescript-eslint/no-explicit-any
      this.belongsToMany(models.user, {
        through: TABLE_NAMES.USER_ROLE,
        as: TABLE_NAMES.USER,
      });
    }
}

export default function defineRole(sequelize: Sequelize): typeof Role {
  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    {
      sequelize,
      modelName: TABLE_NAMES.ROLE,
      tableName: TABLE_NAMES.ROLE,
      timestamps: true,
      underscored: false,
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  return Role;
}
