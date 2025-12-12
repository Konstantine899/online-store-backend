# 🗄️ Database Documentation

## Основные модели

### Пользователи и безопасность

#### User

Основная модель пользователя с расширенными флагами:

- **Базовые поля**: email, phone, password_hash, first_name, last_name
- **Флаги состояния**: is_active, is_blocked, is_verified, is_email_verified
- **Настройки**: is_newsletter_subscribed, is_marketing_consent, is_cookie_consent
- **Профиль**: is_profile_completed, is_vip_customer, is_beta_tester
- **Безопасность**: is_two_factor_enabled, is_terms_accepted, is_privacy_accepted
- **Локализация**: preferred_language, timezone
- **Timestamps**: created_at, updated_at, last_login_at

#### Role

Система ролей с поддержкой multi-tenancy:

- **Типы ролей**: platform, tenant, user, legacy
- **Поля**: name, description, type, permissions
- **Multi-tenancy**: tenant_id для изоляции
- **Иерархия**: platform > tenant > user > legacy

#### UserRole

Связь пользователей с ролями:

- **Связи**: user_id, role_id
- **Multi-tenancy**: tenant_id
- **Timestamps**: created_at, updated_at
- **Временные роли**: expires_at для временных назначений
- **Метаданные**: JSON поле для автоматических назначений

#### Role Analytics (SAAS-017-18)

Система аналитики ролей использует следующие таблицы:

- **roles**: статистика ролей (активные, системные, tenant)
- **user_roles**: статистика назначений, истечений
- **role_permissions**: статистика разрешений
- **audit_logs**: метрики операций назначения/отзыва (ASSIGN/REVOKE)
- **role_auto_renewal_config**: метрики автоматического продления ролей

**Особенности:**
- SQL агрегация на уровне БД для производительности
- Tenant isolation через фильтрацию по tenant_id
- Исторические данные из audit_logs для трендов

#### RefreshToken

Управление refresh токенами:

- **Поля**: token_hash, user_id, expires_at, is_revoked
- **Безопасность**: хэширование токенов
- **Ротация**: автоматическая смена при использовании

#### LoginHistory

История входов пользователей:

- **Поля**: user_id, ip_address, user_agent, login_at, success
- **Безопасность**: отслеживание подозрительной активности
- **Аналитика**: статистика входов

#### PasswordResetToken

Токены для сброса пароля:

- **Поля**: token_hash, user_id, expires_at, is_used
- **Безопасность**: ограниченное время жизни
- **Одноразовость**: использование только один раз

#### UserVerificationCode

Коды верификации:

- **Поля**: user_id, code, type, expires_at, is_used
- **Типы**: email_verification, phone_verification
- **Безопасность**: ограниченное время жизни

### Товары и каталог

#### Product

Основная модель товара:

- **Базовые поля**: name, description, price, sku, stock_quantity
- **Медиа**: image_url, gallery_urls
- **Статус**: is_active, is_featured, is_digital
- **SEO**: meta_title, meta_description, slug
- **Multi-tenancy**: tenant_id для изоляции

#### Category

Категории товаров:

- **Поля**: name, description, slug, parent_id
- **Иерархия**: поддержка вложенных категорий
- **SEO**: meta_title, meta_description
- **Multi-tenancy**: tenant_id

#### Brand

Бренды товаров:

- **Поля**: name, description, logo_url, website_url
- **SEO**: meta_title, meta_description, slug
- **Multi-tenancy**: tenant_id

#### ProductProperty

Свойства товаров:

- **Поля**: name, value, product_id
- **Типы**: string, number, boolean, date
- **Валидация**: проверка типов значений

#### Rating

Рейтинги товаров:

- **Поля**: user_id, product_id, rating, review, created_at
- **Валидация**: рейтинг от 1 до 5
- **Multi-tenancy**: tenant_id

### Заказы и платежи

#### Order

Заказы пользователей:

- **Поля**: order_number, user_id, status, total_amount, shipping_address
- **Статусы**: pending, processing, shipped, delivered, cancelled
- **Адреса**: JSON поля для гибкости
- **Multi-tenancy**: tenant_id

#### OrderItem

Элементы заказа:

- **Поля**: order_id, product_id, quantity, price, total
- **Связи**: с заказом и товаром
- **Расчеты**: автоматический расчет итогов

#### Cart

Корзины пользователей:

- **Поля**: user_id, session_id, created_at, updated_at
- **Поддержка**: авторизованных и гостевых пользователей
- **Multi-tenancy**: tenant_id

#### CartProduct

Товары в корзине:

- **Поля**: cart_id, product_id, quantity, added_at
- **Валидация**: проверка наличия товара
- **Обновления**: автоматическое обновление timestamp

### Уведомления

#### Notification

Уведомления пользователей:

- **Поля**: user_id, type, title, message, is_read, data
- **Типы**: email, sms, push, in_app
- **Данные**: JSON поле для дополнительной информации
- **Multi-tenancy**: tenant_id

#### NotificationTemplate

Шаблоны уведомлений:

- **Поля**: name, type, subject, body, variables
- **Переменные**: поддержка динамических данных
- **Multi-tenancy**: tenant_id

### Адреса

#### UserAddress

Адреса пользователей:

- **Поля**: user_id, type, street, city, state, postal_code, country
- **Типы**: shipping, billing, home, work
- **Валидация**: проверка форматов адресов
- **Multi-tenancy**: tenant_id

### Промокоды

#### PromoCode

Промокоды и скидки:

- **Поля**: code, discount_type, discount_value, min_order_amount
- **Типы скидок**: percentage, fixed_amount
- **Ограничения**: минимальная сумма заказа
- **Multi-tenancy**: tenant_id

### Тенанты

#### Tenant

Multi-tenant изоляция:

- **Поля**: name, subdomain, status, settings
- **Статусы**: active, inactive, suspended
- **Настройки**: JSON поле для конфигурации
- **Изоляция**: все данные привязаны к tenant_id

## Миграции и сиды

### Миграции (37+ миграций)

- **Нейминг**: `YYYYMMDDHHMMSS-action-entity`
- **Индексы**: для FK, часто фильтруемых полей, сортировок
- **FK constraints**: автоматические внешние ключи
- **Charset**: utf8mb4 для поддержки emoji
- **Rollback**: корректный `down` для каждой миграции

### Сиды (6 сидов)

- **Роли**: 14 ролей (platform, tenant, user, legacy)
- **Пользователи**: по одному пользователю для каждой роли
- **Категории**: базовые категории товаров
- **Бренды**: популярные бренды
- **Товары**: примеры товаров с полными данными
- **Тенанты**: базовые тенанты для тестирования

### Система ролей (14 ролей)

#### Platform роли

- **SUPER_ADMIN**: полный доступ ко всей платформе
- **PLATFORM_ADMIN**: администратор платформы
- **PLATFORM_MANAGER**: менеджер платформы

#### Tenant роли

- **TENANT_ADMIN**: администратор тенанта
- **TENANT_MANAGER**: менеджер тенанта
- **TENANT_OPERATOR**: оператор тенанта

#### User роли

- **USER_VIP**: VIP пользователь
- **USER_PREMIUM**: премиум пользователь
- **USER_STANDARD**: стандартный пользователь
- **USER_GUEST**: гость

#### Legacy роли

- **ADMIN**: устаревшая роль администратора
- **MANAGER**: устаревшая роль менеджера
- **USER**: устаревшая роль пользователя

## Индексы и производительность

### Основные индексы

- **FK индексы**: для всех внешних ключей
- **Составные индексы**: для часто используемых запросов
- **Уникальные индексы**: для email, phone, sku
- **Частичные индексы**: для активных записей

### Оптимизации

- **Connection pool**: адаптивная конфигурация
- **Query optimization**: избежание N+1 запросов
- **Pagination**: обязательная пагинация списков
- **Caching**: кэширование часто читаемых данных

## Безопасность

### Изоляция данных

- **Multi-tenancy**: все данные привязаны к tenant_id
- **Row-level security**: автоматическая фильтрация по тенанту
- **Access control**: проверка прав доступа

### Валидация

- **Constraints**: проверка на уровне БД
- **Triggers**: автоматические проверки
- **Foreign keys**: целостность данных

### Backup и восстановление

- **Автоматические бэкапы**: ежедневные бэкапы
- **Point-in-time recovery**: восстановление на момент
- **Тестирование**: регулярное тестирование восстановления

## Мониторинг

### Метрики

- **Query performance**: время выполнения запросов
- **Connection pool**: использование соединений
- **Table sizes**: размеры таблиц
- **Index usage**: использование индексов

### Алерты

- **Slow queries**: медленные запросы
- **Connection issues**: проблемы с подключением
- **Disk space**: нехватка места
- **Replication lag**: задержка репликации
