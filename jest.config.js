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
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: {
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true
      }
    }]
  },
  
  // Алиасы путей
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1'
  },
  
  // Игнорируем трансформацию для некоторых модулей
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],
  
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
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Загрузка environment переменных перед тестами
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.ts'],
  
  // Очистка моков между тестами
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose режим для детального вывода
  verbose: true,
  
  // HTML репортеры для результатов тестов
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'test-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'Online Store Backend - Test Results',
      logoImgPath: undefined,
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
  
  // Настройки для CI/CD
  detectOpenHandles: true,
  forceExit: true,
  
  // Игнорируем node_modules и dist
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/']
};
