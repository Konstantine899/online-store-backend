import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

export default {
    up: async (queryInterface: QueryInterface): Promise<void> => {
        await queryInterface.createTable('password_reset_tokens', {
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
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            tenant_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'SaaS tenant isolation (null for non-SaaS mode)',
            },
            token: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
                comment: 'Secure random token for password reset',
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
                comment: 'Token expiration (default 15 minutes from creation)',
            },
            is_used: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Prevents token reuse',
            },
            used_at: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'Timestamp when token was used',
            },
            ip_address: {
                type: DataTypes.STRING(45),
                allowNull: true,
                comment: 'IP address of password reset request (audit)',
            },
            user_agent: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'User agent string (audit)',
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
        await queryInterface.addIndex('password_reset_tokens', ['token'], {
            name: 'idx_password_reset_token',
            unique: true,
        });

        await queryInterface.addIndex('password_reset_tokens', ['user_id'], {
            name: 'idx_password_reset_user_id',
        });

        await queryInterface.addIndex('password_reset_tokens', ['tenant_id'], {
            name: 'idx_password_reset_tenant_id',
        });

        await queryInterface.addIndex('password_reset_tokens', {
            fields: ['expires_at'],
            name: 'idx_password_reset_expires_at',
        });

        await queryInterface.addIndex('password_reset_tokens', {
            fields: ['user_id', 'is_used', 'expires_at'],
            name: 'idx_password_reset_valid_tokens',
        });
    },

    down: async (queryInterface: QueryInterface): Promise<void> => {
        await queryInterface.dropTable('password_reset_tokens');
    },
};
