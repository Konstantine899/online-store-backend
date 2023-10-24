'use strict';
const { CART_PRODUCT, CART_ID, PRODUCT_ID } = require('../consts');
/** @type {import("sequelize-cli").Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(`${CART_PRODUCT}`, {
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
        await queryInterface.addColumn(`${CART_PRODUCT}`, `${CART_ID}`, {
            type: Sequelize.INTEGER,
            references: {
                model: 'cart',
                key: 'id',
            },
        });
        await queryInterface.addColumn(`${CART_PRODUCT}`, `${PRODUCT_ID}`, {
            type: Sequelize.INTEGER,
            references: {
                model: 'product',
                key: 'id',
            },
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(`${CART_PRODUCT}`, `${CART_ID}`);
        await queryInterface.removeColumn(`${CART_PRODUCT}`, `${PRODUCT_ID}`);
        await queryInterface.dropTable(`${CART_PRODUCT}`);
    },
};
