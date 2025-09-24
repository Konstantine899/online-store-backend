"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineCategory;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class Category extends sequelize_1.Model {
    static associate(models) {
        this.hasMany(models.product, {
            as: consts_1.TABLE_NAMES.PRODUCT,
            onDelete: 'RESTRICT',
        });
        this.hasMany(models.brand, {
            as: consts_1.TABLE_NAMES.BRAND,
            onDelete: 'RESTRICT',
        });
    }
}
function defineCategory(sequelize) {
    Category.init({
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
        image: {
            type: sequelize_1.DataTypes.STRING,
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
        modelName: consts_1.TABLE_NAMES.CATEGORY,
        tableName: consts_1.TABLE_NAMES.CATEGORY,
        timestamps: true,
        underscored: false,
    });
    return Category;
}
