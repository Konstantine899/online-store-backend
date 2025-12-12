/**
 * Test Utilities - переиспользуемые компоненты для тестов
 *
 * Модули:
 * - TestDataFactory - генерация уникальных тестовых данных
 * - TestCleanup - централизованная очистка БД
 * - TestTransaction - изоляция тестов через транзакции (для unit тестов)
 * - MockFactories - стандартизированные моки для unit тестов
 *
 * Документация: см. README.md в этой директории
 */

export {
    CART_TEST_CONSTANTS,
    MockFactories,
    TEST_CONSTANTS,
} from './mock-factories';
export {
    Benchmark,
    LoadTestDataFactory,
    PerformanceTesting,
} from './performance-testing';
export { TestCleanup } from './test-cleanup';
export { TestDataBuilders } from './test-data-builders';
export { TestDataFactory } from './test-data-factory';
export { TestDatabaseSetup } from './test-database-setup';
export { TestTransaction } from './test-transaction';
