import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { OrderModel, OrderCreationAttributes } from './types';

class Order
    extends Model<OrderModel, OrderCreationAttributes>
    implements OrderModel
{
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static associate(models: Record<string, any>): void {
        this.belongsTo(models.user, {
            as: TABLE_NAMES.USER,
            foreignKey: 'user_id',
        });
        this.hasMany(models.order_item, {
            as: TABLE_NAMES.ORDER_ITEM,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            foreignKey: 'order_id',
        });
    }
}

export default function defineOrder(sequelize: Sequelize): typeof Order {
    Order.init(
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
            email: {
                type: DataTypes.STRING,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            phone: {
                type: DataTypes.STRING,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            address: {
                type: DataTypes.STRING,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            comment: {
                type: DataTypes.STRING(2200),
                allowNull: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: TABLE_NAMES.USER,
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        {
            sequelize,
            modelName: TABLE_NAMES.ORDER,
            tableName: 'order',
            timestamps: true,
            underscored: true,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return Order;
}
