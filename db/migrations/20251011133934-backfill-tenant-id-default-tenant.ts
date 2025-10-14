import { DataTypes, QueryInterface } from 'sequelize';

interface Migration {
    up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void>;

    down(queryInterface: QueryInterface): Promise<void>;
}

const migration: Migration = {
    async up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void> {
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

        // Step 3: Make tenant_id NOT NULL (enforce constraint)
        for (const table of tables) {
            await queryInterface.changeColumn(table, 'tenant_id', {
                type: Sequelize.INTEGER,
                allowNull: false, // Now required!
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

    async down(queryInterface: QueryInterface): Promise<void> {
        // Step 1: Make tenant_id nullable again
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

        console.log('Backfill rolled back: tenant_id nullable, default tenant deleted');
    },
};

export default migration;

