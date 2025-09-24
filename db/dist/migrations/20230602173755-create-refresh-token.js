"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('refresh_token', {
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
        await queryInterface.addColumn('refresh_token', 'user_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'user',
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('refresh_token', 'user_id');
        await queryInterface.dropTable('refresh_token');
    },
};
exports.default = migration;
