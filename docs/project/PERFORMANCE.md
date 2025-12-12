# ⚡ Performance Documentation

## Кэширование

### In-memory кэш

- **Пользователи**: кэширование данных пользователей
- **Роли**: кэширование ролей и разрешений
- **Статистика**: кэширование часто запрашиваемых данных
- **TTL**: время жизни кэша 5-15 минут
- **Инвалидация**: автоматическая при изменениях

### Swagger мемоизация

- **Экономия**: 82% объектов при повторном использовании
- **Singleton**: переиспользование общих ответов
- **Map кэш**: быстрый доступ к кэшированным данным
- **Оптимизация**: уменьшение времени генерации документации

#### Детальные оптимизации Swagger

**Мемоизация общих ответов:**

```typescript
// Кэш для мемоизации
let unauthorizedResponseCache: ReturnType<typeof ApiResponse> | null = null;
let forbiddenResponseCache: ReturnType<typeof ApiResponse> | null = null;
const notFoundResponseCache = new Map<string, ReturnType<typeof ApiResponse>>();
const badRequestResponseCache = new Map<
    string | undefined,
    ReturnType<typeof ApiResponse>
>();
```

**Константы для схем:**

- `MESSAGE_RESPONSE_SCHEMA` - схема простого ответа с сообщением
- `TEMPLATE_SCHEMA` - схема шаблона
- `USER_SETTINGS_SCHEMA` - схема настроек
- `PAGINATION_QUERIES` - стандартные query параметры
- `META_SCHEMA` - метаданные пагинации

**Измерения производительности:**

- **Без оптимизации:** ~22 объекта ApiResponse для стандартных ответов
- **С оптимизацией:** ~4 объекта (сокращение на ~82%)
- **UnauthorizedResponse:** 11 вызовов → 1 создание объекта (10 из кэша)
- **ForbiddenResponse:** 11 вызовов → 1 создание объекта (10 из кэша)

### Connection Pool

- **Адаптивная конфигурация**: разные настройки для разных окружений
- **Development**: min: 2, max: 10 соединений
- **Production**: min: 5, max: 20 соединений
- **Graceful shutdown**: корректное закрытие соединений

## Логирование и мониторинг

### Pino конфигурация

- **Structured JSON**: структурированные логи в production
- **Pretty printing**: читаемый формат в development
- **PII masking**: автоматическое маскирование чувствительных данных
- **Correlation ID**: трассировка запросов через x-request-id

#### Детальные оптимизации логирования

**Singleton base logger:**

```typescript
// Singleton base logger (создаётся один раз)
let baseLogger: pino.Logger | null = null;

function getBaseLogger(): pino.Logger {
    if (!baseLogger) {
        baseLogger = pino(createPinoConfig());
    }
    return baseLogger;
}
```

**Константы для PII полей:**

```typescript
const PII_FIELDS = new Set([
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'email',
    'phone',
    'firstName',
    'lastName',
    'address',
    'secret',
    'apiKey',
]);
```

**Оптимизированные сериализаторы:**

- `reqSerializer` - только безопасные поля (method, url, userAgent)
- `resSerializer` - только statusCode
- `errSerializer` - условный stack trace (только в development)

### Оптимизации логирования

- **Redaction paths**: автоматическое удаление PII полей
- **Serializers**: кастомные сериализаторы для объектов
- **Levels**: info, warn, error с правильным использованием
- **Performance**: минимальное влияние на производительность

### Метрики производительности

- **Response time**: время ответа endpoints
- **Throughput**: количество запросов в секунду
- **Memory usage**: использование памяти
- **Database connections**: активные соединения
- **Cache hit rate**: эффективность кэширования

## База данных

### Избежание N+1

- **Include/associations**: использование Sequelize associations
- **Attributes**: выбор только нужных полей
- **Bulk operations**: массовые операции для производительности
- **Query optimization**: оптимизация SQL запросов

### Пагинация

- **Обязательная**: для всех списков
- **Лимиты**: page (default: 1), limit (default: 5, max: 100)
- **MetaData**: totalCount, lastPage, currentPage, nextPage, previousPage
- **Индексы**: для быстрой пагинации

### Индексы

- **FK индексы**: для всех внешних ключей
- **Составные индексы**: для часто используемых запросов
- **Уникальные индексы**: для email, phone, sku
- **Частичные индексы**: для активных записей

## HTTP слой

### Кэширование ответов

- **Cache-Control**: заголовки для статических данных
- **ETag**: для проверки изменений
- **Compression**: gzip/br сжатие ответов
- **CDN**: использование CDN для статических файлов

### Ограничения payload

- **Body size**: ограничение размера запросов
- **File uploads**: ограничение размера файлов (256 KB)
- **Validation**: проверка длины строк и массивов
- **Rate limiting**: защита от DDoS атак

## Event-driven архитектура

### NotificationEventHandler

- **Кэширование шаблонов**: Map кэш для быстрого доступа
- **Батчевая обработка**: очередь на 50 уведомлений с таймаутом 1с
- **Приоритизация**: от 1 (маркетинг) до 10 (заказы)
- **Ретраи**: до 3 попыток с экспоненциальной задержкой
- **Параллельная обработка**: Promise.allSettled для батчей

#### Детальные оптимизации NotificationService

**Многоуровневое кэширование:**

```typescript
// Кэш для статистики
private readonly statisticsCache = new Map<string, NotificationStatistics>();
private readonly cacheTimeout = 5 * 60 * 1000; // 5 минут
private readonly maxCacheSize = 100;

// Кэш для шаблонов
private readonly templatesCache = new Map<string, NotificationTemplateModel[]>();
private readonly templatesCacheTimeout = 10 * 60 * 1000; // 10 минут
```

**Оптимизированные запросы:**

- `raw: true` - получение только нужных полей
- Агрегация на уровне БД для статистики
- Кэширование результатов с TTL

### Оптимизации событий

- **Template cache**: кэширование шаблонов уведомлений
- **Batch processing**: батчевая отправка уведомлений
- **Priority queue**: приоритизация по важности
- **Metrics**: отслеживание производительности

## Тестирование

### Jest оптимизации

- **isolatedModules**: ускорение компиляции TypeScript
- **diagnostics: false**: отключение медленных проверок
- **Кэширование**: TypeScript, Jest, npm dependencies
- **Параллелизация**: unit тесты параллельно, integration последовательно

### CI оптимизации

- **bail: true**: остановка при первой ошибке
- **silent: true**: минимальный вывод
- **minimal reporters**: только необходимые репортеры
- **maxWorkers: 4**: ограничение количества воркеров

### Test оптимизации

- **TestTransaction**: быстрая изоляция через транзакции
- **TestCleanup**: централизованная очистка БД
- **MockFactories**: стандартизированные моки
- **Parallel execution**: параллельное выполнение независимых тестов

#### Performance тесты

**Bulk операции:**

```typescript
it('should handle large bulk SMS operations efficiently', async () => {
    const largeMessageList = createBulkSmsMessages(100);
    const startTime = Date.now();
    const results = await service.sendBulkSms(largeMessageList);
    const endTime = Date.now();

    expect(results).toHaveLength(100);
    expect(endTime - startTime).toBeLessThan(25000); // 25 секунд
});
```

**Кэширование валидации:**

```typescript
it('should cache phone validation efficiently', async () => {
    const testPhones = ['+79991234567', '+79991234568', '+79991234567']; // повторный вызов
    const startTime = Date.now();

    const results = await Promise.all(
        testPhones.map((phone) => service.validatePhoneNumber(phone)),
    );

    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(100); // быстро благодаря кэшу
});
```

**Large template rendering:**

```typescript
it('should handle large template rendering efficiently', async () => {
    const largeTemplate = createTemplate(
        Array.from({ length: 100 }, (_, i) => `{{var${i}}}`).join(' '),
    );
    const largeVariables = createTemplateVariables(
        Object.fromEntries(
            Array.from({ length: 100 }, (_, i) => [`var${i}`, `value${i}`]),
        ),
    );

    const result = await service.renderTemplate(largeTemplate, largeVariables);
    expect(result.success).toBe(true);
});
```

## Конкретные измерения производительности

### Swagger оптимизации

**Объекты ApiResponse:**

- **Без оптимизации:** ~22 объекта для стандартных ответов
- **С оптимизацией:** ~4 объекта (сокращение на ~82%)
- **Экономия памяти:** ~18 объектов при старте приложения

**Вызовы функций:**

- **UnauthorizedResponse:** 11 вызовов → 1 создание объекта (10 из кэша)
- **ForbiddenResponse:** 11 вызовов → 1 создание объекта (10 из кэша)
- **NotFoundResponse:** ~3 вызова → ~3 создания (кэш по resourceName)
- **BadRequestResponse:** ~2 вызова → ~2 создания (кэш по message)

### Кэширование TTL

**NotificationService:**

- **Статистика:** 5 минут TTL, maxCacheSize: 100
- **Шаблоны:** 10 минут TTL
- **Ключи кэша:** `${userId}_${period}_${type}`

**Connection Pool:**

- **Development:** min: 2, max: 10 соединений
- **Production:** min: 5, max: 20 соединений
- **CI:** max: 30 для 4 workers

### Performance тесты

**Bulk операции:**

- **SMS bulk:** 100 сообщений за <25 секунд
- **Template rendering:** 100 переменных за <100ms
- **Phone validation:** повторные вызовы за <100ms

**Кэширование:**

- **Config calls:** сокращение с 4 до 1 вызова (-75%)
- **Role sets:** кэширование в Map для O(1) доступа
- **IP validation:** предкомпилированные regex

## Мониторинг производительности

### Метрики

- **Response time**: время ответа endpoints
- **Throughput**: количество запросов в секунду
- **Error rate**: процент ошибок
- **Memory usage**: использование памяти
- **Database connections**: активные соединения
- **Cache hit rate**: эффективность кэширования

### Алерты

- **Slow response**: медленные ответы (>1s)
- **High error rate**: превышение порога ошибок
- **Memory leak**: утечки памяти
- **Database issues**: проблемы с БД
- **Cache miss**: низкая эффективность кэша

### Профилирование

- **CPU profiling**: анализ использования процессора
- **Memory profiling**: анализ использования памяти
- **Database profiling**: анализ SQL запросов
- **Network profiling**: анализ сетевых запросов

## Оптимизации кода

### Lazy loading

- **Ленивая инициализация**: компонентов и сервисов
- **Dynamic imports**: динамическая загрузка модулей
- **Conditional loading**: условная загрузка ресурсов

#### Детальные оптимизации Guards

**BruteforceGuard кэширование:**

```typescript
// Кэшированные конфигурации для избежания повторных вызовов getConfig()
interface CachedConfig {
    loginWindowMs: number;
    loginLimit: number;
    refreshWindowMs: number;
    refreshLimit: number;
    regWindowMs: number;
    regLimit: number;
}

// Предкомпилированные regex для валидации IP
const IPV4_REGEX =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
```

**RoleGuard кэширование:**

- Кэширование наборов ролей в `Map<string, Set<string>>`
- Избежание повторных вычислений для одинаковых комбинаций ролей
- Автоматическая очистка истёкших записей

### Memory management

- **Автоматическая очистка**: истёкших данных
- **Garbage collection**: оптимизация сборки мусора
- **Memory leaks**: предотвращение утечек памяти

### Parallel execution

- **Promise.all**: параллельные независимые операции
- **Async/await**: правильное использование асинхронности
- **Worker threads**: для CPU-интенсивных задач

## Масштабирование

### Горизонтальное масштабирование

- **Stateless**: приложение без состояния
- **Load balancer**: распределение нагрузки
- **Database**: отдельная БД для каждого инстанса
- **Caching**: распределенное кэширование

### Вертикальное масштабирование

- **Memory**: увеличение RAM
- **CPU**: увеличение процессорной мощности
- **Storage**: увеличение дискового пространства
- **Network**: увеличение пропускной способности

### Database масштабирование

- **Read replicas**: реплики для чтения
- **Sharding**: горизонтальное разделение данных
- **Partitioning**: вертикальное разделение таблиц
- **Caching**: кэширование на уровне БД

## Troubleshooting производительности

### Диагностика

- **Logs**: анализ структурированных логов
- **Metrics**: мониторинг метрик производительности
- **Profiling**: профилирование кода
- **Database**: анализ производительности БД

### Оптимизация

- **Query optimization**: оптимизация SQL запросов
- **Index optimization**: оптимизация индексов
- **Cache optimization**: оптимизация кэширования
- **Code optimization**: оптимизация кода

### Мониторинг

- **Real-time monitoring**: мониторинг в реальном времени
- **Alerting**: уведомления о проблемах
- **Reporting**: отчеты о производительности
- **Trending**: анализ трендов производительности
