"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineUserVerificationCode;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class UserVerificationCode extends sequelize_1.Model {
    static associate(models) {
        this.belongsTo(models.user, {
            foreignKey: 'user_id',
            as: consts_1.TABLE_NAMES.USER,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    }
}
function defineUserVerificationCode(sequelize) {
    UserVerificationCode.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        user_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        channel: {
            type: sequelize_1.DataTypes.STRING(16),
            allowNull: false,
        },
        code_hash: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        expires_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        attempts: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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
        modelName: 'userVerificationCode',
        tableName: 'user_verification_code',
        timestamps: true,
        underscored: true,
    });
    return UserVerificationCode;
}
