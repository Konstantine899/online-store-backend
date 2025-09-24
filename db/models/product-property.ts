import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { ProductPropertyModel, ProductPropertyCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class ProductProperty extends Model<ProductPropertyModel, ProductPropertyCreationAttributes> implements ProductPropertyModel {
    declare id: number;
    declare name: string;
    declare value: string;
    declare product_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: any): void {
      this.belongsTo(models.product, { 
        as: TABLE_NAMES.PRODUCT,
        foreignKey: 'product_id',
      });
    }
  }

  ProductProperty.init(
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
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false,
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
      modelName: TABLE_NAMES.PRODUCT_PROPERTY,
      tableName: TABLE_NAMES.PRODUCT_PROPERTY,
      timestamps: true,
      underscored: true,
    },
  );

  return ProductProperty;
};
