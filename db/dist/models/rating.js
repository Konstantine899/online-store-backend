"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineRating;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class Rating extends sequelize_1.Model {
    static associate() {
    }
}
function defineRating(sequelize) {
    Rating.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        rating: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        user_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: consts_1.TABLE_NAMES.USER,
                key: 'id',
            },
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
    }, {
        sequelize,
        modelName: consts_1.TABLE_NAMES.RATING,
        tableName: consts_1.TABLE_NAMES.RATING,
        timestamps: true,
        underscored: false,
    });
    return Rating;
}
