import {
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { CartModel } from './cart.model';
import { ProductModel } from '../../modules/product/product.model';

interface ICartProductModel {
    quantity: number;
    cart_id: number;
    product_id: number;
}

@Table({
    tableName: 'cart-product',
    underscored: true,
})
export class CartProductModel
    extends Model<CartProductModel>
    implements ICartProductModel
{
    @Column({
        type: DataType.INTEGER,
        defaultValue: 1,
    })
    quantity: number;

    @ForeignKey(() => CartModel)
    @Column({ type: DataType.INTEGER })
    cart_id: number;

    @ForeignKey(() => ProductModel)
    @Column({ type: DataType.INTEGER })
    product_id: number;
}
