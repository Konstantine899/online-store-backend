import type { Transaction } from 'sequelize';
import type { Sequelize } from 'sequelize-typescript';

/**
 * TestTransaction - изоляция тестов через транзакции
 *
 * Назначение:
 * - Автоматический rollback после каждого теста
 * - Полная изоляция тестов без ручного cleanup
 * - Быстрее чем cleanup (rollback vs DELETE queries)
 *
 * Использование:
 * ```typescript
 * describe('My tests with transaction isolation', () => {
 *     let transaction: Transaction;
 *
 *     beforeEach(async () => {
 *         const sequelize = app.get(Sequelize);
 *         transaction = await TestTransaction.start(sequelize);
 *     });
 *
 *     afterEach(async () => {
 *         await TestTransaction.rollback(transaction);
 *     });
 *
 *     it('test will be rolled back automatically', async () => {
 *         // Все изменения в БД будут отменены после теста
 *     });
 * });
 * ```
 *
 * Ограничения:
 * - Не работает с тестами, которые делают commit внутри (например, сервисы с транзакциями)
 * - Не подходит для тестов с параллельными запросами к одной записи
 * - DDL операции (ALTER TABLE) не откатываются в некоторых БД
 */
export class TestTransaction {
    /**
     * Начинает новую транзакцию для изоляции теста
     * @param sequelize - Sequelize инстанс
     * @returns Transaction объект для rollback
     */
    static async start(sequelize: Sequelize): Promise<Transaction> {
        const transaction = await sequelize.transaction();
        return transaction;
    }

    /**
     * Откатывает транзакцию, отменяя все изменения теста
     * @param transaction - Transaction объект из start()
     */
    static async rollback(transaction: Transaction | null): Promise<void> {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (error) {
                // Игнорируем ошибки rollback (транзакция могла быть уже закрыта)
                console.warn('Transaction rollback warning:', error);
            }
        }
    }

    /**
     * Wrapper для тестовой функции с автоматическим rollback
     *
     * @example
     * ```typescript
     * it('test with auto rollback', async () => {
     *     await TestTransaction.run(sequelize, async (transaction) => {
     *         // Все изменения откатятся автоматически
     *         await userRepository.create({ email: 'test@test.com' }, { transaction });
     *     });
     * });
     * ```
     */
    static async run<T>(
        sequelize: Sequelize,
        testFn: (transaction: Transaction) => Promise<T>,
    ): Promise<T> {
        const transaction = await this.start(sequelize);
        try {
            const result = await testFn(transaction);
            return result;
        } finally {
            await this.rollback(transaction);
        }
    }

    /**
     * Создает wrapper для всего test suite с транзакционной изоляцией
     *
     * @example
     * ```typescript
     * describe('My isolated suite', () => {
     *     const { beforeEach, afterEach } = TestTransaction.suite(() => app.get(Sequelize));
     *
     *     // Используем возвращенные hooks
     *     beforeEach();
     *     afterEach();
     *
     *     it('test 1', async () => { ... });
     *     it('test 2', async () => { ... });
     * });
     * ```
     */
    static suite(getSequelize: () => Sequelize) {
        let transaction: Transaction | null = null;

        return {
            beforeEach: async () => {
                const sequelize = getSequelize();
                transaction = await TestTransaction.start(sequelize);
            },
            afterEach: async () => {
                await TestTransaction.rollback(transaction);
                transaction = null;
            },
        };
    }
}
