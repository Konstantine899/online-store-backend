"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const migration = {
    async up(queryInterface) {
        await queryInterface.createTable('promo_codes', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: sequelize_1.DataTypes.INTEGER,
                comment: 'Primary key',
            },
            code: {
                type: sequelize_1.DataTypes.STRING(50),
                allowNull: false,
                unique: true,
                comment: 'Unique promo code (case-insensitive)',
            },
            discount_type: {
                type: sequelize_1.DataTypes.ENUM('PERCENT', 'FIXED'),
                allowNull: false,
                defaultValue: 'PERCENT',
                comment: 'Discount type: PERCENT (%) or FIXED (currency)',
            },
            discount_value: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false,
                comment: 'Discount value (percentage or fixed amount)',
            },
            valid_from: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
                comment: 'Promo code valid from date',
            },
            valid_until: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
                comment: 'Promo code valid until date (NULL = no expiration)',
            },
            usage_limit: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: true,
                comment: 'Maximum number of uses (NULL = unlimited)',
            },
            usage_count: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Current number of uses',
            },
            min_purchase_amount: {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
                comment: 'Minimum purchase amount required (0 or NULL = no minimum)',
            },
            is_active: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Is promo code active (soft delete)',
            },
            created_at: {
                allowNull: false,
                type: sequelize_1.DataTypes.DATE,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            updated_at: {
                allowNull: false,
                type: sequelize_1.DataTypes.DATE,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
        });
        await queryInterface.addIndex('promo_codes', ['code'], {
            name: 'idx_promo_codes_code_unique',
            unique: true,
        });
        await queryInterface.addIndex('promo_codes', ['is_active'], {
            name: 'idx_promo_codes_is_active',
        });
        await queryInterface.addIndex('promo_codes', ['valid_from'], {
            name: 'idx_promo_codes_valid_from',
        });
        await queryInterface.addIndex('promo_codes', ['valid_until'], {
            name: 'idx_promo_codes_valid_until',
        });
        await queryInterface.addIndex('promo_codes', ['code', 'is_active', 'valid_from', 'valid_until'], {
            name: 'idx_promo_codes_validation',
        });
        await queryInterface.addIndex('promo_codes', ['usage_count'], {
            name: 'idx_promo_codes_usage_count',
        });
        console.log('✅ Created table: promo_codes with all fields and indexes');
        console.log('✅ Promo codes system ready for integration (SAAS-004-06)');
    },
    async down(queryInterface) {
        await queryInterface.removeIndex('promo_codes', 'idx_promo_codes_code_unique');
        await queryInterface.removeIndex('promo_codes', 'idx_promo_codes_is_active');
        await queryInterface.removeIndex('promo_codes', 'idx_promo_codes_valid_from');
        await queryInterface.removeIndex('promo_codes', 'idx_promo_codes_valid_until');
        await queryInterface.removeIndex('promo_codes', 'idx_promo_codes_validation');
        await queryInterface.removeIndex('promo_codes', 'idx_promo_codes_usage_count');
        await queryInterface.dropTable('promo_codes');
        console.log('✅ Dropped table: promo_codes and all indexes');
        console.log('✅ Promo codes rollback completed (SAAS-004-06)');
    },
};
exports.default = migration;
