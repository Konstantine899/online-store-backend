"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineProductProperty;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class ProductProperty extends sequelize_1.Model {
    static associate(models) {
        this.belongsTo(models.product, {
            as: consts_1.TABLE_NAMES.PRODUCT,
            foreignKey: 'product_id',
        });
    }
}
function defineProductProperty(sequelize) {
    const attributes = {
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
        value: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        product_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: consts_1.TABLE_NAMES.PRODUCT,
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
    };
    ProductProperty.init(attributes, {
        sequelize,
        modelName: consts_1.TABLE_NAMES.PRODUCT_PROPERTY,
        tableName: consts_1.TABLE_NAMES.PRODUCT_PROPERTY,
        timestamps: true,
        underscored: true,
    });
    return ProductProperty;
}
