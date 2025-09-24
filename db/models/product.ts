import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { ProductModel, ProductCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class Product extends Model<ProductModel, ProductCreationAttributes> implements ProductModel {
    declare id: number;
    declare name: string;
    declare price: number;
    declare rating: number;
    declare image: string;
    declare category_id: number;
    declare brand_id: number;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: any): void {
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

  Product.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      rating: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLE_NAMES.CATEGORY,
          key: 'id',
        },
      },
      brand_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TABLE_NAMES.BRAND,
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
    },
    {
      sequelize,
      modelName: TABLE_NAMES.PRODUCT,
      tableName: TABLE_NAMES.PRODUCT,
      timestamps: true,
      underscored: true,
    },
  );

  return Product;
};
