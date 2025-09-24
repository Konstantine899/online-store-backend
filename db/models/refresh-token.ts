import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { RefreshTokenModel, RefreshTokenCreationAttributes } from './types';

class RefreshToken extends Model<RefreshTokenModel, RefreshTokenCreationAttributes> implements RefreshTokenModel {
    declare id: number;
    declare is_revoked: boolean;
    declare expires: Date;
    declare user_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: Record<string, any>): void { // eslint-disable-line @typescript-eslint/no-explicit-any
      this.belongsTo(models.user, { 
        as: TABLE_NAMES.USER,
        foreignKey: 'user_id',
      });
    }
}

export default function defineRefreshToken(sequelize: Sequelize): typeof RefreshToken {
  RefreshToken.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      is_revoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      expires: {
        type: DataTypes.DATE,
        allowNull: false,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLE_NAMES.USER,
          key: 'id',
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
      modelName: TABLE_NAMES.REFRESH_TOKEN,
      tableName: TABLE_NAMES.REFRESH_TOKEN,
      timestamps: true,
      underscored: false,
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  return RefreshToken;
}
