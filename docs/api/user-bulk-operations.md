# User Bulk Operations API

## Описание

Bulk операции позволяют администраторам выполнять массовые действия над группой пользователей за один запрос. Это критично для эффективного управления большими базами пользователей в SaaS приложениях.

---

## Доступ

**Требования:**
- Роль: `ADMIN`, `SUPER_ADMIN`, `SUPPORT`
- Авторизация: Bearer JWT токен
- Rate Limiting: 10 запросов / 5 минут

---

## Endpoints

### 1. POST /user/bulk/activate

Массовая активация пользователей.

**Ограничения:**
- Максимум 1000 пользователей за один запрос
- Обрабатывает только неактивных пользователей (`isActive: false`)

**Request:**

```http
POST /online-store/user/bulk/activate
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
    "userIds": [1, 2, 3, 4, 5]
}
```

**Response 200 OK:**

```json
{
    "affectedCount": 5,
    "tenantId": 1,
    "message": "Пользователи успешно активированы"
}
```

**Use Cases:**
- Восстановление пользователей после временной блокировки
- Активация зарегистрированных, но неактивированных аккаунтов
- Массовая обработка заявок на восстановление доступа

---

### 2. POST /user/bulk/deactivate

Массовая деактивация пользователей.

**Ограничения:**
- Максимум 1000 пользователей за один запрос
- Обрабатывает только активных пользователей (`isActive: true`)
- Устанавливает `isActive: false`

**Request:**

```http
POST /online-store/user/bulk/deactivate
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
    "userIds": [10, 11, 12]
}
```

**Response 200 OK:**

```json
{
    "affectedCount": 3,
    "tenantId": 1,
    "message": "Пользователи успешно деактивированы"
}
```

**Use Cases:**
- Временное отключение доступа для группы пользователей
- Деактивация аккаунтов неактивных подписчиков
- Приостановка доступа до подтверждения данных

---

### 3. POST /user/bulk/block

Массовая блокировка пользователей.

**Ограничения:**
- Максимум 1000 пользователей за один запрос
- Обрабатывает только незаблокированных пользователей (`isBlocked: false`)
- Устанавливает `isBlocked: true`

**Request:**

```http
POST /online-store/user/bulk/block
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
    "userIds": [20, 21, 22, 23]
}
```

**Response 200 OK:**

```json
{
    "affectedCount": 4,
    "tenantId": 1,
    "message": "Пользователи успешно заблокированы"
}
```

**Use Cases:**
- Блокировка пользователей за нарушение правил
- Массовая блокировка спамеров
- Предотвращение доступа группы мошеннических аккаунтов

---

### 4. POST /user/bulk/unblock

Массовая разблокировка пользователей.

**Ограничения:**
- Максимум 1000 пользователей за один запрос
- Обрабатывает только заблокированных пользователей (`isBlocked: true`)
- Устанавливает `isBlocked: false`

**Request:**

```http
POST /online-store/user/bulk/unblock
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
    "userIds": [20, 21]
}
```

**Response 200 OK:**

```json
{
    "affectedCount": 2,
    "tenantId": 1,
    "message": "Пользователи успешно разблокированы"
}
```

**Use Cases:**
- Восстановление доступа после успешной апелляции
- Массовая разблокировка после технических работ
- Снятие временных ограничений

---

### 5. POST /user/bulk/delete

Массовое мягкое удаление пользователей (soft delete).

**Ограничения:**
- Максимум 1000 пользователей за один запрос
- Устанавливает `isDeleted: true` (данные сохраняются в БД)
- Блокирует доступ к аккаунту

**Request:**

```http
POST /online-store/user/bulk/delete
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
    "userIds": [30, 31, 32]
}
```

**Response 200 OK:**

```json
{
    "affectedCount": 3,
    "tenantId": 1,
    "message": "Пользователи успешно удалены (soft delete)"
}
```

**Use Cases:**
- Выполнение запросов на удаление данных (GDPR)
- Архивация неактивных аккаунтов
- Удаление тестовых/демо пользователей

**Важно:** Soft delete позволяет восстановить данные при необходимости. Для полного удаления требуется отдельная процедура очистки данных.

---

### 6. POST /user/bulk/verify

Массовая верификация пользователей.

**Ограничения:**
- Максимум 1000 пользователей за один запрос
- Обрабатывает только неверифицированных пользователей (`isVerified: false`)
- Устанавливает `isVerified: true`

**Request:**

```http
POST /online-store/user/bulk/verify
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
    "userIds": [40, 41, 42, 43, 44]
}
```

**Response 200 OK:**

```json
{
    "affectedCount": 5,
    "tenantId": 1,
    "message": "Пользователи успешно верифицированы"
}
```

**Use Cases:**
- Ручная верификация пользователей при проблемах с автоматической верификацией
- Массовая верификация после миграции данных
- Верификация корпоративных аккаунтов по списку

---

## Валидация

### DTO: `BulkActionUserDto`

**Поля:**
- `userIds`: массив числовых ID пользователей

**Правила:**
- `userIds` обязательное поле
- Массив не может быть пустым
- Минимум 1 ID, максимум 1000 ID
- Все ID должны быть положительными целыми числами
- Автоматическая фильтрация дубликатов

**Примеры валидации:**

✅ **Валидный запрос:**
```json
{
    "userIds": [1, 2, 3]
}
```

❌ **Невалидные запросы:**

```json
// Пустой массив
{
    "userIds": []
}
```

```json
// Отрицательные ID
{
    "userIds": [1, -2, 3]
}
```

```json
// Превышен лимит (>1000)
{
    "userIds": [1, 2, ... , 1001]
}
```

---

## Обработка ошибок

### 400 Bad Request

**Причины:**
- Невалидный DTO (пустой массив, неверный формат)
- ID вне диапазона (<=0)
- Превышен лимит (>1000 ID)

**Пример:**

```json
{
    "statusCode": 400,
    "message": [
        "userIds должен содержать минимум 1 элемент",
        "Все ID должны быть положительными числами"
    ],
    "error": "Bad Request"
}
```

### 401 Unauthorized

**Причины:**
- Отсутствует JWT токен
- Токен недействителен или истёк

**Пример:**

```json
{
    "statusCode": 401,
    "message": "Unauthorized",
    "error": "Unauthorized"
}
```

### 403 Forbidden

**Причины:**
- Пользователь не имеет роли ADMIN/SUPER_ADMIN/SUPPORT

**Пример:**

```json
{
    "statusCode": 403,
    "message": "Forbidden resource",
    "error": "Forbidden"
}
```

### 404 Not Found

**Причины:**
- Ни один из указанных пользователей не найден в текущем tenant

**Пример:**

```json
{
    "statusCode": 404,
    "message": "Пользователи не найдены",
    "error": "Not Found"
}
```

### 429 Too Many Requests

**Причины:**
- Превышен rate limit (>10 запросов / 5 минут)

**Пример:**

```json
{
    "statusCode": 429,
    "message": "ThrottlerException: Too Many Requests",
    "error": "Too Many Requests"
}
```

**Заголовок ответа:**
```
Retry-After: 300
```

---

## Производительность

### Timing

**Средние значения:**
- 10 пользователей: ~50-80ms
- 100 пользователей: ~150-250ms
- 500 пользователей: ~600-900ms
- 1000 пользователей: ~1200-1800ms

**Оптимизации:**
- Batch update через `sequelize.update()` с транзакцией
- Индексы на `tenant_id`, `id`, `isActive`, `isBlocked`, `isVerified`
- Логирование времени выполнения (см. `/user/admin/metrics`)

**Monitoring:**
- Все bulk операции логируют `duration` в мс
- Медленные запросы (>1s) логируются как `warn`
- Критичные операции (>3s) логируются как `error`

---

## Tenant Isolation

**Важно:** Все bulk операции строго изолированы по tenant:
- Обрабатываются только пользователи текущего tenant
- `tenantId` автоматически извлекается из контекста JWT
- Cross-tenant операции невозможны (блокируются на уровне БД)

**Пример:**
```
Admin tenant=1 запрашивает: userIds=[1,2,3,999]
- User 1,2,3: tenant=1 ✅ обработаны
- User 999: tenant=2 ❌ игнорируется
affectedCount: 3
```

---

## Логирование

Все bulk операции логируют детальную информацию:

```json
{
    "level": "info",
    "context": "UserRepository",
    "operation": "bulkActivateUsers",
    "userIdsCount": 5,
    "affectedCount": 5,
    "duration": "127ms",
    "tenantId": 1,
    "timestamp": "2025-11-20T15:30:00.000Z"
}
```

---

## Примеры использования

### Сценарий 1: Активация новых пользователей после модерации

```bash
# 1. Получить список неактивных пользователей
GET /user/inactive?page=1&limit=100

# 2. Отфильтровать прошедших модерацию (вручную)
# userIds = [10, 15, 20, 25, 30]

# 3. Массовая активация
POST /user/bulk/activate
{
    "userIds": [10, 15, 20, 25, 30]
}
```

### Сценарий 2: Блокировка спамеров

```bash
# 1. Полнотекстовый поиск по подозрительным именам
GET /user/full-text-search?searchTerm=spam&page=1&limit=50

# 2. Проверить подозрительные аккаунты
# userIds = [100, 101, 102]

# 3. Массовая блокировка
POST /user/bulk/block
{
    "userIds": [100, 101, 102]
}
```

### Сценарий 3: Верификация корпоративных аккаунтов

```bash
# 1. Поиск по домену email (@company.com)
GET /user/full-text-search?searchTerm=@company.com

# 2. Извлечь userIds из списка
# userIds = [200, 201, 202, 203, 204]

# 3. Массовая верификация
POST /user/bulk/verify
{
    "userIds": [200, 201, 202, 203, 204]
}
```

---

## Best Practices

1. **Батчинг**: Разбивайте большие списки на батчи по 100-500 ID для баланса производительности и надёжности

2. **Идемпотентность**: Все операции идемпотентны - повторный запрос безопасен (обрабатываются только подходящие пользователи)

3. **Аудит**: Логируйте bulk операции в отдельный audit log для compliance

4. **Rollback**: Для критичных операций (delete, block) делайте snapshot списка перед выполнением

5. **Мониторинг**: Используйте `/user/admin/metrics` для отслеживания производительности

---

## См. также

- [USER-001-11-OPTIMIZATION.md](../USER-001-11-OPTIMIZATION.md) - Полная документация оптимизации User Module
- [indexes.md](../database/indexes.md) - Индексы для bulk операций
- [TESTING.md](../TESTING.md) - Integration tests для bulk операций

