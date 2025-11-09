import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

interface Migration {
    up(queryInterface: QueryInterface): Promise<void>;

    down(queryInterface: QueryInterface): Promise<void>;
}

const migration: Migration = {
    async up(queryInterface: QueryInterface): Promise<void> {
        // Step 1: Create default tenant (deterministic) - safe insert
        const [tenants] = await queryInterface.sequelize.query(
            `SELECT id FROM tenants WHERE id = 1`,
        );

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
        } else {
            console.log('Default tenant (id=1) already exists - skipping');
        }

        // Step 2: Backfill tenant_id = 1 for all existing records
        const tables = [
            'user', // ✅ Added: Main user table
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
            const [results] = await queryInterface.sequelize.query(
                `UPDATE \`${table}\` SET tenant_id = 1 WHERE tenant_id IS NULL`,
            );
            console.log(`Backfilled ${table}: ${results} records updated`);
        }

        // Step 3: Make tenant_id NOT NULL with DEFAULT 1 (enforce constraint)
        // ⚠️ Используем прямой SQL, т.к. changeColumn не работает корректно с FK в MySQL
        for (const table of tables) {
            // Drop FK constraint temporarily (if exists)
            try {
                await queryInterface.sequelize.query(
                    `ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${table}_ibfk_1\``,
                );
            } catch {
                // FK может не существовать или иметь другое имя - игнорируем
            }

            // Modify column to NOT NULL DEFAULT 1
            await queryInterface.sequelize.query(
                `ALTER TABLE \`${table}\`
                 MODIFY COLUMN \`tenant_id\` INT NOT NULL DEFAULT 1`,
            );

            // Re-add FK constraint
            await queryInterface.sequelize.query(
                `ALTER TABLE \`${table}\`
                 ADD CONSTRAINT \`fk_${table}_tenant_id\`
                 FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\` (\`id\`)
                 ON DELETE CASCADE ON UPDATE CASCADE`,
            );

            console.log(`${table}.tenant_id is now NOT NULL with DEFAULT 1`);
        }

        console.log(
            'Backfill complete: all records assigned to default tenant',
        );
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Step 1: Make tenant_id nullable again
        const tables = [
            'user', // ✅ Added: Main user table
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
                type: DataTypes.INTEGER,
                allowNull: true, // Back to nullable
                references: {
                    model: 'tenants',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            });
        }

        // Step 2: Clear tenant_id values
        for (const table of tables) {
            await queryInterface.sequelize.query(
                `UPDATE \`${table}\` SET tenant_id = NULL`,
            );
        }

        // Step 3: Delete default tenant
        await queryInterface.bulkDelete('tenants', { id: 1 });

        console.log(
            'Backfill rolled back: tenant_id nullable, default tenant deleted',
        );
    },
};

export default migration;
