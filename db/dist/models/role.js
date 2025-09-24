"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineRole;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class Role extends sequelize_1.Model {
    static associate(models) {
        this.belongsToMany(models.user, {
            through: consts_1.TABLE_NAMES.USER_ROLE,
            as: consts_1.TABLE_NAMES.USER,
        });
    }
}
function defineRole(sequelize) {
    Role.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        role: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
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
        modelName: consts_1.TABLE_NAMES.ROLE,
        tableName: consts_1.TABLE_NAMES.ROLE,
        timestamps: true,
        underscored: false,
    });
    return Role;
}
