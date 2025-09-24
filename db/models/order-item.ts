import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { OrderItemModel, OrderItemCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class OrderItem extends Model<OrderItemModel, OrderItemCreationAttributes> implements OrderItemModel {
    declare id: number;
    declare name: string;
    declare price: number;
    declare quantity: number;
    declare order_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: any): void {
      this.belongsTo(models.order, { 
        as: TABLE_NAMES.ORDER,
        foreignKey: 'order_id',
      });
    }
  }

  OrderItem.init(
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
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLE_NAMES.ORDER,
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
      modelName: TABLE_NAMES.ORDER_ITEM,
      tableName: TABLE_NAMES.ORDER_ITEM,
      timestamps: true,
      underscored: true,
    },
  );

  return OrderItem;
};
