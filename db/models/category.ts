import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { CategoryModel, CategoryCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class Category extends Model<CategoryModel, CategoryCreationAttributes> implements CategoryModel {
    declare id: number;
    declare name: string;
    declare image: string;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: any): void {
      this.hasMany(models.product, {
        as: TABLE_NAMES.PRODUCT,
        onDelete: 'RESTRICT',
      });
      this.hasMany(models.brand, {
        as: TABLE_NAMES.BRAND,
        onDelete: 'RESTRICT',
      });
    }
  }

  Category.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      image: {
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
      modelName: TABLE_NAMES.CATEGORY,
      tableName: TABLE_NAMES.CATEGORY,
      timestamps: true,
      underscored: false,
    },
  );

  return Category;
};
