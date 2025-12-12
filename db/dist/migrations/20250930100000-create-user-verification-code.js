"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.createTable('user_verification_code', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        user_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'user', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        channel: {
            type: sequelize_1.DataTypes.STRING(16),
            allowNull: false,
        },
        code_hash: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        expires_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        attempts: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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
    await queryInterface.addIndex('user_verification_code', ['user_id', 'channel'], {
        name: 'idx_uvc_user_channel',
        unique: false,
    });
    await queryInterface.addIndex('user_verification_code', ['expires_at'], {
        name: 'idx_uvc_expires_at',
        unique: false,
    });
}
async function down(queryInterface) {
    try {
        await queryInterface.removeIndex('user_verification_code', 'idx_uvc_user_channel');
    }
    catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[migrate] skip removeIndex idx_uvc_user_channel:', e.message);
        }
    }
    try {
        await queryInterface.removeIndex('user_verification_code', 'idx_uvc_expires_at');
    }
    catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[migrate] skip removeIndex idx_uvc_expires_at:', e.message);
        }
    }
    await queryInterface.dropTable('user_verification_code');
}
