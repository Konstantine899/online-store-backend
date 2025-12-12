"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineLoginHistory;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class LoginHistory extends sequelize_1.Model {
    static associate(models) {
        this.belongsTo(models.user, {
            foreignKey: 'user_id',
            as: consts_1.TABLE_NAMES.USER,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    }
}
function defineLoginHistory(sequelize) {
    LoginHistory.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        user_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        ip_address: {
            type: sequelize_1.DataTypes.STRING(45),
            allowNull: true,
        },
        user_agent: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        success: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        failure_reason: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        login_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
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
        modelName: consts_1.TABLE_NAMES.LOGIN_HISTORY,
        tableName: consts_1.TABLE_NAMES.LOGIN_HISTORY,
        timestamps: true,
        underscored: false,
    });
    return LoginHistory;
}
