import type { Sequelize } from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import type { CartProductModel, CartProductCreationAttributes } from './types';

class CartProduct
    extends Model<CartProductModel, CartProductCreationAttributes>
    implements CartProductModel
{
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

export default function defineCartProduct(
    sequelize: Sequelize,
): typeof CartProduct {
    CartProduct.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            cart_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: TABLE_NAMES.CART,
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: TABLE_NAMES.PRODUCT,
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
            modelName: TABLE_NAMES.CART_PRODUCT,
            tableName: 'cart-product',
            timestamps: true,
            underscored: true,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return CartProduct;
}
