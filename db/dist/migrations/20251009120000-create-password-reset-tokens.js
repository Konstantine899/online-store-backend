"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = {
    up: async (queryInterface) => {
        await queryInterface.createTable('password_reset_tokens', {
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'user',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            tenant_id: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                comment: 'SaaS tenant isolation (null for non-SaaS mode)',
            },
            token: {
                type: sequelize_1.DataTypes.STRING(255),
                allowNull: false,
                unique: true,
                comment: 'Secure random token for password reset',
            },
            expires_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                comment: 'Token expiration (default 15 minutes from creation)',
            },
            is_used: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'Prevents token reuse',
            },
            used_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Timestamp when token was used',
            },
            ip_address: {
                type: sequelize_1.DataTypes.STRING(45),
                allowNull: true,
                comment: 'IP address of password reset request (audit)',
            },
            user_agent: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                comment: 'User agent string (audit)',
            },
            created_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            updated_at: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
        });
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
    down: async (queryInterface) => {
        await queryInterface.dropTable('password_reset_tokens');
    },
};
