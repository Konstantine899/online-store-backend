import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { UserModel, UserCreationAttributes } from './types';

class User extends Model<UserModel, UserCreationAttributes> implements UserModel {
  declare id: number;
  declare email: string;
  declare password: string;
  declare created_at: Date;
  declare updated_at: Date;

  static associate(models: Record<string, any>): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    this.hasMany(models.refreshToken, {
      as: TABLE_NAMES.REFRESH_TOKEN,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    this.hasMany(models.order, {
      as: TABLE_NAMES.ORDER,
      onDelete: 'SET NULL',
    });
    this.belongsToMany(models.role, {
      through: TABLE_NAMES.USER_ROLE,
      as: TABLE_NAMES.ROLE,
    });
    this.belongsToMany(models.product, {
      through: TABLE_NAMES.RATING,
      as: TABLE_NAMES.PRODUCT,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
}

export default function defineUser(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      password: {
        type: DataTypes.STRING,
        allowNull: true,
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
      modelName: TABLE_NAMES.USER,
      tableName: TABLE_NAMES.USER,
      timestamps: true,
      underscored: false,
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  return User;
}
