# 📚 Online Store Backend - Project Context

> **ИСЧЕРПЫВАЮЩИЙ источник правды о проекте!**
> Этот файл содержит всю критичную информацию для быстрого погружения в проект.

## 🎯 Навигация по документации

### Основные файлы

- **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** - Этот файл (быстрый старт и архитектура)
- **[docs/project/README.md](./docs/project/README.md)** - Навигация по всей документации
- **[docs/project/API.md](./docs/project/API.md)** - Полная документация API и Swagger декораторов
- **[docs/project/ARCHITECTURE.md](./docs/project/ARCHITECTURE.md)** - Детальная архитектура и паттерны
- **[docs/project/SECURITY.md](./docs/project/SECURITY.md)** - Безопасность, валидация, guards
- **[docs/project/TESTING.md](./docs/project/TESTING.md)** - Тестирование, утилиты, best practices
- **[docs/project/DEPLOYMENT.md](./docs/project/DEPLOYMENT.md)** - CI/CD, деплой, мониторинг
- **[docs/project/DATABASE.md](./docs/project/DATABASE.md)** - База данных, миграции, сиды
- **[docs/project/PERFORMANCE.md](./docs/project/PERFORMANCE.md)** - Оптимизации, кэширование, мониторинг

### Быстрый старт

1. **Новый разработчик**: начните с этого файла
2. **API разработка**: изучите [docs/project/API.md](./docs/project/API.md)
3. **Тестирование**: перейдите к [docs/project/TESTING.md](./docs/project/TESTING.md)
4. **Деплой**: смотрите [docs/project/DEPLOYMENT.md](./docs/project/DEPLOYMENT.md)

---

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
- ✅ **SAAS-009**: Система уведомлений (Notification API, интеграционные тесты)
- ✅ **USER-001-06**: Verification API (email/phone верификация, 43 integration теста)
- ✅ **USER-001-07**: Улучшение системы адресов с tenant isolation (24 unit, 13 integration тестов)
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

**TenantContext возможности**:

- `setTenantId(tenantId)` - установка tenant ID для текущего запроса
- `getTenantId()` - получение tenant ID (throws если не установлен)
- `getTenantIdOrNull()` - получение tenant ID или null
- `getTenantIdOrFail()` - **РЕКОМЕНДУЕТСЯ** вместо `getTenantIdOrNull() ?? 1` для безопасности
- `hasTenantId()` - проверка установлен ли tenant ID
- `clear()` - очистка tenant ID (для тестов)

**TenantMiddleware логика**:

- **Приоритет 1**: заголовок `x-tenant-id` (обязателен в production)
- **Приоритет 2**: subdomain (планируется: nike.mystore.com)
- **Development fallback**: tenant_id=1 с предупреждением
- **Валидация**: существование тенанта и статус 'active'
- **Ошибки**: 400 для неверного формата, 403 для несуществующего/неактивного

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
    - Поля: user_id, tenant_id, type ('email'|'phone'), code_hash (SHA256), expires_at, attempts
    - Валидация: TTL 10 минут, cooldown 60 секунд, max 5 попыток ввода
    - Tenant isolation: автоматическая фильтрация по tenant_id
    - Индексы: (user_id, type, tenant_id) для производительности
    - Security: хранение только хеша кода, никогда plain text

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

#### Верификация email и телефона

**Endpoints верификации:**

- `POST /users/verify/email/request` - запрос кода верификации email
- `POST /users/verify/email/confirm` - подтверждение кода email
- `POST /users/verify/phone/request` - запрос кода верификации phone
- `POST /users/verify/phone/confirm` - подтверждение кода phone

**Механизм работы:**

1. **Генерация кода**: 6-значный цифровой код
2. **Хранение**: SHA256 хеш в таблице `user_verification_code`
3. **TTL**: 10 минут (600000 мс)
4. **Cooldown**: 60 секунд между запросами (конфигурируемый через `VERIFICATION_CODE_COOLDOWN_MS`)
5. **Max attempts**: 5 попыток ввода кода
6. **Отправка**: через NotificationService (email/SMS провайдеры)

**Security features:**

- Tenant isolation на всех уровнях (Repository/Service/Controller)
- Rate limiting: 3 запроса/5мин (request), 5 попыток/5мин (confirm)
- Cooldown защита от спама запросов
- Cross-tenant блокировка (пользователь tenant A не может использовать код из tenant B)
- Автоматическая инвалидация после успешной верификации
- Логирование всех критичных событий (генерация, попытки, успех/неудача)

**Особенности реализации:**

- Graceful degradation при сбое email/SMS провайдеров
- Динамическая конфигурация через environment variables
- UTC timezone для корректной работы cooldown
- Кэш инвалидация после верификации (UserService cache)
- Integration тесты: 43 теста, coverage 85-95%

#### Адреса пользователей (UserAddress)

**Контроллер**: `UserAddressController`

**Endpoints**:

- `GET /user-addresses` - получение всех адресов пользователя
- `GET /user-addresses/:id` - получение конкретного адреса
- `POST /user-addresses` - создание нового адреса
- `PUT /user-addresses/:id` - полное обновление адреса
- `PATCH /user-addresses/:id/set-default` - установка адреса по умолчанию
- `DELETE /user-addresses/:id` - удаление адреса

**Модель данных**:

- `title`: название адреса (например, "Дом", "Работа")
- `street`: улица
- `house`: номер дома
- `apartment`: квартира (optional)
- `city`: город
- `postal_code`: почтовый индекс (optional)
- `country`: страна (default: "Россия")
- `is_default`: флаг основного адреса
- `tenant_id`: идентификатор тенанта (для multi-tenant изоляции)

**Tenant Isolation реализация**:

1. **Repository level**: автоматическая фильтрация по `tenant_id` во всех запросах
   - `create()`: добавляет `tenant_id` из `TenantContext`
   - `findAll()`, `findOne()`, `update()`, `remove()`: WHERE `tenant_id = ?`
   - `clearDefault()`, `markDefault()`, `setDefault()`: tenant-scoped операции
   - Fallback на `tenant_id = 1` когда context возвращает `null`

2. **Service level**: делегирование tenant isolation в repository

3. **Controller level**: проверка прав доступа через `AuthGuard` и `RoleGuard`

**Security features**:

- Cross-user blocking: пользователь не может видеть/изменять/удалять адреса других пользователей
- List filtering: `GET /addresses` возвращает только адреса текущего пользователя
- Default address isolation: каждый пользователь имеет независимый default адрес
- Tenant isolation: адреса полностью изолированы между тенантами

**Индексы БД** (для производительности):

- `idx_user_address_tenant_id`: поиск по tenant
- `idx_user_address_tenant_id_id`: поиск конкретного адреса в tenant
- `idx_user_address_tenant_id_user_id`: поиск адресов пользователя в tenant

**Swagger декораторы**:

- `@CreateUserAddressSwaggerDecorator()`
- `@GetUserAddressSwaggerDecorator()`
- `@GetUserAddressesSwaggerDecorator()`
- `@UpdateUserAddressSwaggerDecorator()`
- `@SetDefaultUserAddressSwaggerDecorator()`
- `@RemoveUserAddressSwaggerDecorator()`

**Тестовое покрытие**:

- Unit тесты Repository: 24 теста (все проходят)
  - Проверка tenant_id во всех операциях
  - Fallback логика на `tenant_id = 1`
  - Transaction handling
- Integration тесты: 13 тестов (все проходят)
  - CRUD операции
  - Cross-user blocking (GET/PUT/DELETE/PATCH → 404)
  - List filtering по пользователю
  - Default address isolation между пользователями

**Особенности реализации**:

- Транзакционная поддержка для `setDefault` (clearDefault + markDefault)
- Автоматическая сортировка: default адрес первым, затем по дате создания
- Валидация через DTO с кастомными валидаторами
- Response классы с полными Swagger декораторами

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

**Endpoints для пользователей (CUSTOMER_ROLES)**:

- `GET /notifications` - список уведомлений с пагинацией и фильтрацией (status, type)
- `GET /notifications/unread-count` - количество непрочитанных уведомлений
- `PUT /notifications/:id/read` - отметить уведомление как прочитанное
- `GET /notifications/settings` - получить настройки уведомлений (auto-created)
- `PUT /notifications/settings` - обновить настройки уведомлений

**Endpoints для менеджеров (MANAGER_ROLES)**:

- `GET /notifications/templates` - список шаблонов уведомлений
- `POST /notifications/templates` - создать шаблон
- `PUT /notifications/templates/:id` - обновить шаблон
- `GET /notifications/statistics` - статистика уведомлений

**Endpoints для администраторов тенанта (TENANT_ADMIN_ROLES)**:

- `DELETE /notifications/templates/:id` - удалить шаблон

**Особенности**:

- Система уведомлений для пользователей
- Email и SMS провайдеры
- Шаблоны уведомлений с поддержкой переменных
- Event-driven архитектура
- Автоматические уведомления: регистрация, заказы, платежи, смена пароля
- Батчевая обработка и кэширование шаблонов
- Tenant isolation: все уведомления изолированы по тенантам
- Settings blocking: уведомления не отправляются при отключенных настройках пользователя
- Integration тесты: полное покрытие всех endpoints (18 тестов)

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
  'registration': '3 попытки/мин',
  'verify/email/request': '3 попытки/5мин',
  'verify/phone/request': '3 попытки/5мин',
  'verify/email/confirm': '5 попыток/5мин',
  'verify/phone/confirm': '5 попыток/5мин'
}
```

### Кастомные валидаторы

- **`@IsSanitizedString`**: защита от XSS, удаление HTML тегов
- **`@IsValidName`**: валидация имен (только буквы, пробелы, дефисы)
- **`@IsValidPhone`**: валидация телефонных номеров
- **`@IsPasswordStrong`**: проверка сложности пароля (8+ символов, заглавные, строчные, цифры, спецсимволы)

**IsSanitizedString**:

- Удаление лишних пробелов и HTML тегов
- Проверка на подозрительные XSS паттерны
- Защита от `<script>`, `javascript:`, `on*=` атак
- Сообщение: "Строка содержит недопустимые символы или HTML теги"

**IsPasswordStrong**:

- Минимум 8 символов
- Заглавные и строчные буквы
- Цифры и специальные символы
- Запрет простых паролей (password, 123456, qwerty, etc.)
- Сообщение: "Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы. Простые пароли запрещены"

**IsValidPhone**:

- От 7 до 15 цифр
- Поддержка префикса `+`
- Нормализация пробелов, дефисов, скобок
- Сообщение: "Номер телефона должен содержать от 7 до 15 цифр и может начинаться с +"

**IsValidName**:

- От 2 до 100 символов
- Только буквы, пробелы, дефисы, апострофы
- Поддержка кириллицы и латиницы
- Сообщение: "Имя должно содержать от 2 до 100 символов, только буквы, пробелы, дефисы и апострофы"

### Guards (защитники)

- **`AuthGuard`**: проверка JWT токена, извлечение пользователя
- **`RoleGuard`**: проверка ролей пользователя, кэширование ролей
- **`BruteforceGuard`**: защита от брутфорса с разными лимитами для endpoints

**AuthGuard**:

- Извлечение токена из заголовка `Authorization: Bearer`
- Декодирование access токена через TokenService
- Установка пользователя в request объект
- Обработка ошибок: 401 для отсутствия токена, 403 для невалидного

**RoleGuard**:

- Кэширование Set ролей для производительности
- Проверка ролей пользователя через Reflector
- Поддержка множественных ролей
- Обработка ошибок: 401 для неавторизованных, 403 для недостаточных прав

**BruteforceGuard**:

- Кэширование конфигурации на 30 секунд
- Автоматический cleanup истёкших счётчиков
- Специальные лимиты для auth endpoints
- Маскирование IP в логах для GDPR
- Retry-After заголовок при превышении лимита

### Passport стратегии

- **`JwtStrategy`**: Passport стратегия для JWT аутентификации
    - Извлечение токена из заголовка `Authorization: Bearer`
    - Валидация payload и получение пользователя через `UserService`
    - Интеграция с `AuthGuard` для автоматической аутентификации

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

### Файловая безопасность

- **FileInterceptor**: с ограничениями размера и типов
- **Валидация файлов**: проверка MIME типов, размеров
- **Безопасное хранение**: вне БД, с проверкой доступа
- **Статические файлы**: через CDN, с кэшированием

**Multer защита**:

- **MIME типы**: только изображения (JPEG, PNG, GIF)
- **Размер файлов**: максимум 256 KB
- **Path Traversal**: защита от `../../etc/passwd` атак
- **MIME spoofing**: проверка реального типа файла
- **Расширения**: только разрешенные расширения файлов

### Middleware и Interceptors

- **CorrelationIdMiddleware**: генерирует/пробрасывает `x-request-id` для трассировки
- **TenantMiddleware**: извлекает `tenant_id` из заголовка `x-tenant-id`
- **Cookie Parser**: с секретным ключом для подписи cookies
- **Helmet**: безопасные HTTP заголовки
- **CORS**: настройка разрешенных origins

**CorrelationIdMiddleware**:

- Генерация уникального `x-request-id` для каждого запроса
- Пробрасывание существующего ID из заголовка
- Добавление ID в response headers для клиента
- Использование `randomUUID()` для генерации

**TenantMiddleware**:

- Извлечение tenant ID из заголовка `x-tenant-id`
- Валидация существования и активности тенанта
- Fallback на tenant_id=1 в development режиме
- Установка tenant ID в TenantContext и request объект

### Кастомные декораторы

- **`@Roles(...roles)`**: декоратор для проверки ролей пользователя
    - Использует `SetMetadata` и `Reflector` для метаданных
    - Интеграция с `RoleGuard` для автоматической авторизации
    - Пример: `@Roles('ADMIN', 'MANAGER')`

### Swagger декораторы

- **Кастомные декораторы**: `@CreateUserSwaggerDecorator()`, `@LoginSwaggerDecorator()`
- **Паттерн**: `ApiOperation` + `ApiBody` + `ApiResponse` + `ApiBearerAuth`
- **Примеры**: встроенные примеры валидных/невалидных данных
- **Автодокументация**: `/online-store/docs` с полным описанием API
- **Оптимизация**: мемоизация общих ответов для производительности

**Полный список декораторов** (64+ декораторов):

**Auth** (5): CheckUserAuth, Login, Logout, Registration, UpdateAccessToken
**Brand** (5): Create, Get, GetListAll, Remove, Update
**Cart** (7): Append, ApplyPromoCode, Clear, Decrement, Get, Increment, RemoveProduct, RemovePromoCode
**Category** (5): Create, Get, GetListAll, Remove, Update
**Order** (9): AdminCreate, AdminGetOrderListUsers, AdminGetOrderUser, AdminGetStoreOrderList, AdminRemove, GuestCreate, UserCreate, UserGetOrderList, UserGetOrder
**Payment** (2): GuestMakePayment, UserMakePayment
**Product** (8): Create, Get, GetListV2, GetListByBrandIdV2, GetListByCategoryIdV2, GetAllByBrandIdAndCategoryIdV2, Remove, Update
**ProductProperty** (5): Create, Get, GetList, Remove, Update
**Rating** (2): Create, Get
**Role** (3): Create, Get, GetList
**User** (11): AddRole, Create, Get, GetList, Remove, RemoveRole, Update, UpdatePhone, RequestVerifyEmail, ConfirmVerifyEmail, RequestVerifyPhone, ConfirmVerifyPhone
**UserAddress** (7): Create, Get, GetList, Remove, Update
**Notification** (12): CreateTemplate, DeleteTemplate, GetStatistics, GetTemplates, GetUnreadCount, GetUserNotifications, GetUserSettings, MarkAsRead, UpdateTemplate, UpdateUserSettings

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

### Jest конфигурация

**Оптимизации производительности**:

- **isolatedModules**: отключение проверки типов между модулями (в 2-3× быстрее)
- **diagnostics: false**: TypeScript диагностика уже выполнена линтером
- **Кэширование**: Jest cache для ускорения повторных запусков
- **Проекты**: unit, integration, e2e с разными настройками

**CI оптимизации**:

- **bail**: остановка при первой ошибке
- **silent**: минимальный вывод в логах
- **minimal reporters**: только необходимые отчеты
- **maxWorkers: 4**: параллельное выполнение тестов

**Конфигурация проектов**:

- **Unit**: быстрые тесты без БД, с моками
- **Integration**: тесты с БД, последовательное выполнение, автоматический сброс БД через `globalSetup`/`globalTeardown`
- **E2E**: сквозные сценарии, полная изоляция

**Global Setup/Teardown для Integration тестов**:

- **`globalSetup`**: автоматический сброс БД перед запуском всех integration тестов
    - Использует `TestDatabaseSetup.resetDatabase('test')` для полной очистки
    - Применяет миграции и сиды в правильном порядке
    - Убирает предупреждения о дубликатах миграций/сидов
    - Файл: `tests/setup/integration-global-setup.ts`
- **`globalTeardown`**: опциональная очистка после тестов
    - Файл: `tests/setup/integration-global-teardown.ts`
- **Конфигурация**: в `jest.config.js` для проекта `integration`

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

# Верификация email/phone
VERIFICATION_CODE_COOLDOWN_MS=60000   # Кулдаун между запросами кодов (60 сек)
VERIFICATION_CODE_TTL_MS=600000       # Время жизни кода верификации (10 мин)
VERIFICATION_MAX_ATTEMPTS=5           # Максимум попыток ввода кода
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

### Конфигурация компонентов

**JWT конфигурация**:

- **`JwtSettings()`**: настройки секретного ключа и времени жизни
- **`jwtConfig()`**: конфигурация JwtModule с глобальной регистрацией
- **Ленивая инициализация**: настройки загружаются при первом вызове

**Swagger конфигурация**:

- **`swaggerConfig()`**: настройка документации API
- **Bearer Auth**: JWT аутентификация в Swagger UI (`JWT-auth`)
- **Cookie Auth**: поддержка cookies (`authCookie`)
- **Multi-tenant**: API Key для заголовка `x-tenant-id`

**Multer конфигурация**:

- **`multerConfig()`**: безопасная загрузка файлов
- **MIME типы**: только изображения (JPEG, PNG, GIF)
- **Размер файлов**: максимум 256 KB
- **Защита**: от Path Traversal и MIME spoofing атак

**Sequelize конфигурация**:

- **`SequelizeConfigService`**: настройки подключения к БД
- **Автозагрузка моделей**: все модели регистрируются автоматически
- **Charset**: UTF8MB4 с collation `utf8mb4_0900_ai_ci`
- **Синхронизация**: отключена в пользу миграций
- **Timezone**: `'+00:00'` (UTC) для корректной работы timestamp операций (критично для cooldown/TTL)

### Скрипты

```bash
# Разработка
npm run start:dev     # Разработка
npm run start:prod    # Продакшн
npm run build         # Сборка
npm run lint          # Линтер
npm run format        # Prettier

# Тестирование
npm run test          # Все тесты
npm run test:unit     # Unit тесты
npm run test:integration # Integration тесты
npm run test:e2e      # E2E тесты
npm run test:cov      # Покрытие
npm run test:ci       # CI тесты

# База данных
npm run db:migrate    # Применить миграции
npm run db:seed:all   # Применить сиды
npm run db:reset      # Сброс БД (drop + create + migrate + seed)
npm run db:drop       # Удалить БД
npm run db:create     # Создать БД
```

**Детальные скрипты**:

**Тестирование**:

- `test:unit` - Unit тесты (быстрые, без БД)
- `test:integration` - Integration тесты (с БД, последовательно)
- `test:integration:ci` - CI интеграционные тесты (параллельно, 4 workers)
- `test:e2e` - E2E тесты (сквозные сценарии)
- `test:cov` - Покрытие кода
- `test:debug` - Отладка тестов (detectOpenHandles)

**База данных**:

- `db:migrate` - Применить миграции
- `db:migrate:undo` - Откатить последнюю миграцию
- `db:migrate:undo:all` - Откатить все миграции
- `db:migrate:status` - Статус миграций
- `db:seed:all` - Применить все сиды
- `db:seed:undo:all` - Откатить все сиды
- `db:migration:generate` - Создать новую миграцию

**CI/CD**:

- `test:setup` - Настройка тестовой БД
- `test:reset` - Сброс тестовой БД
- `db:migrate:test` - Миграции для тестов
- `db:migrate:undo:test` - Откат миграций для тестов

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

**События системы**:

- **`OrderCreatedEvent`**: создание заказа
- **`OrderStatusChangedEvent`**: изменение статуса заказа
- **`UserRegisteredEvent`**: регистрация пользователя
- **`PaymentCompletedEvent`**: завершение платежа
- **`OrderShippedEvent`**: отправка заказа
- **`OrderDeliveredEvent`**: доставка заказа
- **`OrderCancelledEvent`**: отмена заказа
- **`PasswordChangedEvent`**: смена пароля
- **`PasswordResetRequestedEvent`**: запрос сброса пароля
- **`EmailVerificationEvent`**: верификация email
- **`MarketingCampaignEvent`**: маркетинговые кампании

**Оптимизации**:

- Кэширование шаблонов уведомлений
- Параллельная обработка событий
- Батчевая отправка уведомлений
- Пул обработчиков для масштабируемости

**NotificationEventHandler оптимизации**:

- **Кэширование шаблонов**: Map кэш для быстрого доступа
- **Батчевая обработка**: очередь на 50 уведомлений с таймаутом 1с
- **Приоритизация**: от 1 (маркетинг) до 10 (заказы)
- **Ретраи**: до 3 попыток с экспоненциальной задержкой
- **Метрики**: отслеживание производительности и ошибок
- **Параллельная обработка**: Promise.allSettled для батчей

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

**Структура миграций**:

- **Именование**: `YYYYMMDDHHMMSS-action-entity.ts`
- **Индексы**: автоматическое создание индексов для производительности
- **FK ограничения**: RESTRICT для предотвращения каскадного удаления
- **Charset**: UTF8MB4 с collation `utf8mb4_0900_ai_ci`
- **Порядок выполнения**: критичен для зависимостей между таблицами
    - Миграция создания таблицы должна выполняться до миграций, добавляющих FK на неё
    - Пример: `20251005090000-create-tenants.ts` должна выполняться раньше `20251006000000-add-tenant-id-to-notifications.ts`
    - При переименовании миграций проверять зависимости и порядок timestamp

**Сиды ролей** (14 ролей):

- **Платформенные**: SUPER_ADMIN, PLATFORM_ADMIN
- **Тенантские**: TENANT_OWNER, TENANT_ADMIN, MANAGER, CONTENT_MANAGER, CUSTOMER_SERVICE
- **Пользователи**: VIP_CUSTOMER, WHOLESALE, CUSTOMER, AFFILIATE, GUEST
- **Legacy**: ADMIN, USER (для обратной совместимости)

**Сиды пользователей**:

- Пользователи для каждой роли с уникальными email
- Хэшированные пароли: `Password123!`
- Расширенные флаги: is_active, is_verified, is_email_verified, etc.
- Локализация: preferred_language: 'ru', timezone: 'Europe/Moscow'

**Сиды tenants**:

- Дефолтный tenant с `id=1` для тестов и development
- План: `'free'` (соответствует ENUM в миграции: 'free', 'starter', 'professional', 'enterprise')
- Статус: `'active'` для корректной работы TenantMiddleware
- Важно: при изменении ENUM планов в миграции обновлять соответствующий сидер

### Тестовые утилиты

- **TestDataFactory**: генерация уникальных тестовых данных
- **TestCleanup**: централизованная очистка БД между тестами
- **TestTransaction**: изоляция тестов через транзакции
- **MockFactories**: стандартизированные моки для unit тестов
- **Auth helpers**: автоматическая авторизация в тестах

**TestDataFactory возможности**:

- `uniqueEmail()` - уникальный email адрес
- `uniquePhone()` - уникальный российский телефон
- `createUserDto(overrides)` - DTO для создания пользователя
- `createAuthenticatedUser(app)` - создание пользователя в БД + получение токена
- `createUserWithRole(app, role)` - создание пользователя с определенной ролью

**TestCleanup методы**:

- `cleanUsers(sequelize)` - очистка временных пользователей (id > 14)
- `resetUser13(sequelize)` - сброс user 13 к дефолтным значениям
- `cleanAuthData(sequelize)` - очистка login_history + refresh_token
- `cleanOrders(sequelize)` - очистка заказов
- `cleanCarts(sequelize)` - очистка корзин
- `cleanAll(sequelize)` - полная очистка всех данных

**TestTransaction возможности**:

- Изоляция тестов через транзакции с автоматическим rollback
- Быстрее cleanup для unit тестов
- Полная изоляция без ручного cleanup
- Не работает с вложенными транзакциями в коде

**TestDatabaseSetup возможности**:

- `applyMigrations(env)` - применение миграций для указанного окружения
- `applySeeds(env)` - применение сидов для указанного окружения
- `setupDatabase(env)` - полная настройка БД: миграции + сиды
- `resetDatabase(env)` - полный сброс БД: drop → create → migrate → seed
- Используется в `globalSetup` для автоматической инициализации тестовой БД
- Обработка ошибок: предупреждения вместо падения тестов

### Производительность и мониторинг

- **Кэширование**: мемоизация Swagger декораторов, шаблонов уведомлений
- **Event-driven**: асинхронная обработка событий с батчевой отправкой
- **Connection Pool**: адаптивная конфигурация для разных окружений
- **Логирование**: структурированные JSON логи с correlation ID
- **Метрики**: отслеживание производительности и ошибок

**Оптимизации Swagger декораторов**:

- **Мемоизация**: экономия 82% объектов ApiResponse при инициализации
- **Singleton кэш**: для функций без параметров (UnauthorizedResponse, ForbiddenResponse)
- **Map кэш**: для функций с параметрами (NotFoundResponse, BadRequestResponse)
- **Константы**: переиспользование схем между декораторами

**Оптимизации логирования**:

- **Pino конфигурация**: структурированные JSON логи в production
- **Pretty printing**: только в development
- **Маскирование PII**: автоматическое удаление чувствительных данных
- **Correlation ID**: трассировка запросов через x-request-id

**Оптимизации тестов**:

- **Jest cache**: кэширование результатов трансформации
- **isolatedModules**: отключение проверки типов между модулями
- **diagnostics: false**: TypeScript диагностика уже выполнена линтером
- **CI оптимизации**: bail, silent, minimal reporters

### CI/CD и Deployment

- **GitHub Actions**: автоматические проверки на каждый PR
- **Проверки**: lint, type check, unit tests, integration tests, coverage
- **Deployment**: Railway/Render для production hosting
- **Docker**: multi-stage builds для production
- **Health Checks**: мониторинг состояния приложения
- **Migrations**: автоматическое применение миграций в production

**GitHub Actions конфигурация**:

- **Параллельные джобы**: lint, build, test-unit, test-integration, migration-check
- **MySQL сервис**: оптимизированная конфигурация для тестов
- **Кэширование**: TypeScript, Jest, npm dependencies
- **Автоматическая отмена**: устаревших запусков при новых коммитах

**Оптимизации CI**:

- **Shallow clone**: fetch-depth: 1 для ускорения
- **Кэширование**: build artifacts, Jest cache, TypeScript build
- **Параллельность**: независимые джобы выполняются параллельно
- **MySQL оптимизации**: innodb_flush_log_at_trx_commit = 2, sync_binlog = 0

**Coverage отчеты**:

- **Интеграционные тесты**: обязательное покрытие для критичных модулей
- **Unit тесты**: покрытие не собирается (низкое покрытие ожидаемо)
- **Артефакты**: отчеты сохраняются на 30 дней

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
