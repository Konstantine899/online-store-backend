"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cart', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });
        await queryInterface.addIndex('cart', ['created_at'], {
            name: 'idx_cart_created_at',
        });
        await queryInterface.addIndex('cart', ['updated_at'], {
            name: 'idx_cart_updated_at',
        });
        await queryInterface.addIndex('cart', ['created_at', 'updated_at'], {
            name: 'idx_cart_created_updated',
        });
    },
    async down(queryInterface) {
        await queryInterface.removeIndex('cart', 'idx_cart_created_at');
        await queryInterface.removeIndex('cart', 'idx_cart_updated_at');
        await queryInterface.removeIndex('cart', 'idx_cart_created_updated');
        await queryInterface.dropTable('cart');
    },
};
exports.default = migration;
