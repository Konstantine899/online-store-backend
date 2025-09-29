"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineCartProduct;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class CartProduct extends sequelize_1.Model {
    static associate() {
    }
}
function defineCartProduct(sequelize) {
    CartProduct.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        quantity: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        cart_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: consts_1.TABLE_NAMES.CART,
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        product_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: consts_1.TABLE_NAMES.PRODUCT,
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize,
        modelName: consts_1.TABLE_NAMES.CART_PRODUCT,
        tableName: 'cart-product',
        timestamps: true,
        underscored: true,
    });
    return CartProduct;
}
