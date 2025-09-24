"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineOrder;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class Order extends sequelize_1.Model {
    static associate(models) {
        this.belongsTo(models.user, {
            as: consts_1.TABLE_NAMES.USER,
            foreignKey: 'user_id',
        });
        this.hasMany(models.item, {
            as: consts_1.TABLE_NAMES.ORDER_ITEM,
            onDelete: 'CASCADE',
            foreignKey: 'order_id',
        });
    }
}
function defineOrder(sequelize) {
    Order.init({
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
        email: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        amount: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        comment: {
            type: sequelize_1.DataTypes.STRING(2200),
            allowNull: true,
        },
        user_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: consts_1.TABLE_NAMES.USER,
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
        modelName: consts_1.TABLE_NAMES.ORDER,
        tableName: consts_1.TABLE_NAMES.ORDER,
        timestamps: true,
        underscored: true,
    });
    return Order;
}
