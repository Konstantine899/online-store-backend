'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cart-product', {
            quantity: {
                type: Sequelize.INTEGER,
                defaultValue: 1,
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
        await queryInterface.addColumn('cart-product', 'cartId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'cart',
                key: 'id',
            },
        });
        await queryInterface.addColumn('cart-product', 'productId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'product',
                key: 'id',
            },
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('cart-product', 'cartId');
        await queryInterface.removeColumn('cart-product', 'productId');
        await queryInterface.dropTable('cart-product');
    },
};
