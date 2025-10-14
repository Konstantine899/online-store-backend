"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = async (queryInterface) => {
    await queryInterface.createTable('user_address', {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        user_id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'user', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        title: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            comment: 'Название адреса (Дом, Работа и т.п.)',
        },
        street: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
        },
        house: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: false,
        },
        apartment: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true,
        },
        city: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
        },
        postal_code: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: true,
        },
        country: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            defaultValue: 'Россия',
        },
        is_default: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
    await queryInterface.addIndex('user_address', ['user_id'], {
        name: 'idx_user_address_user_id',
    });
    await queryInterface.addIndex('user_address', ['user_id', 'is_default'], {
        name: 'idx_user_address_user_default',
    });
};
exports.up = up;
const down = async (queryInterface) => {
    await queryInterface.dropTable('user_address');
};
exports.down = down;
