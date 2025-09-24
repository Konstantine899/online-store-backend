import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { RatingModel, RatingCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class Rating extends Model<RatingModel, RatingCreationAttributes> implements RatingModel {
    declare id: number;
    declare rating: number;
    declare user_id: number;
    declare product_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(): void {
      // Rating is a junction table, associations are handled by the main models
    }
  }

  Rating.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
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
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLE_NAMES.PRODUCT,
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
      modelName: TABLE_NAMES.RATING,
      tableName: TABLE_NAMES.RATING,
      timestamps: true,
      underscored: false,
    },
  );

  return Rating;
};
