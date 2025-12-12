"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineBrand;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class Brand extends sequelize_1.Model {
    static associate(models) {
        this.hasMany(models.product, {
            as: consts_1.TABLE_NAMES.PRODUCT,
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
        });
        this.belongsTo(models.category, {
            as: consts_1.TABLE_NAMES.CATEGORY,
            foreignKey: 'category_id',
            onUpdate: 'RESTRICT',
        });
    }
}
function defineBrand(sequelize) {
    Brand.init({
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
        category_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: consts_1.TABLE_NAMES.CATEGORY,
                key: 'id',
            },
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
        logo: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: true,
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
        modelName: consts_1.TABLE_NAMES.BRAND,
        tableName: consts_1.TABLE_NAMES.BRAND,
        timestamps: true,
        underscored: false,
    });
    return Brand;
}
