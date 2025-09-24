"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineRefreshToken;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class RefreshToken extends sequelize_1.Model {
    static associate(models) {
        this.belongsTo(models.user, {
            as: consts_1.TABLE_NAMES.USER,
            foreignKey: 'user_id',
        });
    }
}
function defineRefreshToken(sequelize) {
    RefreshToken.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        is_revoked: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        expires: {
            type: sequelize_1.DataTypes.DATE,
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
        modelName: consts_1.TABLE_NAMES.REFRESH_TOKEN,
        tableName: consts_1.TABLE_NAMES.REFRESH_TOKEN,
        timestamps: true,
        underscored: false,
    });
    return RefreshToken;
}
