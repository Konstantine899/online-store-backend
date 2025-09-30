import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('login_history', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        ip_address: {
            type: DataTypes.STRING(45), // IPv6 max length
            allowNull: true,
        },
        user_agent: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        success: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        failure_reason: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        login_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });

    // Индексы для производительности
    await queryInterface.addIndex('login_history', ['user_id'], {
        name: 'idx_login_history_user_id',
    });
    await queryInterface.addIndex('login_history', ['login_at'], {
        name: 'idx_login_history_login_at',
    });
    await queryInterface.addIndex('login_history', ['ip_address'], {
        name: 'idx_login_history_ip_address',
    });
    await queryInterface.addIndex('login_history', ['success'], {
        name: 'idx_login_history_success',
    });
    // Составной индекс для частых запросов
    await queryInterface.addIndex('login_history', ['user_id', 'login_at'], {
        name: 'idx_login_history_user_login_at',
    });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('login_history');
}
