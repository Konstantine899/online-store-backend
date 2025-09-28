import {
    BelongsToMany,
    Column,
    DataType,
    Model,
    Table,
    CreatedAt,
    UpdatedAt,  
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { ProductModel } from './product.model';
import { CartProductModel } from './cart-product.model';

interface ICartModel {
    id: number;
    products: ProductModel[];
    createdAt: Date; 
    updatedAt: Date; 
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ICartCreationAttributes {
    // Пустой интерфейс - корзина создается без дополнительных полей
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
            include: [{
                model: ProductModel,
                through: { attributes: ['quantity', 'created_at'] },
                attributes: ['id', 'name', 'price', 'image', 'slug'],
            }],
        },
        // Scope для активных корзин (с продуктами)
        active: {
            include: [{
                model: ProductModel,
                through: { attributes: [] },
                attributes: [],
                required: true,
            }],
        },
        // Scope для корзин с количеством продуктов
        withProductCount: {
            include: [{
                model: ProductModel,
                through: { attributes: [] },
                attributes: [],
            }],
            attributes: {
                include: [
                    ['COUNT(products.id)', 'productsCount'],
                ],
            },
            group: ['CartModel.id'],
        },
        // Scope для недавних корзин
        recent: (days: number = 7) => ({
            where: {
                created_at: {
                    [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                },
            },
        }),
    },
})
export class CartModel extends Model<CartModel, ICartCreationAttributes> implements ICartModel {
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
