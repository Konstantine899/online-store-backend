import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { CartModel, CartCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class Cart extends Model<CartModel, CartCreationAttributes> implements CartModel {
    declare id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: any): void {
      this.belongsToMany(models.product, {
        through: TABLE_NAMES.CART_PRODUCT,
        as: TABLE_NAMES.PRODUCT,
        onDelete: 'CASCADE',
      });
    }
  }

  Cart.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      modelName: TABLE_NAMES.CART,
      tableName: TABLE_NAMES.CART,
      timestamps: true,
      underscored: false,
    },
  );

  return Cart;
};
