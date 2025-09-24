"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('order-item', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            price: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
        await queryInterface.addColumn('order-item', 'order_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'order',
                key: 'id',
            },
            allowNull: false,
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('order-item', 'order_id');
        await queryInterface.dropTable('order-item');
    },
};
exports.default = migration;
