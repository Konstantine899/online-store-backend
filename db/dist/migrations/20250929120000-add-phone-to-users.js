"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
        await queryInterface.addColumn('user', 'phone', {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true,
            comment: 'E.164 phone',
        }, { transaction });
        await queryInterface.addIndex('user', ['phone'], {
            name: 'idx_user_phone',
            using: 'BTREE',
            transaction,
        });
        await transaction.commit();
    }
    catch (error) {
        await transaction.rollback();
        throw error;
    }
};
exports.up = up;
const down = async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
        await queryInterface.removeIndex('user', 'idx_user_phone', {
            transaction,
        });
        await queryInterface.removeColumn('user', 'phone', { transaction });
        await transaction.commit();
    }
    catch (error) {
        await transaction.rollback();
        throw error;
    }
};
exports.down = down;
