/**
 * Jest E2E Configuration
 *
 * Специальная конфигурация для E2E (end-to-end) тестов.
 * Отличия от обычных integration тестов:
 * - Более длинный timeout (60s вместо 30s)
 * - Sequential execution (maxWorkers: 1)
 * - Полные user journeys без моков
 * - Реальная БД с seed данными
 */

module.exports = {
    // TypeScript support
    preset: 'ts-jest',
    testEnvironment: 'node',

    // File extensions
    moduleFileExtensions: ['js', 'json', 'ts'],

    // TypeScript transformation
    transform: {
        '^.+\\.(t|j)s$': [
            'ts-jest',
            {
                tsconfig: {
                    moduleResolution: 'node',
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                    experimentalDecorators: true,
                    emitDecoratorMetadata: true,
                },
                isolatedModules: true,
                diagnostics: false,
            },
        ],
    },

    // Module resolution
    moduleNameMapper: {
        '^@app/(.*)$': '<rootDir>/src/$1',
    },

    // Transform ignore patterns
    transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],

    // Только E2E тесты
    testMatch: ['<rootDir>/tests/e2e/**/*.e2e.test.ts'],

    // E2E setup
    setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.ts'],

    // E2E тесты медленнее - увеличиваем timeout
    testTimeout: 60000, // 60 секунд

    // Sequential execution для стабильности
    maxWorkers: 1,

    // Отключаем coverage для E2E (фокус на функциональности, не покрытии)
    collectCoverage: false,

    // Display name для удобства
    displayName: {
        name: 'E2E',
        color: 'magenta',
    },

    // Отключаем параллельные запуски (E2E должны идти последовательно)
    bail: 1, // Останавливаем на первой ошибке

    // Более verbose output для отладки
    verbose: true,

    // Отключаем fake timers (E2E работает с реальным временем)
    fakeTimers: {
        enableGlobally: false,
    },

    // Mocks
    clearMocks: true,
    restoreMocks: true,
};
