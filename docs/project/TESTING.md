# 🧪 Testing Documentation

## Уровни тестирования

### Unit тесты

- **Назначение**: тестирование отдельных компонентов
- **Моки**: все внешние зависимости
- **Без доступа**: к БД, файлам, сети
- **Покрытие**: сервисы, пайпы, гварды, валидаторы
- **Конфигурация**: `jest --selectProjects unit`

### Integration тесты

- **Назначение**: тестирование взаимодействия компонентов
- **Реальная БД**: через Sequelize с тестовой БД
- **HTTP слой**: реальные HTTP запросы
- **Покрытие**: контроллеры, репозитории, middleware
- **Конфигурация**: `jest --selectProjects integration --runInBand`

### E2E тесты

- **Назначение**: сквозные сценарии
- **Полный стек**: от HTTP до БД
- **Покрытие**: ключевые пользовательские флоу
- **Конфигурация**: `jest --config ./jest.e2e.config.js`

## Тестовые утилиты

### TestDataFactory

Генерация уникальных тестовых данных для предотвращения race conditions.

**Методы**:

- `uniqueEmail()` - уникальный email адрес
- `uniquePhone()` - уникальный российский телефон
- `createUserDto(overrides)` - DTO для создания пользователя
- `randomFirstName()` - случайное имя
- `randomLastName()` - случайная фамилия
- `createAddress(overrides)` - генерация адреса
- `createAuthenticatedUser()` - создание авторизованного пользователя

#### Детальные тестовые утилиты

**TestDataFactory с дополнительными методами:**
```typescript
export class TestDataFactory {
    private static userCounter = 0;
    
    /**
     * Генерирует уникальный email адрес
     * Формат: test.user.{timestamp}.{random}@test.com
     */
    static uniqueEmail(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `test.user.${timestamp}.${random}@test.com`;
    }
    
    /**
     * Создаёт пользователя напрямую в БД (быстрее чем через API)
     * Используется когда не нужна полная регистрация
     */
    static async createUserInDB(
        sequelize: Sequelize,
        overrides: Partial<{
            email: string;
            password: string;
            phone: string;
            firstName: string;
            lastName: string;
            role: string;
        }> = {},
    ): Promise<{
        userId: number;
        email: string;
        password: string;
        id: number;
    }> {
        this.userCounter++;
        const email = overrides.email || this.uniqueEmail();
        const password = overrides.password || 'TestPass123!';
        const passwordHash = await hash(password, 10);
        const phone = overrides.phone || this.uniquePhone();
        
        // Находим роль с retry logic (для параллельных тестов)
        const roleName = overrides.role || 'USER';
        let role = await RoleModel.findOne({ where: { role: roleName } });
        
        // Retry до 3 раз с экспоненциальной задержкой (для race conditions в parallel tests)
        if (!role) {
            const maxRetries = 3;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                await new Promise((resolve) =>
                    setTimeout(resolve, 100 * attempt),
                );
                role = await RoleModel.findOne({ where: { role: roleName } });
                if (role) break;
            }
        }
        
        if (!role) {
            throw new Error(
                `Role ${roleName} not found in database after ${3} retries`,
            );
        }
        
        // Создаём пользователя через Sequelize Model (безопаснее чем raw SQL)
        const user = await UserModel.create({
            email,
            password: passwordHash,
            phone,
            firstName: overrides.firstName || null,
            lastName: overrides.lastName || null,
            isActive: true,
            isVerified: true,
        });
        
        // Связываем пользователя с ролью
        await UserRoleModel.create({
            user_id: user.id,
            role_id: role.id,
        });
        
        return {
            userId: user.id,
            email,
            password,
            id: user.id,
        };
    }
    
    /**
     * Создаёт пользователя в БД с определённой ролью и возвращает токен
     * Комбинация createUserInDB + loginUser для быстрых тестов
     */
    static async createUserWithRole(
        app: INestApplication,
        role: string = 'USER',
        overrides: Partial<{
            email: string;
            password: string;
            firstName: string;
            lastName: string;
        }> = {},
    ): Promise<{
        userId: number;
        email: string;
        password: string;
        token: string;
        user: { userId: number; email: string };
    }> {
        const sequelize = app.get(Sequelize);
        const { userId, email, password } = await this.createUserInDB(
            sequelize,
            { ...overrides, role },
        );
        
        const token = await this.loginUser(app, email, password);
        
        return {
            userId,
            email,
            password,
            token,
            user: { userId, email },
        };
    }
}
```

**MockFactories с полным набором моков:**
```typescript
export class MockFactories {
    // ==================== CART MODULE ====================
    
    /**
     * Создает мок CartRepository с базовыми методами
     */
    static createCartRepository() {
        return {
            findCart: jest.fn(),
            createCart: jest.fn(),
            appendToCart: jest.fn(),
            increment: jest.fn(),
            decrement: jest.fn(),
            removeFromCart: jest.fn(),
            clearCart: jest.fn(),
        };
    }
    
    /**
     * Создает мок CartModel с базовыми методами и свойствами
     */
    static createCartModel(overrides: Partial<CartModel> = {}): Partial<CartModel> {
        const defaultCart = {
            id: 1,
            tenant_id: 1,
            user_id: undefined,
            session_id: 'sess_test_123',
            status: CART_STATUS.ACTIVE,
            total_amount: 0,
            discount: 0,
            products: [],
            recalculateTotal: jest.fn().mockResolvedValue(undefined),
            setExpirationDate: jest.fn(),
            save: jest.fn().mockResolvedValue(undefined),
            reload: jest.fn().mockResolvedValue(undefined),
            applyPromoCode: jest.fn().mockResolvedValue(undefined),
            removePromoCode: jest.fn().mockResolvedValue(undefined),
            convertToAuthenticated: jest.fn().mockResolvedValue(undefined),
            getSubtotal: jest.fn().mockReturnValue(1000),
        };
        
        return { ...defaultCart, ...overrides };
    }
    
    // ==================== COMPOSITE FACTORIES ====================
    
    /**
     * Создает полный набор провайдеров для CartService тестов
     */
    static createCartServiceProviders(config: {
        tenantId?: number;
        mockCart?: Partial<CartModel>;
        mockProduct?: Partial<ProductModel>;
        mockPromoCodeService?: unknown;
    } = {}) {
        const {
            tenantId = 1,
            mockPromoCodeService = this.createPromoCodeService(),
        } = config;
        
        return [
            {
                provide: 'CartRepository',
                useValue: this.createCartRepository(),
            },
            {
                provide: 'ProductRepository',
                useValue: this.createProductRepository(),
            },
            {
                provide: 'PromoCodeService',
                useValue: mockPromoCodeService,
            },
            {
                provide: 'PromoCodeRepository',
                useValue: this.createPromoCodeRepository(),
            },
            {
                provide: 'TenantContext',
                useValue: this.createTenantContext(tenantId),
            },
        ];
    }
}
```

**TEST_CONSTANTS для стандартизации:**
```typescript
/**
 * Константы для тестов всех модулей
 */
export const TEST_CONSTANTS = {
    // Cart constants
    CART: {
        PRODUCT_PRICE: 1000,
        CART_ID: 1,
        PRODUCT_ID: 1,
        USER_ID: 1,
        TENANT_ID: 1,
        SESSION_ID: 'sess_test_123',
        PROMO_CODE: 'PROMO10',
        PROMO_DISCOUNT: 100,
        LARGE_QUANTITY: 1000,
    },
    
    // User constants
    USER: {
        ID: 1,
        EMAIL: 'test@example.com',
        PHONE: '+79991234567',
        FIRST_NAME: 'Test',
        LAST_NAME: 'User',
    },
    
    // Product constants
    PRODUCT: {
        ID: 1,
        NAME: 'Test Product',
        PRICE: 1000,
        SKU: 'TEST-SKU-001',
        CATEGORY_ID: 1,
        BRAND_ID: 1,
    },
    
    // Order constants
    ORDER: {
        ID: 1,
        STATUS: 'pending',
        TOTAL_AMOUNT: 1000,
        PAYMENT_METHOD: 'card',
    },
    
    // Common constants
    COMMON: {
        TENANT_ID: 1,
        TIMESTAMP: new Date('2025-01-01T00:00:00Z'),
    },
} as const;
```

### TestCleanup

Централизованная очистка БД для изоляции тестов.

**Методы**:

- `cleanUsers(sequelize)` - очистка временных пользователей (id > 14)
- `resetUser13(sequelize)` - сброс user 13 к дефолтным значениям
- `cleanUser13Addresses(sequelize)` - очистка адресов user 13
- `cleanAuthData(sequelize)` - очистка login_history + refresh_token
- `cleanOrders(sequelize)` - очистка заказов
- `cleanCarts(sequelize)` - очистка корзин
- `cleanAll(sequelize)` - полная очистка всех данных

**Пример**:

```typescript
import { TestCleanup } from '../utils';

afterEach(async () => {
    const sequelize = app.get(Sequelize);
    await TestCleanup.resetUser13(sequelize);
    await TestCleanup.cleanUsers(sequelize);
});
```

### TestTransaction

Изоляция тестов через транзакции для unit тестов репозиториев.

**Возможности**:

- Автоматический rollback после каждого теста
- Полная изоляция без ручного cleanup
- Быстрее чем TestCleanup
- Подходит для unit тестов репозиториев

**Ограничения**:

- Не работает с вложенными транзакциями
- Не поддерживает DDL операции
- Сложнее debugging

**Пример**:

```typescript
import { TestTransaction } from '../utils';

describe('UserRepository', () => {
    beforeEach(async () => {
        await TestTransaction.begin();
    });

    afterEach(async () => {
        await TestTransaction.rollback();
    });
});
```

### MockFactories

Стандартизированные моки для unit тестов.

**Возможности**:

- Создание моков сервисов
- Создание моков репозиториев
- Создание моков моделей
- Стандартные ответы для тестов

## Jest конфигурация

### Performance оптимизации

- **`isolatedModules`**: ускорение компиляции TypeScript
- **`diagnostics: false`**: отключение медленных проверок
- **Кэширование**: TypeScript, Jest, npm dependencies
- **Параллелизация**: unit тесты параллельно, integration последовательно

#### Детальная Jest конфигурация

**Performance оптимизации:**
```javascript
// jest.config.js
const commonConfig = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)s$': [
            'ts-jest',
            {
                // Оптимизации ts-jest для быстрой трансформации
                isolatedModules: true, // Отключить проверку типов между модулями (в 2-3× быстрее)
                diagnostics: false, // TypeScript диагностика уже выполнена линтером
            },
        ],
    ],
    // Coverage provider: V8 для максимальной производительности
    coverageProvider: 'v8', // В 3-5× быстрее, чем babel coverage
    // Worker threads вместо child processes (на 10-15% быстрее)
    workerThreads: true,
    // Memory management: перезапуск воркеров при превышении лимита памяти
    workerIdleMemoryLimit: isCI ? '256MB' : '512MB',
};
```

**CI оптимизации:**
```javascript
// CI-специфичные настройки
const isCI = process.env.CI === 'true';

module.exports = {
    // Fail-fast в CI: останавливаться на первой ошибке (экономит время)
    bail: isCI ? 1 : 0,
    // Silent mode в CI для производительности (меньше I/O)
    silent: isCI && !isDebug,
    // Параллелизм: CI - 2 воркера (стабильность), локально - 50% CPU
    maxWorkers: isCI ? 2 : '50%',
    // В CI минимум репортеров для скорости, локально - с HTML
    coverageReporters: isCI
        ? ['text-summary', 'lcov'] // text-summary быстрее чем text в CI
        : ['text', 'lcov', 'html', 'json-summary'],
};
```

**Project конфигурации:**
```javascript
// Projects configuration - основная конфигурация
projects: [
    {
        ...commonConfig,
        displayName: 'unit',
        testMatch: [
            '<rootDir>/tests/unit/**/*.test.ts',
            '<rootDir>/src/**/*.unit.test.ts',
        ],
        testTimeout: 5000, // Unit тесты должны быть быстрыми
    },
    {
        ...commonConfig,
        displayName: 'integration',
        testMatch: [
            '<rootDir>/tests/integration/**/*.test.ts',
            '<rootDir>/src/**/*.integration.test.ts',
        ],
        testTimeout: 30000, // Integration тесты могут быть медленнее
        // Sequential локально (стабильность), параллельно в CI (скорость)
        maxWorkers: isCI && !isDebug ? 4 : 1,
    },
],
```

**Coverage thresholds:**
```javascript
coverageThreshold: {
    global: {
        branches: 70, // Current: 72.43% → Target: 70% (safe margin)
        functions: 60, // Current: 62.07% → Target: 60% (safe margin)
        lines: 70, // Current: 73.73% → Target: 70% (safe margin)
        statements: 70, // Current: 73.73% → Target: 70% (safe margin)
    },
    
    // CRITICAL: Auth Services (High security impact)
    './src/infrastructure/services/auth/**/*.ts': {
        branches: 65,
        functions: 75,
        lines: 85,
        statements: 85,
    },
    
    // CRITICAL: Security Guards (High security impact)
    './src/infrastructure/common/guards/**/*.ts': {
        branches: 35, // Conservative: actual 38-99% mixed
        functions: 75,
        lines: 60,
        statements: 60,
    },
    
    // HIGH: Token Services (Security critical)
    './src/infrastructure/services/token/**/*.ts': {
        branches: 75, // Actual: 75.92%
        functions: 90,
        lines: 90,
        statements: 90,
    },
},
```

## Структура тестов

### Именование файлов

- **Unit**: `*.unit.test.ts`
- **Integration**: `*.integration.test.ts`
- **E2E**: `*.e2e.test.ts`

### Каталоги

- `tests/unit/` - unit тесты
- `tests/integration/` - integration тесты
- `tests/e2e/` - E2E тесты
- `tests/setup/` - общие настройки
- `tests/utils/` - тестовые утилиты

### Правило AAA

- **Arrange** - подготовка данных
- **Act** - выполнение действия
- **Assert** - проверка результата

## База данных для тестов

### Подготовка

- Чистая БД перед запуском
- Применение миграций
- Минимальные сиды

### Изоляция

- Транзакции с rollback на тест/сьют
- Или сброс данными сидов
- Использование фабрик/билдеров

### Данные

- Использование фабрик вместо "магических" констант
- Фиксация ожиданий явно
- Предотвращение скрытых зависимостей

## Покрытие и CI-гейты

### Критичные модули

- **Auth, orders, payments, security**: покрытие ≥ 80%
- **CI**: блокировка merge при падении тестов
- **На релизах**: отчет о покрытии

### Критерии качества

- Чёткие названия тестов
- Негативные кейсы обязательны
- Без скрытых зависимостей между тестами
- Явные ожидания по формату ответа/ошибок

## Производительность тестов

### Параллелизация

- Без гонок данных
- Аккуратно с глобальными `beforeAll/afterAll`
- Минимизация "тяжёлых" сидов

### Время прохождения

- Часть критерия PR
- Не допускать деградаций без причины
- Оптимизация медленных тестов

## Чек-лист PR (тесты)

- [ ] Добавлены unit тесты для новых сервисов/пайпов/гвардов
- [ ] Для новых endpoints/репозиториев есть интеграционные тесты
- [ ] Проверены негативные сценарии (валидация/guard/429/403/404)
- [ ] Покрытие критичных модулей не просело (< 80% недопустимо)
- [ ] Тесты стабильные (без флапов)
- [ ] Не зависят от порядка выполнения

## Детальная настройка тестов

### Jest setup

**Загрузка environment переменных:**
```typescript
// tests/jest-setup.ts
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Jest global setup - загружает .test.env перед запуском тестов
 * 
 * Этот файл выполняется перед всеми тестами и обеспечивает
 * наличие необходимых environment переменных для unit-тестов.
 */

// Загружаем .test.env из корня проекта
const envPath = path.resolve(__dirname, '../.test.env');

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn(
        `⚠️  Не удалось загрузить .test.env из ${envPath}. ` +
            `Unit-тесты могут упасть из-за отсутствия env переменных.`,
    );
    console.warn(`Ошибка: ${result.error.message}`);
} else {
    console.log(`✅ Environment loaded from ${envPath}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   DEBUG_SQL: ${process.env.DEBUG_SQL || 'false'}`);
}

/**
 * Подавление SQL логов в тестах (если DEBUG_SQL не включен)
 * 
 * Sequelize может логировать через console.log даже при logging:false.
 * Перехватываем и фильтруем SQL-подобные логи для чистого вывода.
 */
```

**Test app setup с graceful shutdown:**
```typescript
// tests/setup/app.ts
import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { TestAppModule } from './test-app.module';
import 'dotenv/config';
import { UserModel } from '@app/domain/models';
import { CustomValidationPipe } from '@app/infrastructure/pipes/custom-validation-pipe';
import cookieParser from 'cookie-parser';
import { BruteforceGuard } from '@app/infrastructure/common/guards';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getConfig } from '@app/infrastructure/config';
import { Sequelize } from 'sequelize-typescript';

/**
 * Карта активных приложений для предотвращения утечек
 * Используется для graceful shutdown всех connection pools
 */
const activeApps = new Set<INestApplication>();

/**
 * Graceful shutdown всех приложений (вызывается в globalTeardown)
 */
export async function closeAllApps(): Promise<void> {
    const apps = Array.from(activeApps);
    await Promise.all(apps.map((app) => app.close()));
    activeApps.clear();
}

/**
 * Добавляет graceful shutdown для Sequelize connection pool
 * Предотвращает утечки соединений между test suites
 */
function addGracefulShutdown(app: INestApplication): void {
    const sequelize = app.get(Sequelize);
    const originalClose = app.close.bind(app);

    app.close = async () => {
        try {
            // 1. Закрываем все активные соединения
            await sequelize.connectionManager.close();

            // 2. Закрываем приложение
            await originalClose();

            // 3. Удаляем из трекинга
            activeApps.delete(app);
        } catch (error) {
            console.error('Error during graceful shutdown:', error);
            throw error;
        }
    };
}
```

**E2E конфигурация:**
```javascript
// jest.e2e.config.js
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
```

## Performance Testing Framework

### Бенчмарки и нагрузочное тестирование

**PerformanceTesting класс:**
```typescript
/**
 * Performance Testing Framework - инструменты для тестирования производительности
 * 
 * Назначение:
 * - Бенчмарки для критичных операций
 * - Нагрузочное тестирование API endpoints
 * - Мониторинг производительности в CI
 * - Автоматическое выявление регрессий
 */

export interface BenchmarkResult {
    name: string;
    duration: number;
    iterations: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    throughput: number; // операций в секунду
    memoryUsage?: NodeJS.MemoryUsage;
    timestamp: Date;
}

export interface BenchmarkConfig {
    iterations?: number;
    warmupIterations?: number;
    timeout?: number;
    memoryTracking?: boolean;
    threshold?: {
        maxAverageDuration?: number;
        maxMemoryUsage?: number;
    };
}

export class PerformanceTesting {
    private static logger = new Logger(PerformanceTesting.name);
    private static results: BenchmarkResult[] = [];
    
    /**
     * Выполняет бенчмарк операции
     */
    static async benchmark<T>(
        name: string,
        operation: () => Promise<T>,
        config: BenchmarkConfig = {},
    ): Promise<BenchmarkResult> {
        const {
            iterations = 100,
            warmupIterations = 10,
            timeout = 30000,
            memoryTracking = false,
            threshold = {},
        } = config;

        this.logger.log(`Starting benchmark: ${name}`);

        // Прогрев
        if (warmupIterations > 0) {
            this.logger.debug(`Warming up with ${warmupIterations} iterations`);
            for (let i = 0; i < warmupIterations; i++) {
                await operation();
            }
        }

        const durations: number[] = [];
        const startTime = process.hrtime.bigint();
        let memoryBefore: NodeJS.MemoryUsage | undefined;

        if (memoryTracking) {
            memoryBefore = process.memoryUsage();
        }

        // Основные итерации
        for (let i = 0; i < iterations; i++) {
            const iterationStart = process.hrtime.bigint();

            try {
                await Promise.race([
                    operation(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), timeout),
                    ),
                ]);
            } catch (error) {
                this.logger.error(`Benchmark iteration ${i} failed:`, error);
                throw error;
            }

            const iterationEnd = process.hrtime.bigint();
            const duration = Number(iterationEnd - iterationStart) / 1_000_000; // в миллисекундах
            durations.push(duration);
        }

        const endTime = process.hrtime.bigint();
        const totalDuration = Number(endTime - startTime) / 1_000_000;

        const result: BenchmarkResult = {
            name,
            duration: totalDuration,
            iterations,
            averageDuration:
                durations.reduce((a, b) => a + b, 0) / durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            throughput: (iterations / totalDuration) * 1000, // операций в секунду
            memoryUsage: memoryTracking ? process.memoryUsage() : undefined,
            timestamp: new Date(),
        };

        // Проверка пороговых значений
        if (
            threshold.maxAverageDuration &&
            result.averageDuration > threshold.maxAverageDuration
        ) {
            this.logger.warn(
                `Benchmark ${name}: average duration ${result.averageDuration}ms exceeds threshold ${threshold.maxAverageDuration}ms`,
            );
        }

        if (threshold.maxMemoryUsage && memoryBefore && result.memoryUsage) {
            const memoryIncrease =
                result.memoryUsage.heapUsed - memoryBefore.heapUsed;
            if (memoryIncrease > threshold.maxMemoryUsage) {
                this.logger.warn(
                    `Benchmark ${name}: memory increase ${memoryIncrease} bytes exceeds threshold ${threshold.maxMemoryUsage} bytes`,
                );
            }
        }

        this.results.push(result);
        this.logger.log(
            `Benchmark ${name} completed: ${result.averageDuration.toFixed(2)}ms average`,
        );

        return result;
    }
    
    /**
     * Генерирует отчет о производительности
     */
    static generateReport(): string {
        const benchmarkResults = this.getBenchmarkResults();

        let report = '# Performance Test Report\n\n';
        report += `Generated at: ${new Date().toISOString()}\n\n`;

        if (benchmarkResults.length > 0) {
            report += '## Benchmark Results\n\n';
            report +=
                '| Name | Average (ms) | Min (ms) | Max (ms) | Throughput (ops/s) |\n';
            report +=
                '|------|--------------|----------|----------|-------------------|\n';

            benchmarkResults.forEach((result) => {
                report += `| ${result.name} | ${result.averageDuration.toFixed(2)} | ${result.minDuration.toFixed(2)} | ${result.maxDuration.toFixed(2)} | ${result.throughput.toFixed(2)} |\n`;
            });
            report += '\n';
        }

        return report;
    }
}
```

**Декоратор для автоматического бенчмарка:**
```typescript
/**
 * Декоратор для автоматического бенчмарка методов
 */
export function Benchmark(name?: string, config?: BenchmarkConfig) {
    return function (
        target: any,
        propertyName: string,
        descriptor: PropertyDescriptor,
    ) {
        const method = descriptor.value;
        const benchmarkName =
            name || `${target.constructor.name}.${propertyName}`;

        descriptor.value = async function (...args: any[]) {
            const result = await PerformanceTesting.benchmark(
                benchmarkName,
                () => method.apply(this, args),
                config,
            );
            return result;
        };
    };
}
```

**Примеры использования:**
```typescript
// Бенчмарк операции корзины
await PerformanceTesting.benchmark('cart-operation', async () => {
    await cartService.addToCart(productId, quantity);
}, {
    iterations: 1000,
    warmupIterations: 50,
    threshold: {
        maxAverageDuration: 100, // 100ms максимум
    },
});

// Автоматический бенчмарк метода
class CartService {
    @Benchmark('add-to-cart', { iterations: 500 })
    async addToCart(productId: number, quantity: number) {
        // логика добавления в корзину
    }
}
```

## Лучшие практики

### Выбор метода изоляции

1. **TestCleanup** (текущий подход)
    - ✅ Простой и понятный
    - ✅ Работает всегда
    - ✅ Видны изменения в БД
    - ⚠️ Медленнее транзакций
    - **Использовать для**: большинства integration тестов

2. **TestTransaction**
    - ✅ Быстрее cleanup
    - ✅ Полная изоляция
    - ⚠️ Не работает с вложенными транзакциями
    - ⚠️ Сложнее debugging
    - **Использовать для**: unit тестов репозиториев

3. **Комбинированный подход**
    - TestTransaction для быстрых unit тестов
    - TestCleanup для integration тестов
    - **Лучший вариант для проекта**

### Graceful shutdown

- Закрытие всех активных соединений
- Предотвращение утечек между test suites
- Корректное завершение приложения

### Тестовые константы

- `CART_TEST_CONSTANTS` - константы для тестов корзины
- `TEST_CONSTANTS` - общие тестовые константы
- Переиспользование между тестами

### Конкретные измерения производительности

**Jest оптимизации:**
- **isolatedModules**: ускорение компиляции TypeScript в 2-3×
- **diagnostics: false**: отключение медленных проверок
- **coverageProvider: 'v8'**: в 3-5× быстрее, чем babel coverage
- **workerThreads: true**: на 10-15% быстрее, чем child processes
- **workerIdleMemoryLimit**: перезапуск воркеров при превышении лимита памяти

**CI оптимизации:**
- **bail: 1**: остановка при первой ошибке (экономит время)
- **silent: true**: минимальный вывод (меньше I/O)
- **maxWorkers: 2**: ограничение воркеров для стабильности
- **coverageReporters**: минимум репортеров для скорости

**Coverage thresholds:**
- **Global**: 70% branches, 60% functions, 70% lines/statements
- **Auth Services**: 85% lines/statements (высокая безопасность)
- **Security Guards**: 60% lines/statements (консервативно)
- **Token Services**: 90% lines/statements (критично для безопасности)
