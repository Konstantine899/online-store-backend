'use strict';
const { RATING } = require('../consts');
/** @type {import("sequelize-cli").Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(`${RATING}`, {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            rating: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'user',
                    key: 'id',
                },
                allowNull: false,
            },
            product_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'product',
                    key: 'id',
                },
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
    },
    async down(queryInterface) {
        await queryInterface.dropTable(`${RATING}`);
    },
};
