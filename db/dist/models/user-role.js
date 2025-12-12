"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineUserRole;
const sequelize_1 = require("sequelize");
const consts_1 = require("../consts");
class UserRole extends sequelize_1.Model {
    static associate() {
    }
}
function defineUserRole(sequelize) {
    UserRole.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        roleId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'role_id',
            references: {
                model: consts_1.TABLE_NAMES.ROLE,
                key: 'id',
            },
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: consts_1.TABLE_NAMES.USER,
                key: 'id',
            },
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            field: 'created_at',
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            field: 'updated_at',
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize,
        modelName: consts_1.TABLE_NAMES.USER_ROLE,
        tableName: 'user_role',
        timestamps: true,
        underscored: false,
    });
    return UserRole;
}
