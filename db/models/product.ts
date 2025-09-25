import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { ProductModel, ProductCreationAttributes } from './types';

class Product
    extends Model<ProductModel, ProductCreationAttributes>
    implements ProductModel
{
    declare id: number;
    declare name: string;
    declare price: number;
    declare rating: number;
    declare image: string;
    declare category_id: number;
    declare brand_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: Record<string, any>): void {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        // Remove cart from models to avoid circular reference
        const modelsCopy = { ...models };
        modelsCopy.cart = undefined;

        this.belongsTo(models.brand, {
            as: TABLE_NAMES.BRAND,
            foreignKey: 'brand_id',
        });
        this.belongsTo(models.category, {
            as: TABLE_NAMES.CATEGORY,
            foreignKey: 'category_id',
        });
        this.hasMany(models.property, {
            as: TABLE_NAMES.PRODUCT_PROPERTY,
            onDelete: 'CASCADE',
            foreignKey: 'product_id',
        });
        this.belongsToMany(models.user, {
            through: TABLE_NAMES.RATING,
            as: TABLE_NAMES.USER,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
        this.belongsToMany(models.cart, {
            through: TABLE_NAMES.CART_PRODUCT,
            as: TABLE_NAMES.CART,
            onDelete: 'CASCADE',
        });
    }
}

export default function defineProduct(sequelize: Sequelize): typeof Product {
    Product.init(
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
                unique: true,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            price: {
                type: DataTypes.FLOAT,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            rating: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 0,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            image: {
                type: DataTypes.STRING,
                allowNull: false,
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: TABLE_NAMES.CATEGORY,
                    key: 'id',
                } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            brand_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: TABLE_NAMES.BRAND,
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
            modelName: TABLE_NAMES.PRODUCT,
            tableName: TABLE_NAMES.PRODUCT,
            timestamps: true,
            underscored: true,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    return Product;
}
