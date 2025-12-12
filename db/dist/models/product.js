"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineProduct;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class Product extends sequelize_1.Model {
    static associate(models) {
        const modelsCopy = { ...models };
        modelsCopy.cart = undefined;
        this.belongsTo(models.brand, {
            as: consts_1.TABLE_NAMES.BRAND,
            foreignKey: 'brand_id',
            onUpdate: 'RESTRICT',
        });
        this.belongsTo(models.category, {
            as: consts_1.TABLE_NAMES.CATEGORY,
            foreignKey: 'category_id',
            onUpdate: 'RESTRICT',
        });
        this.hasMany(models.property, {
            as: consts_1.TABLE_NAMES.PRODUCT_PROPERTY,
            onDelete: 'CASCADE',
            foreignKey: 'product_id',
        });
        this.belongsToMany(models.user, {
            through: consts_1.TABLE_NAMES.RATING,
            as: consts_1.TABLE_NAMES.USER,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
        this.belongsToMany(models.cart, {
            through: consts_1.TABLE_NAMES.CART_PRODUCT,
            as: consts_1.TABLE_NAMES.CART,
            onDelete: 'CASCADE',
        });
    }
}
function defineProduct(sequelize) {
    Product.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        price: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        rating: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        image: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        is_active: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        stock: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        category_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: consts_1.TABLE_NAMES.CATEGORY,
                key: 'id',
            },
        },
        brand_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: consts_1.TABLE_NAMES.BRAND,
                key: 'id',
            },
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: consts_1.TABLE_NAMES.PRODUCT,
        tableName: consts_1.TABLE_NAMES.PRODUCT,
        timestamps: true,
        underscored: true,
    });
    return Product;
}
