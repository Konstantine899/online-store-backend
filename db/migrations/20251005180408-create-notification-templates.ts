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
        // Создание таблицы notification_templates
        await queryInterface.createTable('notification_templates', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true,
            },
            type: {
                type: Sequelize.ENUM('email', 'push'),
                allowNull: false,
            },
            subject: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            variables: {
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: [],
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });

        // Создание индексов для производительности
        await queryInterface.addIndex('notification_templates', ['name'], {
            name: 'idx_notification_templates_name',
            unique: true
        });
        
        await queryInterface.addIndex('notification_templates', ['type'], {
            name: 'idx_notification_templates_type'
        });
        
        await queryInterface.addIndex('notification_templates', ['is_active'], {
            name: 'idx_notification_templates_is_active'
        });
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаление индексов
        await queryInterface.removeIndex('notification_templates', 'idx_notification_templates_name');
        await queryInterface.removeIndex('notification_templates', 'idx_notification_templates_type');
        await queryInterface.removeIndex('notification_templates', 'idx_notification_templates_is_active');
        
        // Удаление таблицы
        await queryInterface.dropTable('notification_templates');
    },
};

export = migration;
