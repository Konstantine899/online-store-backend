import {
    BelongsTo,
    BelongsToMany,
    Column,
    CreatedAt,
    DataType,
    ForeignKey,
    Model,
    Table,
    UpdatedAt,
} from 'sequelize-typescript';
import { CartProductModel } from './cart-product.model';
import { ProductModel } from './product.model';
import { UserModel } from './user.model';

interface ICartModel {
    id: number;
    tenant_id: number;
    user_id?: number;
    session_id?: string;
    status: string;
    expired_at?: Date;
    promo_code?: string;
    discount: number;
    total_amount: number;
    products: ProductModel[];
    user?: UserModel;
    createdAt: Date;
    updatedAt: Date;
}

interface ICartCreationAttributes {
    tenant_id?: number;
    user_id?: number;
    session_id?: string;
    status?: string;
    expired_at?: Date;
    promo_code?: string;
    discount?: number;
    total_amount?: number;
}

@Table({
    tableName: 'cart',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
    scopes: {
        // Scope для загрузки корзины с продуктами
        withProducts: {
            include: [
                {
                    model: ProductModel,
                    through: { attributes: ['quantity'] },
                    attributes: ['id', 'name', 'price', 'image'],
                },
            ],
        },
    },
})
export class CartModel
    extends Model<CartModel, ICartCreationAttributes>
    implements ICartModel
{
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
        comment: 'Tenant ID for multi-tenant isolation',
    })
    tenant_id!: number;

    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        comment: 'User ID for authenticated users cart',
    })
    user_id?: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
        comment: 'Session ID for guest carts',
    })
    session_id?: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
        defaultValue: 'active',
        comment: 'Cart status: active, abandoned, converted, expired',
    })
    status!: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        comment: 'Cart expiration timestamp (30 days inactive)',
    })
    expired_at?: Date;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
        comment: 'Applied promo code',
    })
    promo_code?: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Discount amount from promo code',
    })
    discount!: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total cart amount (including discount)',
    })
    total_amount!: number;

    @BelongsTo(() => UserModel)
    user?: UserModel;

    @BelongsToMany(() => ProductModel, {
        through: () => CartProductModel,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    products!: ProductModel[];

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
