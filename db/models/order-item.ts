import {
    Model,
    DataTypes,
    Sequelize,
    ModelStatic,
    ModelAttributes,
    Optional,
} from 'sequelize';
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

    static associate(models: {
        order: ModelStatic<
            Model<Record<string, unknown>, Record<string, unknown>>
        >;
    }): void {
        this.belongsTo(models.order, {
            as: TABLE_NAMES.ORDER,
            foreignKey: 'order_id',
        });
    }
}

export default function defineOrderItem(
    sequelize: Sequelize,
): typeof OrderItem {
    const attributes = {
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
    };

    OrderItem.init(
        attributes as unknown as ModelAttributes<
            OrderItem,
            Optional<OrderItemModel, never>
        >,
        {
            sequelize,
            modelName: TABLE_NAMES.ORDER_ITEM,
            tableName: TABLE_NAMES.ORDER_ITEM,
            timestamps: true,
            underscored: true,
        },
    );

    return OrderItem;
}
