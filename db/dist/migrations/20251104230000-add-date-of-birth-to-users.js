"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.addColumn('user', 'date_of_birth', {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Дата рождения пользователя (только дата, без времени)',
    });
}
async function down(queryInterface) {
    await queryInterface.removeColumn('user', 'date_of_birth');
}
