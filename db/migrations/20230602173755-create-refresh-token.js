'use strict';
const { REFRESH_TOKEN, USER_ID, USER } = require('../consts');
/** @type {import("sequelize-cli").Migration} */
module.exports = {
    // eslint-disable-next-line prettier/prettier
    async up(queryInterface, Sequelize): Promise<void> {
        await queryInterface.createTable(`${REFRESH_TOKEN}`, {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            is_revoked: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            expires: {
                type: Sequelize.DATE,
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
        await queryInterface.addColumn(`${REFRESH_TOKEN}`, `${USER_ID}`, {
            type: Sequelize.INTEGER,
            references: {
                model: `${USER}`,
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    },
    async down(queryInterface): Promise<void> {
        await queryInterface.removeColumn(`${REFRESH_TOKEN}`, `${USER_ID}`);
        await queryInterface.dropTable(`${REFRESH_TOKEN}`);
    },
};
