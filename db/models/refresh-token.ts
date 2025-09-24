import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { RefreshTokenModel, RefreshTokenCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class RefreshToken extends Model<RefreshTokenModel, RefreshTokenCreationAttributes> implements RefreshTokenModel {
    declare id: number;
    declare is_revoked: boolean;
    declare expires: Date;
    declare user_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: any): void {
      this.belongsTo(models.user, { 
        as: TABLE_NAMES.USER,
        foreignKey: 'user_id',
      });
    }
  }

  RefreshToken.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      is_revoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      expires: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      user_id: {
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
      modelName: TABLE_NAMES.REFRESH_TOKEN,
      tableName: TABLE_NAMES.REFRESH_TOKEN,
      timestamps: true,
      underscored: false,
    },
  );

  return RefreshToken;
};
