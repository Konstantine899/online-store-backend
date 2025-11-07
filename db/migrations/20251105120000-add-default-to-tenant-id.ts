import type { DataTypes, QueryInterface } from 'sequelize';

interface Migration {
    up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void>;

    down(queryInterface: QueryInterface): Promise<void>;
}

/**
 * Миграция: Добавление DEFAULT 1 для tenant_id в таблице user
 *
 * Цель: Обеспечить работу тестов с TestDataFactory
 */
const migration: Migration = {
    async up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void> {
        // Обновляем колонку tenant_id: добавляем DEFAULT 1
        await queryInterface.changeColumn('user', 'tenant_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1, // Default tenant для тестов и legacy data
            references: {
                model: 'tenants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        console.log('✓ Added DEFAULT 1 to tenant_id in user table');
    },

    async down(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void> {
        // Убираем DEFAULT
        await queryInterface.changeColumn('user', 'tenant_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            // без defaultValue
            references: {
                model: 'tenants',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        console.log('✓ Removed DEFAULT from tenant_id in user table');
    },
};

export default migration;



