import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

/**
 * SAAS-002 Cleanup: Remove ALL e-commerce specific flags from User table
 *
 * Удаляем бизнес-специфичные поля из таблицы user:
 * - is_beta_tester, is_vip_customer, is_premium, is_affiliate,
 *   is_employee, is_high_value, is_wholesale
 *
 * Эти поля были частью e-commerce функциональности и не нужны для универсального SaaS MVP.
 *
 * Breaking change: Если клиенты используют эти поля, они должны мигрировать на custom tenant fields.
 */
const migration = {
    async up(queryInterface: QueryInterface): Promise<void> {
        const businessFields = [
            'is_beta_tester',
            'is_vip_customer',
            'is_premium',
            'is_affiliate',
            'is_employee',
            'is_high_value',
            'is_wholesale',
        ];

        const businessIndexes = [
            'idx_user_vip',
            'idx_user_beta_tester',
            'idx_user_premium',
            'idx_user_is_affiliate',
            'idx_user_is_employee',
            'idx_user_is_high_value',
            'idx_user_is_wholesale',
        ];

        // Удаляем индексы
        for (const indexName of businessIndexes) {
            try {
                await queryInterface.removeIndex('user', indexName);
                console.log(
                    `✅ Index ${indexName} removed from user table (SAAS-002)`,
                );
            } catch {
                console.log(`⚠️  Index ${indexName} does not exist - skipping`);
            }
        }

        // Удаляем колонки
        for (const column of businessFields) {
            try {
                await queryInterface.removeColumn('user', column);
                console.log(
                    `✅ Column ${column} removed from user table (SAAS-002)`,
                );
            } catch {
                console.log(`⚠️  Column ${column} does not exist - skipping`);
            }
        }
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Восстанавливаем колонки
        const columns = [
            { name: 'is_beta_tester', comment: 'Beta tester flag' },
            { name: 'is_vip_customer', comment: 'VIP customer flag' },
            { name: 'is_premium', comment: 'Premium subscription flag' },
            { name: 'is_affiliate', comment: 'Affiliate partner flag' },
            { name: 'is_employee', comment: 'Employee flag' },
            { name: 'is_high_value', comment: 'High value customer flag' },
            { name: 'is_wholesale', comment: 'Wholesale customer flag' },
        ];

        for (const col of columns) {
            try {
                await queryInterface.addColumn('user', col.name, {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                    comment: `${col.comment} (e-commerce specific, deprecated)`,
                });
                console.log(
                    `✅ Column ${col.name} restored to user table (rollback)`,
                );
            } catch {
                console.log(`⚠️  Column ${col.name} already exists - skipping`);
            }
        }

        // Восстанавливаем индексы
        const indexes = [
            { fields: ['is_vip_customer'], name: 'idx_user_vip' },
            { fields: ['is_beta_tester'], name: 'idx_user_beta_tester' },
            { fields: ['is_premium'], name: 'idx_user_premium' },
            { fields: ['is_affiliate'], name: 'idx_user_is_affiliate' },
            { fields: ['is_employee'], name: 'idx_user_is_employee' },
            { fields: ['is_high_value'], name: 'idx_user_is_high_value' },
            { fields: ['is_wholesale'], name: 'idx_user_is_wholesale' },
        ];

        for (const idx of indexes) {
            try {
                await queryInterface.addIndex('user', idx.fields, {
                    name: idx.name,
                });
                console.log(
                    `✅ Index ${idx.name} restored to user table (rollback)`,
                );
            } catch {
                console.log(`⚠️  Index ${idx.name} already exists - skipping`);
            }
        }
    },
};

export default migration;
