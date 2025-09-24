import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { CartProductModel, CartProductCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class CartProduct extends Model<CartProductModel, CartProductCreationAttributes> implements CartProductModel {
    declare id: number;
    declare quantity: number;
    declare cart_id: number;
    declare product_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(): void {
      // CartProduct is a junction table, associations are handled by the main models
    }
  }

  CartProduct.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      cart_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLE_NAMES.CART,
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
      modelName: TABLE_NAMES.CART_PRODUCT,
      tableName: TABLE_NAMES.CART_PRODUCT,
      timestamps: true,
      underscored: true,
    },
  );

  return CartProduct;
};
