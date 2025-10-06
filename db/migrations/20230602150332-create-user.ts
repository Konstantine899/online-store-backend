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
            first_name: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            last_name: {
                type: Sequelize.STRING(100),
                allowNull: true,
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
            // Индекс для быстрого поиска по email (уникальный уже есть, но явно добавляем)
            queryInterface.addIndex('user', ['email'], {
                name: 'idx_user_email',
            }),
            // Составной индекс для оптимизации запросов с email и id
            queryInterface.addIndex('user', ['email', 'id'], {
                name: 'idx_user_email_id',
            }),
            // Индекс для внешних ключей (хотя id - PK, но может помочь в JOIN'ах)
            queryInterface.addIndex('user', ['id'], {
                name: 'idx_user_id_performance',
            }),
        ]);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        await Promise.all([
            queryInterface.removeIndex('user', 'idx_user_email'),
            queryInterface.removeIndex('user', 'idx_user_email_id'),
            queryInterface.removeIndex('user', 'idx_user_id_performance'),
        ]);
        await queryInterface.dropTable('user');
    },
};

export default migration;
