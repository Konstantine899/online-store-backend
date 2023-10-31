'use strict';
const { ORDER_ITEM, ORDER_ID, ORDER } = require('../consts');
/** @type {import("sequelize-cli").Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(`${ORDER_ITEM}`, {
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
        await queryInterface.addColumn(`${ORDER_ITEM}`, `${ORDER_ID}`, {
            type: Sequelize.INTEGER,
            references: {
                model: `${ORDER}`,
                key: 'id',
            },
            allowNull: false,
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(`${ORDER_ITEM}`, `${ORDER_ID}`);
        await queryInterface.dropTable(`${ORDER_ITEM}`);
    },
};
