import { QueryInterface, DataTypes } from 'sequelize';

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
        // ИНДЕКСЫ для производительности
    await queryInterface.addIndex('role', ['role'], {
        name: 'idx_role_role',
        unique: true, // Уже есть unique constraint, но явно указываем
    });

    await queryInterface.addIndex('role', ['description'], {
        name: 'idx_role_description',
    });

    // Составной индекс для поиска
    await queryInterface.addIndex('role', ['role', 'description'], {
        name: 'idx_role_role_description',
    });
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.removeIndex('role', 'idx_role_role');
        await queryInterface.removeIndex('role', 'idx_role_description');
        await queryInterface.removeIndex('role', 'idx_role_role_description');
        await queryInterface.dropTable('role');
    },
    
};

export default migration;
