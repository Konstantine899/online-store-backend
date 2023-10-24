'use strict';
const { USER_ROLE, ROLE, USER } = require('../consts');
/** @type {import("sequelize-cli").Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(`${USER_ROLE}`, {
            roleId: {
                type: Sequelize.INTEGER,
                references: {
                    model: `${ROLE}`,
                    key: 'id',
                },
                allowNull: false,
            },
            userId: {
                type: Sequelize.INTEGER,
                references: {
                    model: `${USER}`,
                    key: 'id',
                },
                allowNull: false,
            },
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable(`${USER_ROLE}`);
    },
};
