"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
const TABLE = 'user';
async function up(queryInterface) {
    await queryInterface.changeColumn(TABLE, 'notification_preferences', {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
    });
    await queryInterface.changeColumn(TABLE, 'translations', {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
    });
}
async function down(queryInterface) {
    await queryInterface.changeColumn(TABLE, 'notification_preferences', {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
    });
    await queryInterface.changeColumn(TABLE, 'translations', {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    });
}
