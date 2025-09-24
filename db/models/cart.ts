import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { CartModel, CartCreationAttributes } from './types';

class Cart extends Model<CartModel, CartCreationAttributes> implements CartModel {
    declare id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: Record<string, any>): void { // eslint-disable-line @typescript-eslint/no-explicit-any
      this.belongsToMany(models.product, {
        through: TABLE_NAMES.CART_PRODUCT,
        as: TABLE_NAMES.PRODUCT,
        onDelete: 'CASCADE',
      });
    }
}

export default function defineCart(sequelize: Sequelize): typeof Cart {
  Cart.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
      modelName: TABLE_NAMES.CART,
      tableName: TABLE_NAMES.CART,
      timestamps: true,
      underscored: false,
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  return Cart;
}
