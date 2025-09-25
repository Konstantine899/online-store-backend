import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { OrderItemModel, OrderItemCreationAttributes } from './types';

class OrderItem
    extends Model<OrderItemModel, OrderItemCreationAttributes>
    implements OrderItemModel
{
    declare id: number;
    declare name: string;
    declare price: number;
    declare quantity: number;
    declare order_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: Record<string, any>): void {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        this.belongsTo(models.order, {
            as: TABLE_NAMES.ORDER,
            foreignKey: 'order_id',
        });
    }
}

export default function defineOrderItem(
    sequelize: Sequelize,
): typeof OrderItem {
    OrderItem.init(
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
            price: {
                type: DataTypes.FLOAT,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            order_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: TABLE_NAMES.ORDER,
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
            modelName: TABLE_NAMES.ORDER_ITEM,
            tableName: TABLE_NAMES.ORDER_ITEM,
            timestamps: true,
            underscored: true,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return OrderItem;
}
