import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { OrderModel, OrderCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class Order extends Model<OrderModel, OrderCreationAttributes> implements OrderModel {
    declare id: number;
    declare name: string;
    declare email: string;
    declare phone: string;
    declare address: string;
    declare amount: number;
    declare status: number;
    declare comment?: string;
    declare user_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: any): void {
      this.belongsTo(models.user, { 
        as: TABLE_NAMES.USER,
        foreignKey: 'user_id',
      });
      this.hasMany(models.item, {
        as: TABLE_NAMES.ORDER_ITEM,
        onDelete: 'CASCADE',
        foreignKey: 'order_id',
      });
    }
  }

  Order.init(
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
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      comment: {
        type: DataTypes.STRING(2200),
        allowNull: true,
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
      modelName: TABLE_NAMES.ORDER,
      tableName: TABLE_NAMES.ORDER,
      timestamps: true,
      underscored: true,
    },
  );

  return Order;
};
