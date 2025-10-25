import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

/**
 * SAAS-004-06: Создание таблицы promo_codes для системы промокодов
 *
 * Поля:
 * - code: уникальный код промокода (UNIQUE, NOT NULL)
 * - discount_type: тип скидки (PERCENT | FIXED)
 * - discount_value: величина скидки (процент или фиксированная сумма)
 * - valid_from: дата начала действия промокода
 * - valid_until: дата окончания действия промокода
 * - usage_limit: максимальное количество использований (NULL = безлимитно)
 * - usage_count: количество использований на данный момент
 * - min_purchase_amount: минимальная сумма заказа для применения промокода
 * - is_active: флаг активности промокода
 * - created_at, updated_at: метки времени
 *
 * Индексы:
 * - UNIQUE на code (для быстрого поиска и предотвращения дубликатов)
 * - INDEX на is_active (для фильтрации активных промокодов)
 * - INDEX на valid_from, valid_until (для проверки срока действия)
 * - Составной INDEX на (code, is_active, valid_from, valid_until) для оптимизации валидации
 */
const migration = {
    async up(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.createTable('promo_codes', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
                comment: 'Primary key',
            },
            code: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true,
                comment: 'Unique promo code (case-insensitive)',
            },
            discount_type: {
                type: DataTypes.ENUM('PERCENT', 'FIXED'),
                allowNull: false,
                defaultValue: 'PERCENT',
                comment: 'Discount type: PERCENT (%) or FIXED (currency)',
            },
            discount_value: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                comment: 'Discount value (percentage or fixed amount)',
            },
            valid_from: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                comment: 'Promo code valid from date',
            },
            valid_until: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'Promo code valid until date (NULL = no expiration)',
            },
            usage_limit: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'Maximum number of uses (NULL = unlimited)',
            },
            usage_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Current number of uses',
            },
            min_purchase_amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
                comment: 'Minimum purchase amount required (0 or NULL = no minimum)',
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Is promo code active (soft delete)',
            },
            created_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                allowNull: false,
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        });

        // Уникальный индекс на code (case-insensitive для PostgreSQL)
        await queryInterface.addIndex('promo_codes', ['code'], {
            name: 'idx_promo_codes_code_unique',
            unique: true,
        });

        // Индекс на is_active для фильтрации активных промокодов
        await queryInterface.addIndex('promo_codes', ['is_active'], {
            name: 'idx_promo_codes_is_active',
        });

        // Индексы на даты валидности
        await queryInterface.addIndex('promo_codes', ['valid_from'], {
            name: 'idx_promo_codes_valid_from',
        });

        await queryInterface.addIndex('promo_codes', ['valid_until'], {
            name: 'idx_promo_codes_valid_until',
        });

        // Составной индекс для оптимизации валидации промокодов
        await queryInterface.addIndex(
            'promo_codes',
            ['code', 'is_active', 'valid_from', 'valid_until'],
            {
                name: 'idx_promo_codes_validation',
            },
        );

        // Индекс на usage_count для статистики
        await queryInterface.addIndex('promo_codes', ['usage_count'], {
            name: 'idx_promo_codes_usage_count',
        });

        console.log('✅ Created table: promo_codes with all fields and indexes');
        console.log('✅ Promo codes system ready for integration (SAAS-004-06)');
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаляем индексы
        await queryInterface.removeIndex(
            'promo_codes',
            'idx_promo_codes_code_unique',
        );
        await queryInterface.removeIndex(
            'promo_codes',
            'idx_promo_codes_is_active',
        );
        await queryInterface.removeIndex(
            'promo_codes',
            'idx_promo_codes_valid_from',
        );
        await queryInterface.removeIndex(
            'promo_codes',
            'idx_promo_codes_valid_until',
        );
        await queryInterface.removeIndex(
            'promo_codes',
            'idx_promo_codes_validation',
        );
        await queryInterface.removeIndex(
            'promo_codes',
            'idx_promo_codes_usage_count',
        );

        // Удаляем таблицу
        await queryInterface.dropTable('promo_codes');

        console.log('✅ Dropped table: promo_codes and all indexes');
        console.log('✅ Promo codes rollback completed (SAAS-004-06)');
    },
};

export default migration;

