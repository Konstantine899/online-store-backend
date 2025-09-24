"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineOrderItem;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class OrderItem extends sequelize_1.Model {
    static associate(models) {
        this.belongsTo(models.order, {
            as: consts_1.TABLE_NAMES.ORDER,
            foreignKey: 'order_id',
        });
    }
}
function defineOrderItem(sequelize) {
    OrderItem.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        quantity: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        order_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: consts_1.TABLE_NAMES.ORDER,
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
        modelName: consts_1.TABLE_NAMES.ORDER_ITEM,
        tableName: consts_1.TABLE_NAMES.ORDER_ITEM,
        timestamps: true,
        underscored: true,
    });
    return OrderItem;
}
