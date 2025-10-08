// Определяем окружение для оптимизации
const isCI = process.env.CI === 'true';
const isDebug = process.argv.includes('--debug') || process.argv.includes('--detectOpenHandles');

// Общие настройки для переиспользования
const commonConfig = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'json', 'ts'],
    transform: {
        '^.+\\.(t|j)s$': ['ts-jest', {
            tsconfig: {
                moduleResolution: 'node',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                experimentalDecorators: true,
                emitDecoratorMetadata: true
            },
            // Оптимизации ts-jest для быстрой трансформации
            isolatedModules: true,  // Отключить проверку типов между модулями (в 2-3× быстрее)
            diagnostics: false,      // TypeScript диагностика уже выполнена линтером
        }]
    },
    moduleNameMapper: {
        '^@app/(.*)$': '<rootDir>/src/$1'
    },
    transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
    setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.ts'],
    clearMocks: true,
    restoreMocks: true,
};

module.exports = {
    // Projects configuration - основная конфигурация
    projects: [
        {
            ...commonConfig,
            displayName: 'unit',
            testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
            testTimeout: 5000, // Unit тесты должны быть быстрыми
        },
        {
            ...commonConfig,
            displayName: 'integration',
            testMatch: [
                '<rootDir>/tests/integration/**/*.test.ts',
                '<rootDir>/src/**/*.integration.test.ts'
            ],
            testTimeout: 30000, // Integration тесты могут быть медленнее
            maxWorkers: 1, // Запускать интеграционные тесты последовательно (избегаем race conditions)
        }
    ],

    // Coverage configuration - V8 для максимальной производительности
    coverageProvider: 'v8',  // В 3-5× быстрее, чем babel coverage
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/**/*.spec.ts',
        '!src/**/*.test.ts',
        '!src/**/*.integration.test.ts',
        '!src/main.ts',
        '!src/**/*.module.ts',
        '!src/**/*.dto.ts',
        '!src/**/*.interface.ts',
        '!src/**/*.response.ts',
        '!src/**/*.request.ts'
    ],
    coverageDirectory: 'coverage',
    // В CI минимум репортеров для скорости, локально - с HTML
    coverageReporters: isCI 
        ? ['text-summary', 'lcov'] // text-summary быстрее чем text в CI
        : ['text', 'lcov', 'html', 'json-summary'],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
        }
    },

    // HTML репортер только для локальной разработки (медленный в CI)
    reporters: isCI
        ? ['default', 'github-actions'] // GitHub Actions reporter для аннотаций
        : [
            'default',
            ['jest-html-reporters', {
                publicPath: './test-reports',
                filename: 'test-report.html',
                expand: true,
                hideIcon: false,
                pageTitle: 'Online Store Backend - Test Results',
                darkTheme: false,
                includeFailureMsg: true,
                includeSuiteFailure: true,
                includeConsoleLog: true,
                includeStackTrace: true,
                includeObsoleteSnapshots: true,
                reportTitle: 'Test Results Report',
                sort: 'status'
            }]
        ],

    // Оптимизации производительности
    cache: true,
    cacheDirectory: '<rootDir>/.jest-cache',
    
    // Worker threads вместо child processes (на 10-15% быстрее)
    workerThreads: true,
    
    // Параллелизм: CI - 2 воркера (стабильность), локально - 50% CPU
    maxWorkers: isCI ? 2 : '50%',
    
    // Memory management: перезапуск воркеров при превышении лимита памяти
    workerIdleMemoryLimit: isCI ? '256MB' : '512MB', // В CI строже с памятью
    
    // Fail-fast в CI: останавливаться на первой ошибке (экономит время)
    bail: isCI ? 1 : 0,

    // detectOpenHandles только для отладки (замедляет ~15-20%)
    detectOpenHandles: isDebug,
    
    // Silent mode в CI для производительности (меньше I/O)
    silent: isCI && !isDebug,
    verbose: isDebug,

    // Игнорируем node_modules и dist
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
    
    // Не запускать тесты из node_modules
    watchPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
    
    // Нотификации отключены (требуют optional dependency node-notifier)
    notify: false,
};
