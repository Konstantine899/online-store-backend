"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineUserAddress;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class UserAddress extends sequelize_1.Model {
    static associate(models) {
        this.belongsTo(models.user, {
            as: consts_1.TABLE_NAMES.USER,
            foreignKey: consts_1.USER_ID,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    }
}
function defineUserAddress(sequelize) {
    UserAddress.init({
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
                model: consts_1.TABLE_NAMES.USER,
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        title: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        street: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        house: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: false,
        },
        apartment: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true,
        },
        city: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        postal_code: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true,
        },
        country: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            defaultValue: 'Россия',
        },
        is_default: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
        modelName: 'user_address',
        tableName: 'user_address',
        timestamps: true,
        underscored: true,
    });
    return UserAddress;
}
