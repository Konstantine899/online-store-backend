"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = definePasswordResetToken;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class PasswordResetToken extends sequelize_1.Model {
    static associate(models) {
        this.belongsTo(models.user, {
            foreignKey: 'user_id',
            as: consts_1.TABLE_NAMES.USER,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    }
}
function definePasswordResetToken(sequelize) {
    PasswordResetToken.init({
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
        tenant_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            comment: 'SaaS tenant isolation',
        },
        token: {
            type: sequelize_1.DataTypes.STRING(64),
            allowNull: false,
            unique: true,
        },
        expires_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        is_used: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        used_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        ip_address: {
            type: sequelize_1.DataTypes.STRING(45),
            allowNull: true,
        },
        user_agent: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
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
        modelName: consts_1.TABLE_NAMES.PASSWORD_RESET_TOKEN,
        tableName: 'password_reset_tokens',
        timestamps: true,
        underscored: false,
        indexes: [
            {
                fields: ['user_id'],
            },
            {
                fields: ['token'],
                unique: true,
            },
            {
                fields: ['expires_at'],
            },
            {
                fields: ['is_used'],
            },
        ],
    });
    return PasswordResetToken;
}
