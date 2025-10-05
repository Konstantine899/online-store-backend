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
        // Создание таблицы notifications
        await queryInterface.createTable('notifications', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { 
                    model: 'user', 
                    key: 'id' 
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            type: {
                type: Sequelize.ENUM('email', 'push'),
                allowNull: false,
            },
            template_name: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            data: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('pending', 'sent', 'delivered', 'read', 'failed'),
                allowNull: false,
                defaultValue: 'pending',
            },
            sent_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            read_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            failed_reason: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            is_read: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_archived: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });

        // Создание индексов для производительности
        await queryInterface.addIndex('notifications', ['user_id'], {
            name: 'idx_notifications_user_id'
        });
        
        await queryInterface.addIndex('notifications', ['type'], {
            name: 'idx_notifications_type'
        });
        
        await queryInterface.addIndex('notifications', ['status'], {
            name: 'idx_notifications_status'
        });
        
        await queryInterface.addIndex('notifications', ['template_name'], {
            name: 'idx_notifications_template_name'
        });
        
        await queryInterface.addIndex('notifications', ['is_read'], {
            name: 'idx_notifications_is_read'
        });
        
        await queryInterface.addIndex('notifications', ['is_archived'], {
            name: 'idx_notifications_is_archived'
        });
        
        await queryInterface.addIndex('notifications', ['created_at'], {
            name: 'idx_notifications_created_at'
        });
        
        await queryInterface.addIndex('notifications', ['user_id', 'status'], {
            name: 'idx_notifications_user_status'
        });
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаление индексов
        await queryInterface.removeIndex('notifications', 'idx_notifications_user_id');
        await queryInterface.removeIndex('notifications', 'idx_notifications_type');
        await queryInterface.removeIndex('notifications', 'idx_notifications_status');
        await queryInterface.removeIndex('notifications', 'idx_notifications_template_name');
        await queryInterface.removeIndex('notifications', 'idx_notifications_is_read');
        await queryInterface.removeIndex('notifications', 'idx_notifications_is_archived');
        await queryInterface.removeIndex('notifications', 'idx_notifications_created_at');
        await queryInterface.removeIndex('notifications', 'idx_notifications_user_status');
        
        // Удаление таблицы
        await queryInterface.dropTable('notifications');
    },
};

export = migration;
