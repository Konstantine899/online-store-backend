"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('category', {
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
            image: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            slug: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
        await queryInterface.addIndex('category', ['name'], {
            name: 'idx_category_name_unique',
            unique: true,
        });
        await queryInterface.addIndex('category', ['slug'], {
            name: 'idx_category_slug_unique',
            unique: true,
        });
        await queryInterface.addIndex('category', ['is_active'], {
            name: 'idx_category_is_active',
        });
    },
    async down(queryInterface) {
        await queryInterface.removeIndex('category', 'idx_category_name_unique');
        await queryInterface.removeIndex('category', 'idx_category_slug_unique');
        await queryInterface.removeIndex('category', 'idx_category_is_active');
        await queryInterface.dropTable('category');
    },
};
exports.default = migration;
