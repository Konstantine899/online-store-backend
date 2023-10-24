'use strict';
const { ORDER, USER_ID } = require('../consts');
/** @type {import("sequelize-cli").Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(`${ORDER}`, {
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
            email: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            phone: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            address: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            amount: {
                type: Sequelize.FLOAT,
                allowNull: false,
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            comment: { type: Sequelize.STRING(2200) },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
        await queryInterface.addColumn(`${ORDER}`, `${USER_ID}`, {
            type: Sequelize.INTEGER,
            references: {
                model: 'user',
                key: 'id',
            },
            allowNull: false,
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(`${ORDER}`, `${USER_ID}`);
        await queryInterface.dropTable(`${ORDER}`);
    },
};
