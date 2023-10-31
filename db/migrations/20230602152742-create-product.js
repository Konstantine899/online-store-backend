'use strict';
const {
    CATEGORY_ID,
    BRAND_ID,
    PRODUCT,
    BRAND,
    CATEGORY,
} = require('../consts');
/** @type {import("sequelize-cli").Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(`${PRODUCT}`, {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            name: {
                type: Sequelize.STRING,
                unique: true,
                allowNull: false,
            },
            price: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            rating: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            image: {
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
        await queryInterface.addColumn(`${PRODUCT}`, `${CATEGORY_ID}`, {
            type: Sequelize.INTEGER,
            references: {
                model: `${CATEGORY}`,
                key: 'id',
            },
            allowNull: false,
        });
        await queryInterface.addColumn(`${PRODUCT}`, `${BRAND_ID}`, {
            type: Sequelize.INTEGER,
            references: {
                model: `${BRAND}`,
                key: 'id',
            },
            allowNull: false,
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(`${PRODUCT}`, `${BRAND_ID}`);
        await queryInterface.removeColumn(`${PRODUCT}`, `${CATEGORY_ID}`);
        await queryInterface.dropTable(`${PRODUCT}`);
    },
};
