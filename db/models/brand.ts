import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { BrandModel, BrandCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class Brand extends Model<BrandModel, BrandCreationAttributes> implements BrandModel {
    declare id: number;
    declare name: string;
    declare category_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: any): void {
      this.hasMany(models.product, {
        as: TABLE_NAMES.PRODUCT,
        onDelete: 'RESTRICT',
      });
      this.belongsTo(models.category, { 
        as: TABLE_NAMES.CATEGORY,
        foreignKey: 'category_id',
      });
    }
  }

  Brand.init(
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
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLE_NAMES.CATEGORY,
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
      modelName: TABLE_NAMES.BRAND,
      tableName: TABLE_NAMES.BRAND,
      timestamps: true,
      underscored: false,
    },
  );

  return Brand;
};
