# 🏪 Online Store Backend - Полный контекст проекта

> **ЕДИНСТВЕННЫЙ источник правды** для понимания архитектуры, бизнес-логики и технических решений проекта.

## 📋 Быстрый старт

### Что это за проект?

**SaaS-платформа для интернет-магазинов** с multi-tenancy архитектурой. Каждый клиент (tenant) имеет изолированные данные и может управлять своим магазином через единый API.

### Ключевые технологии

- **Backend**: NestJS + TypeScript (strict mode)
- **База данных**: MySQL + Sequelize ORM
- **Аутентификация**: JWT (access + refresh tokens)
- **Безопасность**: Rate limiting, CORS, Helmet, валидация
- **Тестирование**: Jest (unit + integration + e2e)

### Текущий статус

- ✅ **SAAS-001**: Multi-tenancy реализован
- ⏳ **SAAS-002**: Очистка User модуля (удаление e-commerce хардкода)
- ⏳ **SAAS-003**: Фильтрация каталога по тенантам

---

## 🏗️ Архитектура

### Слои приложения

```
┌─────────────────────────────────────┐
│           Infrastructure            │
│  Controllers → Services → Repos     │
├─────────────────────────────────────┤
│             Domain                  │
│  Interfaces → Models → DTOs        │
├─────────────────────────────────────┤
│           Database                  │
│     MySQL + Sequelize ORM          │
└─────────────────────────────────────┘
```

### Правила зависимостей

- **Контроллеры** → Сервисы → Репозитории → БД
- **❌ Запрещено**: импортировать из Infrastructure в Domain
- **✅ Разрешено**: Domain → Infrastructure (интерфейсы)

### Multi-tenancy

- **TenantMiddleware**: извлекает `tenant_id` из заголовка `x-tenant-id`
- **TenantContext**: request-scoped provider для изоляции данных
- **Исключения**: health checks, API docs, static assets

---

## 🗄️ База данных

### Основные модели

#### Пользователи и безопасность

- **User**: основная модель пользователя с расширенными флагами
    - Базовые поля: email, phone, password_hash, first_name, last_name
    - Флаги состояния: is_active, is_blocked, is_verified, is_email_verified
    - Настройки: is_newsletter_subscribed, is_marketing_consent, is_cookie_consent
    - Профиль: is_profile_completed, is_vip_customer, is_beta_tester
    - Безопасность: is_two_factor_enabled, is_terms_accepted, is_privacy_accepted
    - Локализация: preferred_language, timezone, theme_preference
- **Role**: роли системы (USER, ADMIN, TENANT_OWNER, etc.)
- **UserRole**: связь пользователей с ролями
- **RefreshToken**: токены обновления (HttpOnly cookies)
- **LoginHistory**: история входов в систему
- **PasswordResetToken**: токены сброса пароля
- **UserVerificationCode**: коды верификации email/phone

#### Каталог товаров

- **Product**: товары (name, price, rating, image, slug, stock)
- **Category**: категории товаров
- **Brand**: бренды товаров
- **ProductProperty**: свойства товаров (цвет, размер, etc.)
- **Rating**: оценки товаров пользователями

#### Заказы и платежи

- **Order**: заказы (name, email, phone, address, amount, status)
- **OrderItem**: позиции заказа (product_id, quantity, price)
- **Payment**: платежи (пока базовая структура)
- **PromoCode**: промокоды и скидки

#### Корзина

- **Cart**: корзины пользователей
- **CartProduct**: товары в корзине (quantity, price)

#### Multi-tenancy

- **Tenant**: клиенты SaaS-платформы
- **UserAddress**: адреса пользователей

### Связи между моделями

```
User ──┬── UserRole ── Role
       ├── Order ── OrderItem ── Product
       ├── Cart ── CartProduct ── Product
       ├── Rating ── Product
       └── RefreshToken
```

---

## 🎯 Бизнес-домены

### 1. Аутентификация (Auth)

**Контроллер**: `AuthController`

- `POST /auth/registration` - регистрация
- `POST /auth/login` - вход в систему
- `POST /auth/refresh` - обновление токена
- `GET /auth/check` - проверка авторизации
- `POST /auth/logout` - выход

**Особенности**:

- JWT access token (15 минут)
- Refresh token в HttpOnly cookies (30 дней)
- Rate limiting: 5 попыток логина в 15 минут
- Ротация refresh токенов
- Компрометация токенов: автоматическая инвалидация при подозрительной активности
- История входов: отслеживание всех сессий пользователя

### 2. Пользователи (User)

**Контроллер**: `UserController`

- CRUD операции для пользователей
- Управление ролями
- Lifecycle операции (block/suspend/delete/verify)

**Роли системы**:

- **Платформенные**: SUPER_ADMIN, PLATFORM_ADMIN
- **Тенантские**: TENANT_OWNER, TENANT_ADMIN, MANAGER, CONTENT_MANAGER, CUSTOMER_SERVICE
- **Пользователи**: VIP_CUSTOMER, WHOLESALE, CUSTOMER, AFFILIATE, GUEST
- **Legacy**: ADMIN, USER (для обратной совместимости)

### 3. Каталог товаров (Catalog)

**Контроллеры**: `ProductController`, `CategoryController`, `BrandController`, `ProductPropertyController`

**Продукты**:

- `GET /products` - список с пагинацией и фильтрами
- `GET /products/:id` - детали товара
- `POST /products` - создание (ADMIN)
- `PUT /products/:id` - обновление (ADMIN)
- `DELETE /products/:id` - удаление (ADMIN)

**Фильтрация**:

- По категории: `GET /products?category_id=1`
- По бренду: `GET /products?brand_id=1`
- Комбинированная: `GET /products?category_id=1&brand_id=1`

### 4. Корзина (Cart)

**Контроллер**: `CartController`

- `GET /cart` - получение корзины
- `POST /cart/append` - добавление товара
- `PUT /cart/increment` - увеличение количества
- `PUT /cart/decrement` - уменьшение количества
- `DELETE /cart/remove` - удаление товара
- `DELETE /cart/clear` - очистка корзины

### 5. Заказы (Order)

**Контроллер**: `OrderController`

**Для пользователей**:

- `GET /orders` - список заказов пользователя
- `GET /orders/:id` - детали заказа
- `POST /orders` - создание заказа

**Для администраторов**:

- `GET /admin/orders` - все заказы магазина
- `GET /admin/orders/user/:userId` - заказы пользователя
- `POST /admin/orders` - создание заказа
- `DELETE /admin/orders/:id` - удаление заказа

**Для гостей**:

- `POST /guest/orders` - создание заказа без регистрации

### 6. Платежи (Payment)

**Контроллер**: `PaymentController`

- `POST /payment/user` - оплата для авторизованных
- `POST /payment/guest` - оплата для гостей

### 7. Рейтинги (Rating)

**Контроллер**: `RatingController`

- `POST /ratings` - создание оценки
- `GET /ratings/product/:productId` - рейтинг товара

### 8. Уведомления (Notification)

**Контроллер**: `NotificationController`

- Система уведомлений для пользователей
- Email и SMS провайдеры
- Шаблоны уведомлений
- Event-driven архитектура
- Автоматические уведомления: регистрация, заказы, платежи, смена пароля
- Батчевая обработка и кэширование шаблонов

### 9. Файлы (File)

**Сервис**: `FileService`

- Загрузка и обработка файлов
- Валидация типов и размеров
- Безопасное хранение

### 10. Промокоды (PromoCode)

**Сервис**: `PromoCodeService`

- Создание и управление промокодами
- Применение скидок к заказам
- Валидация сроков действия

### 11. Health Checks (Мониторинг)

**Контроллер**: `HealthController`

- `GET /health` - проверка состояния БД и сервисов
- `GET /live` - проверка жизнеспособности приложения
- `GET /ready` - проверка готовности к работе
- Интеграция с `@nestjs/terminus` для мониторинга

---

## 🔧 Сервисы и репозитории

### Основные сервисы

- **`AuthService`**: аутентификация, регистрация, логин, refresh токены
- **`UserService`**: управление пользователями, роли, профили, статистика
- **`ProductService`**: каталог товаров, фильтрация, поиск
- **`OrderService`**: создание заказов, управление статусами
- **`CartService`**: корзина покупок, добавление/удаление товаров
- **`PaymentService`**: обработка платежей
- **`NotificationService`**: уведомления, email/SMS, шаблоны
- **`FileService`**: загрузка файлов, валидация, безопасное хранение
- **`PromoCodeService`**: промокоды, скидки, валидация
- **`TokenService`**: работа с JWT токенами
- **`LoginHistoryService`**: история входов в систему
- **`UserAddressService`**: управление адресами пользователей

### Основные репозитории

- **`UserRepository`**: CRUD пользователей, статистика, кэширование
- **`ProductRepository`**: товары с фильтрацией по tenant_id
- **`OrderRepository`**: заказы с изоляцией по тенантам
- **`CartRepository`**: корзины пользователей
- **`BrandRepository`**: бренды с пагинацией и поиском
- **`CategoryRepository`**: категории товаров
- **`RoleRepository`**: роли системы
- **`RefreshTokenRepository`**: токены обновления
- **`RatingRepository`**: оценки товаров
- **`PromoCodeRepository`**: промокоды и скидки
- **`UserAddressRepository`**: адреса пользователей
- **`LoginHistoryRepository`**: история входов в систему
- **`PasswordResetTokenRepository`**: токены сброса пароля
- **`OrderItemRepository`**: позиции заказов
- **`ProductPropertyRepository`**: свойства товаров

### Response классы

- **Наследование**: все Response наследуются от соответствующих Model классов
- **Swagger**: `@ApiProperty` для автодокументации
- **Валидация**: `@IsArray`, `@ValidateNested`, `@Type` для сложных типов
- **Пагинация**: `PaginatedResponse<T>` с метаданными
- **Паттерн**: `CreateXResponse`, `GetXResponse`, `UpdateXResponse`, `RemoveXResponse`

### Утилиты и хелперы

- **`createLogger`**: фабрика структурированных логгеров с correlation ID
- **`maskPII`**: маскирование чувствительных данных в логах
- **`sanitizeForLogging`**: автоматическое удаление PII полей
- **`buildRefreshCookieOptions`**: безопасные настройки cookies
- **`PaginationValidator`**: валидация параметров пагинации

### Domain интерфейсы

- **Контроллеры**: `IUserController`, `IOrderController`, `IAuthController`, etc.
- **Сервисы**: `IUserService`, `IOrderService`, `IAuthService`, etc.
- **Репозитории**: `IUserRepository`, `IOrderRepository`, `IProductRepository`, etc.
- **Контракты**: четкое разделение между Domain и Infrastructure слоями
- **Зависимости**: Domain → Infrastructure (интерфейсы), Infrastructure → Domain (реализации)

### Паттерны работы с данными

- **Multi-tenancy**: все репозитории автоматически фильтруют по `tenant_id`
- **Кэширование**: UserService использует in-memory кэш для часто запрашиваемых данных
- **Пагинация**: стандартный контракт `{ data: T[], meta: MetaData }`
- **Валидация**: все входные данные через DTO с кастомными валидаторами

---

## 🔒 Безопасность

### Аутентификация и авторизация

- **JWT Guard**: проверка access токена
- **Role Guard**: проверка ролей пользователя
- **BruteforceGuard**: защита от брутфорса

### Rate Limiting

```typescript
{
  'short': '3 запроса/сек',
  'medium': '20 запросов/10сек',
  'long': '100 запросов/мин',
  'login': '5 попыток/15мин',
  'refresh': '10 попыток/5мин',
  'registration': '3 попытки/мин'
}
```

### Кастомные валидаторы

- **`@IsSanitizedString`**: защита от XSS, удаление HTML тегов
- **`@IsValidName`**: валидация имен (только буквы, пробелы, дефисы)
- **`@IsValidPhone`**: валидация телефонных номеров
- **`@IsPasswordStrong`**: проверка сложности пароля (8+ символов, заглавные, строчные, цифры, спецсимволы)

### Guards (защитники)

- **`AuthGuard`**: проверка JWT токена, извлечение пользователя
- **`RoleGuard`**: проверка ролей пользователя, кэширование ролей
- **`BruteforceGuard`**: защита от брутфорса с разными лимитами для endpoints

### Pipes (пайпы)

- **`CustomValidationPipe`**: глобальная валидация DTO с русскими сообщениями
- **`ParseIntPipe`**: преобразование строк в числа
- **`DefaultValuePipe`**: значения по умолчанию для query параметров

### Exception Filters (фильтры ошибок)

- **`CustomNotFoundExceptionFilter`**: детальные 404 ошибки
- **`SequelizeDatabaseErrorExceptionFilter`**: обработка ошибок БД
- **`SequelizeUniqueConstraintExceptionFilter`**: конфликты уникальности
- **`CartBusinessLogicExceptionFilter`**: бизнес-логика корзины
- **`CartValidationExceptionFilter`**: валидация корзины

### Middleware и Interceptors

- **CorrelationIdMiddleware**: генерирует/пробрасывает `x-request-id` для трассировки
- **TenantMiddleware**: извлекает `tenant_id` из заголовка `x-tenant-id`
- **Cookie Parser**: с секретным ключом для подписи cookies
- **Helmet**: безопасные HTTP заголовки
- **CORS**: настройка разрешенных origins

### Swagger декораторы

- **Кастомные декораторы**: `@CreateUserSwaggerDecorator()`, `@LoginSwaggerDecorator()`
- **Паттерн**: `ApiOperation` + `ApiBody` + `ApiResponse` + `ApiBearerAuth`
- **Примеры**: встроенные примеры валидных/невалидных данных
- **Автодокументация**: `/online-store/docs` с полным описанием API

---

## 📊 API и документация

### Swagger документация

- **URL**: `/online-store/docs`
- **Декораторы**: кастомные Swagger декораторы из `@app/infrastructure/common/decorators/swagger`
- **Примеры**: `@CreateUserSwaggerDecorator()`, `@ApiBearerAuth('JWT-auth')`

### Пагинация

**Контракт ответа**:

```typescript
{
  data: T[],
  meta: {
    totalCount: number,
    lastPage: number,
    currentPage: number,
    nextPage: number | null,
    previousPage: number | null,
    limit: number
  }
}
```

**Query параметры**:

- `page` (default: 1)
- `limit` (default: 5, max: 100)

### Формат ошибок

```typescript
{
  statusCode: number,
  url: string,
  path: string,
  name: string,
  message: string | string[],
  timestamp?: string
}
```

---

## 🧪 Тестирование

### Структура тестов

- **Unit**: `tests/unit/` - сервисы, пайпы, гварды (без БД)
- **Integration**: `tests/integration/` - контроллеры, репозитории (с БД)
- **E2E**: `tests/e2e/` - сквозные сценарии

### Покрытие

- **Критичные модули**: ≥ 80% (auth, orders, payments, security)
- **CI блокирует**: merge при падении тестов

### Запуск тестов

```bash
npm run test:unit          # Unit тесты
npm run test:integration   # Integration тесты
npm run test:e2e          # E2E тесты
npm run test:cov          # Покрытие
```

---

## 🚀 Разработка

### Стиль кода

- **TypeScript strict mode**: без `any`, явные типы
- **Отступы**: 4 пробела (не табы)
- **Длина строки**: максимум 120 символов
- **Кавычки**: single quotes
- **Trailing commas**: везде

### Именование

- **Файлы**: `*.controller.ts`, `*.service.ts`, `*.dto.ts`
- **Классы**: PascalCase (`UserController`)
- **Методы**: camelCase (`createUser`)
- **Интерфейсы**: префикс `I` (`IUserService`)

### Импорты

- **Алиасы**: `@app/*` вместо относительных путей
- **Порядок**: NestJS → внешние → внутренние
- **Группировка**: пустая строка между группами

### Git workflow

- **Ветки**: `feature/*`, `fix/*`, `chore/*`
- **Коммиты**: Conventional Commits (`feat(auth): add refresh token rotation`)
- **Merge**: squash & merge по умолчанию

---

## 📁 Структура проекта

```
src/
├── domain/                    # Domain Layer
│   ├── controllers/           # Интерфейсы контроллеров
│   ├── dto/                  # DTO контракты
│   ├── models/               # Domain модели
│   ├── repositories/         # Интерфейсы репозиториев
│   ├── services/             # Интерфейсы сервисов
│   └── responses/            # Response контракты
├── infrastructure/           # Infrastructure Layer
│   ├── controllers/          # HTTP контроллеры
│   ├── services/             # Бизнес-логика
│   ├── repositories/         # Доступ к БД
│   ├── config/               # Конфигурация
│   ├── common/               # Общие компоненты
│   │   ├── decorators/       # Swagger декораторы
│   │   ├── guards/           # Guards (Auth, Role, Bruteforce)
│   │   ├── pipes/            # Validation pipes
│   │   └── filters/           # Exception filters
│   └── dto/                  # Валидация входных данных
└── main.ts                   # Точка входа

db/
├── models/                   # Sequelize модели
├── migrations/               # Миграции БД
└── seeders/                  # Сиды БД

tests/
├── unit/                     # Unit тесты
├── integration/              # Integration тесты
├── e2e/                      # E2E тесты
└── setup/                    # Настройка тестов
```

---

## 🔧 Конфигурация

### Переменные окружения

> ⚠️ **ВАЖНО**: Никогда не коммитьте реальные значения в репозиторий! Используйте `.env` файлы и `docs/env.example` как шаблон.

```bash
# Основные
NODE_ENV=development|production|test
PORT=5000

# База данных
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=your_database_name
MYSQL_USER=your_username
MYSQL_PASSWORD=your_secure_password

# JWT
JWT_PRIVATE_KEY=your_64_char_hex_key
JWT_ACCESS_SECRET=your_min_16_char_secret
JWT_REFRESH_SECRET=your_min_16_char_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

# Безопасность
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
COOKIE_PARSER_SECRET_KEY=your_min_10_char_secret
SECURITY_HELMET_ENABLED=true
SECURITY_CSP_ENABLED=true
```

### Конфигурация окружения

- **Валидация**: Joi схема для всех env переменных
- **Кэширование**: `getConfig()` с кэшированием конфигурации
- **Секреты**: проверка силы паролей для production/staging
- **Ротация**: предупреждения о необходимости ротации JWT секретов
- **Окружения**: development, test, staging, production
- **Примеры**: см. `docs/env.example` для детальных примеров значений

### Connection Pool

- **Адаптивная конфигурация**: разные настройки для dev/test/CI/prod
- **CI**: 30 max connections для 4 parallel workers
- **Test**: 10 max для стабильности sequential execution
- **Production**: 20 max для оптимальной производительности
- **ENV override**: `SEQUELIZE_POOL_MAX`/`SEQUELIZE_POOL_MIN`

### Скрипты

```bash
npm run start:dev     # Разработка
npm run start:prod    # Продакшн
npm run build         # Сборка
npm run test          # Все тесты
npm run lint          # Линтер
npm run format        # Prettier
```

---

## 🎯 Типичные задачи

### Добавление нового endpoint

1. **Domain**: создать интерфейс контроллера
2. **DTO**: создать DTO для валидации
3. **Response**: создать Response класс
4. **Service**: добавить метод в сервис
5. **Repository**: добавить метод в репозиторий
6. **Controller**: реализовать endpoint
7. **Swagger**: добавить декораторы
8. **Tests**: написать unit + integration тесты

### Добавление новой модели

1. **Migration**: создать миграцию
2. **Model**: создать Sequelize модель
3. **Types**: добавить типы в `db/models/types.ts`
4. **Associations**: настроить связи
5. **Repository**: создать репозиторий
6. **Service**: создать сервис
7. **Controller**: создать контроллер
8. **Tests**: написать тесты

### Работа с multi-tenancy

- Все запросы автоматически фильтруются по `tenant_id`
- Использовать `TenantContext` для получения текущего tenant
- Исключения: health checks, API docs, static assets

### Работа с кэшированием

- **UserService**: кэш пользователей и ролей (TTL: 5 минут)
- **Статистика**: кэш статистики (TTL: 10 минут)
- **Очистка**: автоматическая по TTL, ручная через методы сервиса

### Event-driven архитектура

- **NotificationEventHandler**: обработка событий уведомлений
- **EmailProviderService**: отправка email через внешние провайдеры
- **SmsProviderService**: отправка SMS
- **TemplateRendererService**: рендеринг шаблонов уведомлений

---

## 🚨 Важные моменты

### Что НЕ делать

- ❌ Импортировать из Infrastructure в Domain
- ❌ Использовать `any` в TypeScript
- ❌ Создавать новые .md файлы без согласования
- ❌ Коммитить без прохождения тестов
- ❌ Логировать PII (пароли, токены, email)
- ❌ Коммитить реальные секреты и пароли БД
- ❌ Использовать слабые пароли в production

### Что ОБЯЗАТЕЛЬНО делать

- ✅ Валидировать все входные данные через DTO
- ✅ Использовать кастомные Swagger декораторы
- ✅ Писать тесты для новых функций
- ✅ Следовать Conventional Commits
- ✅ Включать correlation ID в логи

### Критичные модули

- **Auth**: аутентификация и авторизация
- **User**: управление пользователями
- **Order**: заказы и платежи
- **Security**: guards, валидация, rate limiting

### Миграции и сиды

- **Миграции**: 37+ миграций с индексами для производительности
- **Сиды**: детерминированные данные для ролей и пользователей
- **Индексы**: оптимизированные индексы для FK, поиска, сортировки
- **Версионирование**: четкая схема именования миграций
- **Rollback**: полная поддержка отката изменений

### Тестовые утилиты

- **TestDataFactory**: генерация уникальных тестовых данных
- **TestCleanup**: централизованная очистка БД между тестами
- **TestTransaction**: изоляция тестов через транзакции
- **MockFactories**: стандартизированные моки для unit тестов
- **Auth helpers**: автоматическая авторизация в тестах

### Производительность и мониторинг

- **Кэширование**: мемоизация Swagger декораторов, шаблонов уведомлений
- **Event-driven**: асинхронная обработка событий с батчевой отправкой
- **Connection Pool**: адаптивная конфигурация для разных окружений
- **Логирование**: структурированные JSON логи с correlation ID
- **Метрики**: отслеживание производительности и ошибок

### CI/CD и Deployment

- **GitHub Actions**: автоматические проверки на каждый PR
- **Проверки**: lint, type check, unit tests, integration tests, coverage
- **Deployment**: Railway/Render для production hosting
- **Docker**: multi-stage builds для production
- **Health Checks**: мониторинг состояния приложения
- **Migrations**: автоматическое применение миграций в production

---

## 📚 Дополнительная документация

### Критически важные файлы

- **`docs/errors-logging.mdc`** - обработка ошибок и логирование
- **`docs/SECURITY.md`** - безопасность, CSRF защита, известные уязвимости
- **`docs/TESTING.md`** - стратегия тестирования и troubleshooting
- **`docs/secrets-management.md`** - управление секретами и конфигурацией
- **`docs/env.example`** - справочник по переменным окружения

### Быстрые ссылки

- **Проблемы с тестами** → `docs/TESTING.md`
- **Ошибки и логирование** → `docs/errors-logging.mdc`
- **Безопасность** → `docs/SECURITY.md`
- **Секреты и конфигурация** → `docs/secrets-management.md`

---

## 📞 Поддержка

При возникновении вопросов:

1. Проверьте этот файл
2. Изучите существующий код
3. Запустите тесты для понимания поведения
4. Обратитесь к команде

**Помните**: этот файл - живой документ. Обновляйте его при значительных изменениях в архитектуре!
