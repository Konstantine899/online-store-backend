# 🔌 API Documentation

## Swagger декораторы (60+ декораторов)

### Auth модуль (5 декораторов)

- **CheckUserAuthSwaggerDecorator** - проверка авторизации пользователя
- **LoginSwaggerDecorator** - аутентификация пользователя
- **LogoutSwaggerDecorator** - выход пользователя (удаление refresh token)
- **RegistrationSwaggerDecorator** - регистрация пользователя
- **UpdateAccessTokenSwaggerDecorator** - обновление access token

### Brand модуль (8 декораторов)

- **CreateBrandSwaggerDecorator** - создание бренда продукта
- **GetBrandSwaggerDecorator** - получение бренда
- **GetListAllBrandsSwaggerDecorator** - получение списка брендов
- **GetListBrandsV2SwaggerDecorator** - получение списка брендов с пагинацией (V2)
- **GetBrandsByCategoryDecorator** - получение брендов по категории
- **GetListBrandsByCategoryV2SwaggerDecorator** - получение брендов по категории с пагинацией (V2)
- **RemoveBrandSwaggerDecorator** - удаление бренда
- **UpdateBrandSwaggerDecorator** - обновление бренда

### Cart модуль (8 декораторов)

- **AppendToCartSwaggerDecorator** - добавление товара в корзину
- **ApplyPromoCodeSwaggerDecorator** - применение промокода
- **ClearCartSwaggerDecorator** - очистка корзины
- **DecrementSwaggerDecorator** - уменьшение количества товара
- **GetCartSwaggerDecorator** - получение корзины пользователя
- **IncrementSwaggerDecorator** - увеличение количества товара
- **RemoveProductFromCartSwaggerDecorator** - удаление товара из корзины
- **RemovePromoCodeSwaggerDecorator** - удаление промокода

### Category модуль (7 декораторов)

- **CreateCategorySwaggerDecorator** - создание категории
- **GetCategorySwaggerDecorator** - получение категории
- **GetListAllCategoriesSwaggerDecorator** - получение списка категорий
- **GetListCategoriesV2SwaggerDecorator** - получение списка категорий с пагинацией (V2)
- **RemoveCategorySwaggerDecorator** - удаление категории
- **UpdateCategorySwaggerDecorator** - обновление категории

### Order модуль (9 декораторов)

- **AdminCreateOrderSwaggerDecorator** - создание заказа администратором
- **AdminGetOrderListUsersSwaggerDecorator** - получение списка заказов пользователя администратором
- **AdminGetOrderUserSwaggerDecorator** - получение заказа пользователя администратором
- **AdminGetStoreOrderListSwaggerDecorator** - получение списка всех заказов магазина
- **AdminRemoveOrderSwaggerDecorator** - удаление заказа администратором
- **GuestCreateOrderSwaggerDecorator** - создание заказа гостем
- **UserCreateOrderSwaggerDecorator** - создание заказа пользователем
- **UserGetOrderListSwaggerDecorator** - получение списка заказов пользователя
- **UserGetOrderSwaggerDecorator** - получение заказа пользователя

### Payment модуль (2 декоратора)

- **GuestMakePaymentSwaggerDecorator** - оплата заказа гостем
- **UserMakePaymentSwaggerDecorator** - оплата заказа пользователем

### Product модуль (12 декораторов)

- **CreateProductSwaggerDecorator** - создание продукта
- **GetProductSwaggerDecorator** - получение продукта
- **GetListProductV2SwaggerDecorator** - получение списка продуктов с пагинацией (V2)
- **GetListProductByBrandIdV2SwaggerDecorator** - получение продуктов по бренду с пагинацией (V2)
- **GetListProductByCategoryIdV2SwaggerDecorator** - получение продуктов по категории с пагинацией (V2)
- **GetAllByBrandIdAndCategoryIdV2SwaggerDecorator** - получение продуктов по бренду и категории с пагинацией (V2)
- **RemoveProductSwaggerDecorator** - удаление продукта
- **UpdateProductSwaggerDecorator** - обновление продукта

### ProductProperty модуль (5 декораторов)

- **CreateProductPropertySwaggerDecorator** - создание свойства продукта
- **GetProductPropertySwaggerDecorator** - получение свойства продукта
- **GetListProductPropertySwaggerDecorator** - получение списка свойств продукта
- **RemoveProductPropertySwaggerDecorator** - удаление свойства продукта
- **UpdateProductPropertySwaggerDecorator** - обновление свойства продукта

### Rating модуль (2 декоратора)

- **CreateRatingSwaggerDecorator** - создание рейтинга продукта
- **GetRatingSwaggerDecorator** - получение рейтинга

### Role модуль (13 декораторов)

**CRUD операции (3):**
- **CreateRoleSwaggerDecorator** - создание роли пользователя
- **GetRoleSwaggerDecorator** - получение роли пользователя
- **GetListRoleSwaggerDecorator** - получение списка ролей пользователя

**Analytics endpoints (10):**
- **GET /role/analytics/stats** - общая статистика использования ролей
- **GET /role/analytics/stats/:roleId** - статистика по конкретной роли
- **GET /role/analytics/permissions/stats** - статистика использования разрешений
- **GET /role/analytics/permissions/stats/:resource/:action** - статистика конкретного разрешения
- **GET /role/analytics/operations/stats** - метрики операций назначения/отзыва ролей
- **GET /role/analytics/auto-assignments/stats** - статистика автоматических назначений ролей
- **GET /role/analytics/expiration/stats** - статистика истечения временных ролей
- **GET /role/analytics/hierarchy/stats** - статистика иерархии ролей
- **GET /role/analytics/dashboard** - агрегированный дашборд с ключевыми метриками
- **GET /role/analytics/distribution/by-tenant** - распределение ролей по тенантам (только SUPER_ADMIN)

**Особенности Role Analytics:**
- Tenant isolation: TENANT_ADMIN видит только данные своего тенанта
- Фильтрация по датам, тенантам, периодам (last7d, last30d, last90d)
- SQL агрегация для эффективной обработки больших объемов данных
- Все endpoints требуют авторизации (ADMIN_ROLES)

### User модуль (15 декораторов)

- **AddRoleUserSwaggerDecorator** - добавление роли пользователю
- **ChangePasswordSwaggerDecorator** - смена пароля пользователя
- **CreateUserSwaggerDecorator** - создание пользователя
- **GetUserSwaggerDecorator** - получение пользователя
- **GetListUsersSwaggerDecorator** - получение списка пользователей
- **GetUserStatsSwaggerDecorator** - получение статистики пользователя
- **RemoveRoleUserSwaggerDecorator** - удаление роли пользователя
- **RemoveUserSwaggerDecorator** - удаление пользователя
- **UpdateUserSwaggerDecorator** - обновление пользователя
- **UpdateUserFlagsSwaggerDecorator** - обновление флагов пользователя
- **UpdateUserPhoneSwaggerDecorator** - обновление телефона пользователя
- **UpdateUserPreferencesSwaggerDecorator** - обновление предпочтений пользователя
- **UpdateUserProfileSwaggerDecorator** - обновление профиля пользователя
- **VerifyUserSwaggerDecorator** - верификация пользователя

### UserAddress модуль (7 декораторов)

- **CreateUserAddressSwaggerDecorator** - создание адреса пользователя
- **GetUserAddressSwaggerDecorator** - получение адреса пользователя
- **GetListUserAddressSwaggerDecorator** - получение списка адресов пользователя
- **RemoveUserAddressSwaggerDecorator** - удаление адреса пользователя
- **SetDefaultUserAddressSwaggerDecorator** - установка адреса по умолчанию
- **UpdateUserAddressSwaggerDecorator** - обновление адреса пользователя

### Notification модуль (10 декораторов)

- **CreateTemplateSwaggerDecorator** - создание шаблона уведомления
- **DeleteTemplateSwaggerDecorator** - удаление шаблона уведомления
- **GetStatisticsSwaggerDecorator** - получение статистики уведомлений
- **GetTemplatesSwaggerDecorator** - получение списка шаблонов
- **GetUnreadCountSwaggerDecorator** - получение количества непрочитанных
- **GetUserNotificationsSwaggerDecorator** - получение уведомлений пользователя
- **GetUserSettingsSwaggerDecorator** - получение настроек пользователя
- **MarkAsReadSwaggerDecorator** - отметка как прочитанное
- **UpdateTemplateSwaggerDecorator** - обновление шаблона
- **UpdateUserSettingsSwaggerDecorator** - обновление настроек пользователя

## Паттерн Swagger декораторов

```typescript
@ApiOperation({ summary: 'Описание операции' })
@ApiBody({ type: CreateUserDto })
@ApiResponse({ status: 201, description: 'Успешное создание', type: UserResponse })
@ApiResponse({ status: 400, description: 'Ошибка валидации' })
@ApiBearerAuth('JWT-auth')
@Post()
```

## Оптимизации Swagger

- **Мемоизация**: общие ответы кэшируются для производительности
- **Константы**: переиспользование общих схем и ответов
- **Группировка**: логическое разделение по модулям
- **Автодокументация**: `/online-store/docs` с полным описанием API

## Bearer Auth

- **Имя**: `JWT-auth` (важно для сопоставления с `@ApiBearerAuth()`)
- **Тип**: HTTP Bearer Token
- **Формат**: JWT
- **Описание**: Enter JWT token
- **Расположение**: header

## Multi-tenant поддержка

- **API Key**: `x-tenant-id` header для изоляции данных
- **Описание**: Tenant ID для multi-tenant режима
- **Расположение**: header

## Дополнительная информация

### Общее количество декораторов

- **Всего**: 80+ Swagger декораторов
- **Модули**: 14 основных модулей
- **Покрытие**: 100% API endpoints

### Типы аутентификации

- **Bearer Auth**: `@ApiBearerAuth('JWT-auth')` для авторизованных endpoints
- **Cookie Auth**: `@ApiCookieAuth()` для корзины и сессий
- **Multi-tenant**: `x-tenant-id` header для изоляции данных

### Стандартные ответы

- **200 OK**: успешные операции
- **201 Created**: создание ресурсов
- **400 Bad Request**: ошибки валидации
- **401 Unauthorized**: неавторизованный доступ
- **403 Forbidden**: недостаточно прав
- **404 Not Found**: ресурс не найден
- **409 Conflict**: конфликты (например, дублирование)

### Пагинация

- **Query параметры**: `page`, `limit`, `sort`, `order`
- **Response формат**: `{ data: T[], meta: MetaData }`
- **MetaData**: `totalCount`, `lastPage`, `currentPage`, `nextPage`, `previousPage`

### Валидация

- **DTO**: все входные данные через Data Transfer Objects
- **Кастомные валидаторы**: `@IsSanitizedString`, `@IsValidName`, `@IsValidPhone`, `@IsPasswordStrong`
- **Сообщения**: на русском языке с конкретными описаниями ошибок

### LoginHistory модуль (2 декоратора)

- **GetLoginHistorySwaggerDecorator** - получение истории входов пользователя
- **GetUserLoginStatsSwaggerDecorator** - получение статистики входов пользователя

### Health модуль (3 endpoints)

- **`/health`** - общий health check с проверкой БД
- **`/live`** - проверка жизнеспособности приложения
- **`/ready`** - проверка готовности к работе

### Контроллеры и endpoints

#### Основные контроллеры (14)

- **AuthController** - аутентификация и авторизация (5 endpoints)
- **BrandController** - управление брендами (8 endpoints)
- **CartController** - управление корзиной (8 endpoints)
- **CategoryController** - управление категориями (7 endpoints)
- **OrderController** - управление заказами (9 endpoints)
- **PaymentController** - обработка платежей (2 endpoints)
- **ProductController** - управление товарами (12 endpoints)
- **ProductPropertyController** - свойства товаров (5 endpoints)
- **RatingController** - рейтинги товаров (2 endpoints)
- **RoleController** - управление ролями (3 endpoints)
- **UserController** - управление пользователями (15 endpoints)
- **UserAddressController** - адреса пользователей (7 endpoints)
- **LoginHistoryController** - история входов (2 endpoints)
- **NotificationController** - уведомления (10 endpoints)

#### Health endpoints (3)

- **HealthController** - мониторинг состояния системы

### Роли и доступ

- **ADMIN** - полный доступ ко всем endpoints
- **MANAGER** - доступ к управлению товарами, заказами, пользователями
- **USER** - доступ к собственным данным и операциям
- **GUEST** - ограниченный доступ (корзина, заказы без регистрации)

### V2 API с пагинацией

- **Brand V2**: `GetListBrandsV2SwaggerDecorator`, `GetListBrandsByCategoryV2SwaggerDecorator`
- **Category V2**: `GetListCategoriesV2SwaggerDecorator`
- **Product V2**: `GetListProductV2SwaggerDecorator`, `GetListProductByBrandIdV2SwaggerDecorator`, `GetListProductByCategoryIdV2SwaggerDecorator`, `GetAllByBrandIdAndCategoryIdV2SwaggerDecorator`

**Особенности V2 API**:

- Пагинация с параметрами `page` и `size`
- Поиск с параметром `search`
- Сортировка с параметром `sort` (ASC/DESC)
- Изоляция по `tenant_id`
- Стандартизированный формат ответа с метаданными

---
