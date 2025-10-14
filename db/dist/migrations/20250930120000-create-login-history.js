"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.createTable('login_history', {
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
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        ip_address: {
            type: sequelize_1.DataTypes.STRING(45),
            allowNull: true,
        },
        user_agent: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        success: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        failure_reason: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        login_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
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
    await queryInterface.addIndex('login_history', ['user_id', 'login_at'], {
        name: 'idx_login_history_user_login_at',
    });
}
async function down(queryInterface) {
    await queryInterface.dropTable('login_history');
}
