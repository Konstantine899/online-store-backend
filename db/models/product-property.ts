import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { ProductPropertyModel, ProductPropertyCreationAttributes } from './types';

class ProductProperty extends Model<ProductPropertyModel, ProductPropertyCreationAttributes> implements ProductPropertyModel {
    declare id: number;
    declare name: string;
    declare value: string;
    declare product_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: Record<string, any>): void { // eslint-disable-line @typescript-eslint/no-explicit-any
      this.belongsTo(models.product, { 
        as: TABLE_NAMES.PRODUCT,
        foreignKey: 'product_id',
      });
    }
}

export default function defineProductProperty(sequelize: Sequelize): typeof ProductProperty {
  ProductProperty.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      value: {
        type: DataTypes.STRING,
        allowNull: false,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLE_NAMES.PRODUCT,
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
      modelName: TABLE_NAMES.PRODUCT_PROPERTY,
      tableName: TABLE_NAMES.PRODUCT_PROPERTY,
      timestamps: true,
      underscored: true,
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  return ProductProperty;
}
