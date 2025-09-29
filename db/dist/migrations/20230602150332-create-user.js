"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            email: {
                type: Sequelize.STRING(255),
                unique: true,
                allowNull: false,
            },
            password: {
                type: Sequelize.STRING(255),
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
        await Promise.all([
            queryInterface.addIndex('user', ['email'], {
                name: 'idx_user_email',
            }),
            queryInterface.addIndex('user', ['email', 'id'], {
                name: 'idx_user_email_id',
            }),
            queryInterface.addIndex('user', ['id'], {
                name: 'idx_user_id_performance',
            })
        ]);
    },
    async down(queryInterface) {
        await Promise.all([
            queryInterface.removeIndex('user', 'idx_user_email'),
            queryInterface.removeIndex('user', 'idx_user_email_id'),
            queryInterface.removeIndex('user', 'idx_user_id_performance')
        ]);
        await queryInterface.dropTable('user');
    },
};
exports.default = migration;
