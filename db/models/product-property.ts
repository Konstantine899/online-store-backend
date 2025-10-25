import type {
    Sequelize,
    ModelStatic,
    ModelAttributes,
    Optional} from 'sequelize';
import {
    Model,
    DataTypes
} from 'sequelize';
import { TABLE_NAMES } from '../consts';
import type {
    ProductPropertyModel,
    ProductPropertyCreationAttributes,
} from './types';

class ProductProperty
    extends Model<ProductPropertyModel, ProductPropertyCreationAttributes>
    implements ProductPropertyModel
{
    declare id: number;
    declare name: string;
    declare value: string;
    declare product_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: {
        product: ModelStatic<
            Model<Record<string, unknown>, Record<string, unknown>>
        >;
    }): void {
        this.belongsTo(models.product, {
            as: TABLE_NAMES.PRODUCT,
            foreignKey: 'product_id',
        });
    }
}

export default function defineProductProperty(
    sequelize: Sequelize,
): typeof ProductProperty {
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
        value: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: TABLE_NAMES.PRODUCT,
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

    ProductProperty.init(
        attributes as unknown as ModelAttributes<
            ProductProperty,
            Optional<ProductPropertyModel, never>
        >,
        {
            sequelize,
            modelName: TABLE_NAMES.PRODUCT_PROPERTY,
            tableName: TABLE_NAMES.PRODUCT_PROPERTY,
            timestamps: true,
            underscored: true,
        },
    );

    return ProductProperty;
}
