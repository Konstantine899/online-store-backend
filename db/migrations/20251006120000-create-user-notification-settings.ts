import type { DataTypes, QueryInterface } from 'sequelize';

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
        // Создание таблицы user_notification_settings (SAAS-009-01-1)
        await queryInterface.createTable('user_notification_settings', {
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
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                comment: 'User ID (FK → user.id, UNIQUE via index)',
            },
            email_enabled: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Enable/disable email notifications',
            },
            push_enabled: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Enable/disable push notifications',
            },
            order_updates: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Enable/disable order update notifications',
            },
            marketing: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Enable/disable marketing notifications',
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

        // Создание уникального индекса на user_id
        await queryInterface.addIndex(
            'user_notification_settings',
            ['user_id'],
            {
                name: 'idx_user_notification_settings_user_id',
                unique: true,
            },
        );

        console.log(
            '✅ Created table: user_notification_settings with unique index on user_id',
        );
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаление индекса
        try {
            await queryInterface.removeIndex(
                'user_notification_settings',
                'idx_user_notification_settings_user_id',
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            if (
                !errorMessage.includes('does not exist') &&
                !errorMessage.includes('Unknown key')
            ) {
                throw error;
            }
        }

        // Удаление таблицы
        await queryInterface.dropTable('user_notification_settings');

        console.log('✅ Dropped table: user_notification_settings');
    },
};

export default migration;
