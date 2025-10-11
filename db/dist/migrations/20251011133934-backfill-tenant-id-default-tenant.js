"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const migration = {
    async up(queryInterface, Sequelize) {
        const [tenants] = await queryInterface.sequelize.query(`SELECT id FROM tenants WHERE id = 1`);
        if (tenants.length === 0) {
            await queryInterface.bulkInsert('tenants', [
                {
                    id: 1,
                    name: 'Default Store',
                    subdomain: 'default',
                    status: 'active',
                    plan: 'enterprise',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ]);
            console.log('Created default tenant (id=1)');
        }
        else {
            console.log('Default tenant (id=1) already exists - skipping');
        }
        const tables = [
            'product',
            'category',
            'brand',
            'cart',
            'order',
            'rating',
            'user_address',
            'login_history',
        ];
        for (const table of tables) {
            const [results] = await queryInterface.sequelize.query(`UPDATE \`${table}\` SET tenant_id = 1 WHERE tenant_id IS NULL`);
            console.log(`Backfilled ${table}: ${results} records updated`);
        }
        for (const table of tables) {
            await queryInterface.changeColumn(table, 'tenant_id', {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'tenants',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            });
            console.log(`${table}.tenant_id is now NOT NULL`);
        }
        console.log('Backfill complete: all records assigned to default tenant');
    },
    async down(queryInterface) {
        const tables = [
            'product',
            'category',
            'brand',
            'cart',
            'order',
            'rating',
            'user_address',
            'login_history',
        ];
        for (const table of tables) {
            await queryInterface.changeColumn(table, 'tenant_id', {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'tenants',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            });
        }
        for (const table of tables) {
            await queryInterface.sequelize.query(`UPDATE \`${table}\` SET tenant_id = NULL`);
        }
        await queryInterface.bulkDelete('tenants', { id: 1 });
        console.log('Backfill rolled back: tenant_id nullable, default tenant deleted');
    },
};
exports.default = migration;
