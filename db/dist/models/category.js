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
            onUpdate: 'CASCADE',
        });
        this.hasMany(models.brand, {
            as: consts_1.TABLE_NAMES.BRAND,
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
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
        modelName: consts_1.TABLE_NAMES.CATEGORY,
        tableName: 'category',
        timestamps: true,
        underscored: true,
    });
    return Category;
}
