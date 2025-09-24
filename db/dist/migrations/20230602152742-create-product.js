"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('product', {
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
                type: Sequelize.FLOAT,
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
        await queryInterface.addColumn('product', 'category_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'category',
                key: 'id',
            },
            allowNull: false,
        });
        await queryInterface.addColumn('product', 'brand_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'brand',
                key: 'id',
            },
            allowNull: false,
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('product', 'brand_id');
        await queryInterface.removeColumn('product', 'category_id');
        await queryInterface.dropTable('product');
    },
};
exports.default = migration;
