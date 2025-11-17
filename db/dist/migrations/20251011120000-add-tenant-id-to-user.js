"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migration = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('user', 'tenant_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'tenants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Tenant ID (FK → tenants.id)',
        });
        const indexes = [
            {
                columns: ['tenant_id'],
                name: 'idx_user_tenant_id',
            },
            {
                columns: ['tenant_id', 'id'],
                name: 'idx_user_tenant_id_id',
            },
            {
                columns: ['tenant_id', 'email'],
                name: 'idx_user_tenant_id_email',
            },
        ];
        for (const index of indexes) {
            try {
                await queryInterface.addIndex('user', index.columns, {
                    name: index.name,
                });
                console.log(`✓ Created index ${index.name} on user(${index.columns.join(',')})`);
            }
            catch {
                console.log(`⚠ Index ${index.name} already exists on user - skipping`);
            }
        }
        console.log('✓ Added tenant_id column to user table');
    },
    async down(queryInterface) {
        const indexes = [
            'idx_user_tenant_id',
            'idx_user_tenant_id_id',
            'idx_user_tenant_id_email',
        ];
        for (const indexName of indexes) {
            try {
                await queryInterface.removeIndex('user', indexName);
            }
            catch {
                console.log(`⚠ Index ${indexName} not found - skipping`);
            }
        }
        await queryInterface.removeColumn('user', 'tenant_id');
        console.log('✓ Removed tenant_id column from user table');
    },
};
exports.default = migration;
