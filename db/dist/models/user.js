"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineUser;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class User extends sequelize_1.Model {
    static associate(models) {
        this.hasMany(models.refreshToken, {
            as: consts_1.TABLE_NAMES.REFRESH_TOKEN,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
        this.hasMany(models.order, {
            as: consts_1.TABLE_NAMES.ORDER,
            onDelete: 'SET NULL',
        });
        this.belongsToMany(models.role, {
            through: consts_1.TABLE_NAMES.USER_ROLE,
            as: consts_1.TABLE_NAMES.ROLE,
        });
        this.belongsToMany(models.product, {
            through: consts_1.TABLE_NAMES.RATING,
            as: consts_1.TABLE_NAMES.PRODUCT,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    }
}
function defineUser(sequelize) {
    User.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        email: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        password: {
            type: sequelize_1.DataTypes.STRING,
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
        modelName: consts_1.TABLE_NAMES.USER,
        tableName: consts_1.TABLE_NAMES.USER,
        timestamps: true,
        underscored: false,
    });
    return User;
}
