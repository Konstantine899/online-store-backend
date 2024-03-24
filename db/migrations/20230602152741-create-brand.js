'use strict';
const { BRAND, CATEGORY, CATEGORY_ID } = require('../consts');
/** @type {import("sequelize-cli").Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(`${BRAND}`, {
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
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
        await queryInterface.addColumn(`${BRAND}`, `${CATEGORY_ID}`, {
            type: Sequelize.INTEGER,
            references: {
                model: `${CATEGORY}`,
                key: 'id',
            },
            allowNull: false,
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(`${CATEGORY}`, `${CATEGORY_ID}`);
        await queryInterface.dropTable(`${BRAND}`);
    },
};
