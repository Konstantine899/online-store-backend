"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineCart;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class Cart extends sequelize_1.Model {
    static associate(models) {
        this.belongsToMany(models.product, {
            through: consts_1.TABLE_NAMES.CART_PRODUCT,
            as: consts_1.TABLE_NAMES.PRODUCT,
            onDelete: 'CASCADE',
        });
    }
}
function defineCart(sequelize) {
    Cart.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
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
        modelName: consts_1.TABLE_NAMES.CART,
        tableName: consts_1.TABLE_NAMES.CART,
        timestamps: true,
        underscored: false,
    });
    return Cart;
}
