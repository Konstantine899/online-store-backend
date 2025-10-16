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

export { MockFactories, TEST_CONSTANTS, CART_TEST_CONSTANTS } from './mock-factories';
export { TestDataBuilders } from './test-data-builders';
export { PerformanceTesting, Benchmark, LoadTestDataFactory } from './performance-testing';
export { TestCleanup } from './test-cleanup';
export { TestDataFactory } from './test-data-factory';
export { TestTransaction } from './test-transaction';
