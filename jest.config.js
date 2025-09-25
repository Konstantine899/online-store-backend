module.exports = {
  // Базовые настройки
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Расширения файлов
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Паттерны для поиска тестов
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.js',
    '**/src/**/*.spec.ts',
    '**/src/**/*.test.ts'
  ],
  
  // Трансформация файлов
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  
  // Алиасы путей (как в tsconfig.json)
  moduleNameMapping: {
    '^@app/(.*)$': '<rootDir>/src/$1'
  },
  
  // Настройки для TypeScript
  globals: {
    'ts-jest': {
      tsconfig: {
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true
      }
    }
  },
  
  // Настройки для coverage
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.response.ts',
    '!src/**/*.request.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Настройки для разных типов тестов
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/unit.setup.ts']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/integration.setup.ts'],
      testTimeout: 30000 // 30 секунд для интеграционных тестов
    }
  ],
  
  // Глобальные настройки
  setupFilesAfterEnv: ['<rootDir>/tests/setup/global.setup.ts'],
  
  // Очистка моков между тестами
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose режим для детального вывода
  verbose: true,
  
  // Настройки для CI/CD
  detectOpenHandles: true,
  forceExit: true,
  
  // Игнорируем node_modules и dist
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  
  // Настройки для работы с переменными окружения
  setupFiles: ['<rootDir>/tests/setup/env.setup.ts']
};
