"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = async (queryInterface) => {
    await queryInterface.addColumn('user', 'phone', {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    });
    await queryInterface.addIndex('user', ['phone'], {
        name: 'idx_users_phone',
    });
};
exports.up = up;
const down = async (queryInterface) => {
    await queryInterface.removeIndex('user', 'idx_users_phone');
    await queryInterface.removeColumn('user', 'phone');
};
exports.down = down;
