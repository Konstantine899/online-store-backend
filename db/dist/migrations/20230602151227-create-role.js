"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('role', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            role: {
                type: Sequelize.STRING,
                unique: true,
                allowNull: false,
            },
            description: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });
        await queryInterface.addIndex('role', ['role'], {
            name: 'idx_role_role',
            unique: true,
        });
        await queryInterface.addIndex('role', ['description'], {
            name: 'idx_role_description',
        });
        await queryInterface.addIndex('role', ['role', 'description'], {
            name: 'idx_role_role_description',
        });
    },
    async down(queryInterface) {
        await queryInterface.removeIndex('role', 'idx_role_role');
        await queryInterface.removeIndex('role', 'idx_role_description');
        await queryInterface.removeIndex('role', 'idx_role_role_description');
        await queryInterface.dropTable('role');
    },
};
exports.default = migration;
