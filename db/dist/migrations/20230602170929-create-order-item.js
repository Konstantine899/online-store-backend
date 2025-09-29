"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('order_item', {
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
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
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
        await queryInterface.addColumn('order_item', 'order_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'order',
                key: 'id',
            },
            allowNull: false,
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
        await queryInterface.addIndex('order_item', ['order_id'], {
            name: 'idx_order_item_order_id',
        });
        await queryInterface.addIndex('order_item', ['price'], {
            name: 'idx_order_item_price',
        });
        await queryInterface.addIndex('order_item', ['quantity'], {
            name: 'idx_order_item_quantity',
        });
        await queryInterface.addIndex('order_item', ['order_id', 'price'], {
            name: 'idx_order_item_order_price',
        });
        await queryInterface.addIndex('order_item', ['price', 'quantity'], {
            name: 'idx_order_item_price_quantity',
        });
    },
    async down(queryInterface) {
        await queryInterface.removeIndex('order_item', 'idx_order_item_order_id');
        await queryInterface.removeIndex('order_item', 'idx_order_item_price');
        await queryInterface.removeIndex('order_item', 'idx_order_item_quantity');
        await queryInterface.removeIndex('order_item', 'idx_order_item_order_price');
        await queryInterface.removeIndex('order_item', 'idx_order_item_price_quantity');
        await queryInterface.removeColumn('order_item', 'order_id');
        await queryInterface.dropTable('order_item');
    },
};
exports.default = migration;
