'use strict';
const { PRODUCT_PROPERTY, PRODUCT_ID, PRODUCT } = require('../consts');
/** @type {import("sequelize-cli").Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(`${PRODUCT_PROPERTY}`, {
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
            value: {
                type: Sequelize.STRING,
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
        await queryInterface.addColumn(`${PRODUCT_PROPERTY}`, `${PRODUCT_ID}`, {
            type: Sequelize.INTEGER,
            references: {
                model: `${PRODUCT}`,
                key: 'id',
            },
            allowNull: false,
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(
            `${PRODUCT_PROPERTY}`,
            `${PRODUCT_ID}`,
        );
        await queryInterface.dropTable(`${PRODUCT_PROPERTY}`);
    },
};
