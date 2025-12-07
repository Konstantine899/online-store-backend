# 🏗️ Architecture Documentation

## Архитектурные слои

### Domain Layer (Доменный слой)

**Назначение**: интерфейсы, модели, DTO контракты, типы
**Зависимости**: никаких внешних зависимостей от NestJS/Sequelize
**Содержит**:

- `interfaces/` - интерфейсы сервисов, репозиториев, контроллеров
- `models/` - доменные модели (User, Product, Order, etc.)
- `dto/` - Data Transfer Objects для валидации
- `types/` - TypeScript типы и утилиты

### Infrastructure Layer (Инфраструктурный слой)

**Назначение**: реализация бизнес-логики, доступ к данным, конфигурация
**Содержит**:

- `controllers/` - HTTP контроллеры
- `services/` - бизнес-логика
- `repositories/` - доступ к данным через Sequelize
- `config/` - конфигурация приложения
- `guards/` - защитники авторизации
- `pipes/` - валидация и трансформация
- `filters/` - обработка ошибок

## Правила зависимостей

### ✅ Разрешено

- **Контроллеры** → Сервисы → Репозитории → БД
- **Контроллеры** → DTO/Responses
- **Сервисы** → DTO/Models/Responses
- **Репозитории** → Sequelize Models
- **Domain** → Infrastructure (интерфейсы)

### ❌ Запрещено

- Импортировать из Infrastructure в Domain
- Прямые зависимости между контроллерами
- Бизнес-логика в репозиториях
- Доступ к БД в контроллерах

## Multi-tenancy архитектура

### TenantContext

```typescript
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
    setTenantId(tenantId: number): void;
    getTenantId(): number;
    getTenantIdOrNull(): number | null;
    hasTenantId(): boolean;
    clear(): void;
}
```

### TenantMiddleware

- **Извлечение**: tenant ID из заголовка `x-tenant-id`
- **Валидация**: существование и активность тенанта
- **Fallback**: tenant_id=1 в development режиме
- **Установка**: tenant ID в TenantContext и request

### Изоляция данных

- Все репозитории автоматически фильтруют по `tenant_id`
- Исключения: health checks, API docs, static assets
- Поддержка subdomain (планируется)

## Event-driven архитектура

### События системы (11 типов)

- **OrderCreatedEvent** - создание заказа
- **OrderStatusChangedEvent** - изменение статуса заказа
- **UserRegisteredEvent** - регистрация пользователя
- **PaymentCompletedEvent** - завершение платежа
- **OrderShippedEvent** - отправка заказа
- **OrderDeliveredEvent** - доставка заказа
- **OrderCancelledEvent** - отмена заказа
- **PasswordChangedEvent** - смена пароля
- **PasswordResetRequestedEvent** - запрос сброса пароля
- **EmailVerificationEvent** - верификация email
- **MarketingCampaignEvent** - маркетинговые кампании

### NotificationEventHandler

- **Кэширование шаблонов**: Map кэш для быстрого доступа
- **Батчевая обработка**: очередь на 50 уведомлений с таймаутом 1с
- **Приоритизация**: от 1 (маркетинг) до 10 (заказы)
- **Ретраи**: до 3 попыток с экспоненциальной задержкой
- **Метрики**: отслеживание производительности и ошибок
- **Параллельная обработка**: Promise.allSettled для батчей

## Паттерны проектирования

### Repository Pattern

- Абстракция доступа к данным
- Единый интерфейс для всех операций с БД
- Легкое тестирование через моки

**Пример: RoleAnalyticsRepository**
- Специализированный репозиторий для аналитики (SQL агрегация)
- Разделение ответственности: RoleRepository (CRUD) vs RoleAnalyticsRepository (аналитика)
- Прямые SQL запросы для эффективной обработки больших объемов данных
- Tenant isolation на уровне SQL для безопасности

### Service Layer Pattern

- Бизнес-логика в сервисах
- Координация между репозиториями
- Транзакции и валидация

**Пример: RoleAnalyticsService**
- Фасад для всех аналитических методов
- Централизация бизнес-логики аналитики
- Форматирование данных для API ответов
- Обработка tenant context для multi-tenancy

### Guard Pattern

- Защита endpoints
- Авторизация и аутентификация
- Rate limiting

### Decorator Pattern

- Swagger документация
- Валидация данных
- Роли и права доступа

## Модульная структура

### Controllers Module

```typescript
@Module({
    imports: [ServicesModule],
    controllers: [UserController, ProductController, ...],
})
export class ControllersModule {}
```

### Services Module

```typescript
@Module({
    imports: [RepositoriesModule],
    providers: [UserService, ProductService, ...],
    exports: [UserService, ProductService, ...],
})
export class ServicesModule {}
```

### Repositories Module

```typescript
@Module({
    imports: [SequelizeModule.forFeature([UserModel, ProductModel, ...])],
    providers: [UserRepository, ProductRepository, ...],
    exports: [UserRepository, ProductRepository, ...],
})
export class RepositoriesModule {}
```

## Конфигурация

### Environment Validation

- **Без Joi**: собственная валидация для производительности
- **Типизация**: строгие TypeScript типы
- **Безопасность**: проверка силы секретов в production
- **Ротация**: предупреждения о необходимости смены секретов

### Sequelize Configuration

- **Модели**: автоматическая загрузка всех моделей
- **Синхронизация**: отключена (только миграции)
- **Charset**: utf8mb4 для поддержки emoji
- **Collation**: utf8mb4_0900_ai_ci

### Connection Pool

- **Адаптивная конфигурация**: разные настройки для разных окружений
- **Graceful shutdown**: корректное закрытие соединений
- **Мониторинг**: отслеживание активных соединений

## Производительность

### Кэширование

- **In-memory cache**: пользователи, роли, статистика
- **Swagger мемоизация**: 82% экономии объектов
- **Connection pool**: переиспользование соединений
- **RoleGuard кэш**: кэширование наборов ролей для производительности
- **Template кэш**: кэширование шаблонов уведомлений

### Оптимизации

- **Lazy loading**: ленивая инициализация компонентов
- **Batch processing**: батчевая обработка уведомлений
- **Parallel execution**: параллельные операции где возможно
- **Memory management**: автоматическая очистка истёкших данных
- **Precompiled regex**: предкомпилированные регулярные выражения
- **Connection pooling**: адаптивная конфигурация пула соединений

## Безопасность

### HTTP Security

- **Helmet**: настройка безопасных заголовков
- **CORS**: строгая настройка разрешенных origins
- **CSP**: Content Security Policy для защиты от XSS
- **Trust Proxy**: корректная обработка прокси в production

### Rate Limiting

- **BruteforceGuard**: защита от брутфорс атак
- **ThrottlerModule**: многоуровневое ограничение скорости
- **Endpoint-specific limits**: разные лимиты для разных типов операций

### Валидация и санитизация

- **CustomValidationPipe**: глобальная валидация с русскими сообщениями
- **Sanitization validators**: защита от XSS атак
- **Password strength**: проверка сложности паролей
- **Phone validation**: валидация телефонных номеров

## Логирование и мониторинг

### Структурированное логирование

- **Pino**: высокопроизводительный JSON логгер
- **Correlation ID**: трекинг запросов через весь стек
- **PII masking**: маскирование чувствительных данных
- **Performance metrics**: отслеживание производительности

### Health Checks

- **HealthController**: мониторинг состояния системы
- **Database health**: проверка соединения с БД
- **Graceful shutdown**: корректное завершение работы

## Архитектурные компоненты

### Guards (Защитники)

- **AuthGuard**: проверка JWT токена и авторизации
- **RoleGuard**: проверка ролей пользователя с кэшированием
- **BruteforceGuard**: защита от брутфорс атак с многоуровневыми лимитами

### Middleware (Промежуточное ПО)

- **CorrelationIdMiddleware**: генерация и передача correlation ID
- **TenantMiddleware**: извлечение и валидация tenant ID

### Pipes (Трубы)

- **CustomValidationPipe**: глобальная валидация с русскими сообщениями
- **PaginationValidator**: валидация параметров пагинации

### Filters (Фильтры)

- **CustomNotFoundExceptionFilter**: обработка 404 ошибок
- **SequelizeDatabaseErrorExceptionFilter**: обработка ошибок БД
- **SequelizeUniqueConstraintExceptionFilter**: обработка конфликтов уникальности

### Strategies (Стратегии)

- **JwtStrategy**: Passport стратегия для JWT аутентификации

### Validators (Валидаторы)

- **SanitizeStringValidator**: защита от XSS атак
- **PasswordStrengthValidator**: проверка сложности паролей
- **PhoneValidator**: валидация телефонных номеров
- **NameValidator**: валидация имен пользователей

### Decorators (Декораторы)

- **@Roles**: декоратор для указания требуемых ролей
- **Swagger декораторы**: 80+ декораторов для документации API

### Context (Контекст)

- **TenantContext**: Request-scoped контекст для изоляции данных
- **CorrelationId**: трекинг запросов через весь стек

## Глобальные настройки приложения

### Bootstrap конфигурация

- **Global Prefix**: `/online-store` для всех endpoints
- **Static Assets**: обслуживание статических файлов через `/online-store/static/`
- **Trust Proxy**: корректная обработка прокси в production
- **X-Powered-By**: скрытие технологического заголовка Express

### Глобальные компоненты

- **Global Pipes**: `CustomValidationPipe` для всех endpoints
- **Global Filters**: обработка ошибок Sequelize и NotFound
- **APP_GUARD**: `BruteforceGuard` как глобальный защитник
- **Cookie Parser**: обработка cookies с секретным ключом

## Role Analytics System (SAAS-017-18)

### Архитектура

**Компоненты:**
- **RoleAnalyticsRepository**: SQL агрегация для аналитики ролей и разрешений
- **RoleAnalyticsService**: бизнес-логика и форматирование данных
- **RoleController**: 10 analytics endpoints с полной Swagger документацией

**Endpoints:**
- Статистика использования ролей (общая, по конкретной роли)
- Статистика разрешений (общая, по конкретному разрешению)
- Метрики операций назначения/отзыва ролей
- Статистика автоматических назначений
- Статистика истечения временных ролей
- Статистика иерархии ролей
- Агрегированный дашборд с ключевыми метриками
- Распределение ролей по тенантам (SUPER_ADMIN only)

**Особенности:**
- Tenant isolation на уровне SQL запросов
- SQL агрегация для эффективной обработки больших объемов данных
- Фильтрация по датам, периодам, тенантам
- Все endpoints защищены (ADMIN_ROLES required)

**Тестирование:**
- 27 unit тестов (repository + service)
- 26 integration тестов (все endpoints)
- Покрытие кода: 85% repository, 80% service

### Interceptors (Перехватчики)

- **FileInterceptor**: обработка загрузки файлов с Multer
- **Multer Config**: настройки для безопасной загрузки файлов

### Модули и их конфигурация

- **ThrottlerModule**: многоуровневое ограничение скорости (short, medium, long, login, refresh, registration)
- **EventEmitterModule**: настройки для event-driven архитектуры
- **JwtModule**: асинхронная конфигурация JWT
- **SequelizeModule**: асинхронная конфигурация БД
- **ConfigModule**: глобальная валидация переменных окружения

---
