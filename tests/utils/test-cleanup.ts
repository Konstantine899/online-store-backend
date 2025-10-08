import { Sequelize } from 'sequelize-typescript';

/**
 * TestCleanup - централизованная очистка БД между тестами
 *
 * Назначение:
 * - Предотвращение database pollution
 * - Изоляция тестов друг от друга
 * - Правильный порядок cleanup (FK constraints)
 * - DRY принцип для cleanup кода
 *
 * Использование:
 * ```typescript
 * afterEach(async () => {
 *     const sequelize = app.get(Sequelize);
 *     await TestCleanup.cleanUsers(sequelize);
 * });
 * ```
 *
 * Или для полного cleanup:
 * ```typescript
 * afterEach(async () => {
 *     const sequelize = app.get(Sequelize);
 *     await TestCleanup.cleanAll(sequelize);
 * });
 * ```
 */
export class TestCleanup {
    /**
     * Очищает временных пользователей (id > 14) и связанные данные
     * Порядок важен - соблюдаются FK constraints
     *
     * Удаляет:
     * - user_role (связи пользователь-роль)
     * - refresh_token (refresh токены)
     * - login_history (история входов)
     * - user_address (адреса пользователей)
     * - user (сами пользователи)
     */
    static async cleanUsers(sequelize: Sequelize): Promise<void> {
        // Порядок критичен - сначала зависимые таблицы, потом родительская
        await sequelize.query(`DELETE FROM user_role WHERE user_id > 14`);
        await sequelize.query(`DELETE FROM refresh_token WHERE user_id > 14`);
        await sequelize.query(`DELETE FROM login_history WHERE user_id > 14`);
        await sequelize.query(`DELETE FROM user_address WHERE user_id > 14`);
        await sequelize.query(`DELETE FROM user WHERE id > 14`);
    }

    /**
     * Сбрасывает user 13 (user@example.com) к дефолтным значениям
     *
     * Используется в тестах, которые модифицируют существующего пользователя:
     * - user-admin тесты (флаги)
     * - user-profile тесты (phone, имя)
     */
    static async resetUser13(sequelize: Sequelize): Promise<void> {
        // Сброс всех флагов к дефолту
        await sequelize.query(`
            UPDATE user SET
                is_blocked = 0,
                is_suspended = 0,
                is_deleted = 0,
                is_premium = 0,
                is_employee = 0,
                is_vip_customer = 0,
                is_high_value = 0,
                is_wholesale = 0,
                is_affiliate = 0,
                is_active = 1,
                phone = '+79990000013',
                first_name = NULL,
                last_name = NULL
            WHERE id = 13
        `);

        // Очищаем добавленные роли (оставляем только CUSTOMER с role_id = 10)
        await sequelize.query(`
            DELETE FROM user_role
            WHERE user_id = 13 AND role_id != 10
        `);

        // Убеждаемся что роль CUSTOMER существует
        await sequelize.query(`
            INSERT IGNORE INTO user_role (user_id, role_id, created_at, updated_at)
            VALUES (13, 10, NOW(), NOW())
        `);
    }

    /**
     * Очищает адреса пользователя 13
     * Используется в user-addresses тестах
     */
    static async cleanUser13Addresses(sequelize: Sequelize): Promise<void> {
        await sequelize.query(`DELETE FROM user_address WHERE user_id = 13`);
    }

    /**
     * Очищает корзины и связанные данные
     */
    static async cleanCarts(sequelize: Sequelize): Promise<void> {
        await sequelize.query(`DELETE FROM cart_product WHERE cart_id > 0`);
        await sequelize.query(`DELETE FROM cart WHERE id > 0`);
    }

    /**
     * Очищает заказы и связанные данные
     */
    static async cleanOrders(sequelize: Sequelize): Promise<void> {
        await sequelize.query(`DELETE FROM order_item WHERE order_id > 0`);
        await sequelize.query(`DELETE FROM \`order\` WHERE id > 0`);
    }

    /**
     * Полная очистка всех тестовых данных
     * Использовать с осторожностью - очищает все временные данные
     */
    static async cleanAll(sequelize: Sequelize): Promise<void> {
        // Порядок важен - FK constraints
        await this.cleanOrders(sequelize);
        await this.cleanCarts(sequelize);
        await this.cleanUsers(sequelize);
    }

    /**
     * Очистка только связанных с аутентификацией данных
     * Подходит для auth/rbac тестов
     */
    static async cleanAuthData(sequelize: Sequelize): Promise<void> {
        await sequelize.query(`DELETE FROM login_history WHERE user_id > 14`);
        await sequelize.query(`DELETE FROM refresh_token WHERE user_id > 14`);
    }
}
