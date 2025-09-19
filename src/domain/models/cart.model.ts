import {
    BelongsToMany,
    Column,
    DataType,
    Model,
    Table,
} from 'sequelize-typescript';
import { ProductModel } from './product.model';
import { CartProductModel } from './cart-product.model';

interface ICart {
    id: number;
    products: ProductModel[];
}

@Table({
    tableName: 'cart',
    underscored: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
})
export class CartModel extends Model<CartModel> implements ICart {
    @Column({
        type: DataType.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @BelongsToMany(() => ProductModel, {
        through: () => CartProductModel,
        onDelete: 'CASCADE',
    })
    products!: ProductModel[];
}
