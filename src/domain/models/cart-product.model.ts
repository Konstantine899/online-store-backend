import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    CreatedAt,
    UpdatedAt,
} from 'sequelize-typescript';
import { CartModel } from './cart.model';
import { ProductModel } from './product.model';

interface ICartProductModel {
    id: number;
    quantity: number;
    cart_id: number;
    product_id: number;
    cart: CartModel;
    product: ProductModel;
    createdAt: Date;
    updatedAt: Date;
}

interface ICartProductCreationAttributes {
    quantity: number;
    cart_id: number;
    product_id: number;
}

@Table({
    tableName: 'cart-product',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
    // Базовые scopes
    scopes: {
        // Scope для фильтрации по корзине
        byCart: (cartId: number) => ({
            where: { cart_id: cartId },
        }),
        // Scope для загрузки с продуктом
        withProduct: {
            include: [
                {
                    model: ProductModel,
                    attributes: ['id', 'name', 'price', 'image'],
                },
            ],
        },
    },
})
export class CartProductModel extends Model<
    ICartProductModel,
    ICartProductCreationAttributes
> {
    @PrimaryKey
    @Column({
        type: DataType.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1,
    })
    quantity!: number;

    @ForeignKey(() => CartModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    cart_id!: number;

    @ForeignKey(() => ProductModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    })
    product_id!: number;

    @BelongsTo(() => CartModel)
    cart!: CartModel;

    // НОВОЕ ПОЛЕ - ассоциация с продуктом
    @BelongsTo(() => ProductModel)
    product!: ProductModel;

    @CreatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'created_at',
    })
    declare createdAt: Date;

    @UpdatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        field: 'updated_at',
    })
    declare updatedAt: Date;
}
