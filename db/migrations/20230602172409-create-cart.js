'use strict';
const { CART } = require('../consts');
/** @type {import("sequelize-cli").Migration} */
module.exports = {
    // eslint-disable-next-line prettier/prettier
    async up(queryInterface, Sequelize): Promise<void> {
        await queryInterface.createTable(`${CART}`, {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
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
    },
    async down(queryInterface): Promise<void> {
        await queryInterface.dropTable(`${CART}`);
    },
};
