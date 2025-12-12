"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = async (queryInterface) => {
    const tableDescription = await queryInterface.describeTable('user');
    if (!tableDescription.phone) {
        await queryInterface.addColumn('user', 'phone', {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true,
        });
    }
};
exports.up = up;
const down = async (queryInterface) => {
    await queryInterface.removeColumn('user', 'phone');
};
exports.down = down;
