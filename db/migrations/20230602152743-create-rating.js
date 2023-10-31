'use strict';
const { RATING, PRODUCT, USER } = require('../consts');
/** @type {import("sequelize-cli").Migration} */
module.exports = {
    // eslint-disable-next-line prettier/prettier
    async up(queryInterface, Sequelize): Promise<void> {
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
                    model: `${USER}`,
                    key: 'id',
                },
                allowNull: false,
            },
            product_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: `${PRODUCT}`,
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
    async down(queryInterface): Promise<void> {
        await queryInterface.dropTable(`${RATING}`);
    },
};
