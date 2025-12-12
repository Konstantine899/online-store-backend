# Управление секретами и конфигурацией

## Оглавление
- [Общие принципы](#общие-принципы)
- [Структура env файлов](#структура-env-файлов)
- [Генерация секретов](#генерация-секретов)
- [Ротация секретов](#ротация-секретов)
- [Проверка безопасности](#проверка-безопасности)
- [Troubleshooting](#troubleshooting)

## Общие принципы

### ⛔ НИКОГДА НЕ КОММИТЬТЕ
- `.env`, `.development.env`, `.production.env`, `.staging.env`, `.test.env`
- Любые файлы с реальными паролями, токенами, ключами
- Логи содержащие PII или секреты

### ✅ МОЖНО КОММИТИТЬ
- `*.env.example` - файлы-шаблоны с placeholder значениями
- `docs/env.example` - справочник по переменным окружения

## Структура env файлов

```
project/
├── .env                          # ❌ НЕ коммитить (универсальный)
├── .development.env              # ❌ НЕ коммитить
├── .production.env               # ❌ НЕ коммитить
├── .test.env                     # ❌ НЕ коммитить
├── .development.env.example      # ✅ Шаблон для разработки
├── .production.env.example       # ✅ Шаблон для production
├── .test.env.example             # ✅ Шаблон для тестов
└── docs/env.example              # ✅ Справочник всех переменных
```

## Генерация секретов

### Криптографически стойкие секреты (32+ символов)

```bash
# Для production/staging секретов (64 символа, рекомендуется)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Минимум для production/staging (32 символа)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Для development (можно использовать простые, но уникальные)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### Пример результата:
```
# 64-символьный секрет (production)
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4

# 32-символьный секрет (minimum для prod/staging)
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

## Требования к секретам по окружениям

| Окружение | Минимальная длина | Проверка слабых значений |
|-----------|-------------------|--------------------------|
| **Production** | 32 символа | ✅ Да |
| **Development** | Нет требований | ❌ Нет |
| **Test** | Нет требований | ❌ Нет |

**Примечание**: Если в будущем добавите staging окружение, оно будет использовать те же строгие требования, что и production.

### Слабые значения (запрещены в prod/staging):
- `change-me`, `please_change_me`
- `replace-with-strong-secret`
- `secret`, `password`, `test`

## Ротация секретов

### Параметры ротации

Добавьте в `.production.env` и `.staging.env`:

```bash
# Дата когда секреты должны быть заменены (формат ISO 8601)
JWT_SECRET_ROTATION_DATE=2026-03-01T00:00:00Z

# Версия секрета для отслеживания
JWT_SECRET_VERSION=v1
```

### Процесс ротации JWT секретов

#### 1. Подготовка

```bash
# Генерируем новые секреты
NEW_ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
NEW_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

echo "JWT_ACCESS_SECRET=$NEW_ACCESS_SECRET" >> .env.new
echo "JWT_REFRESH_SECRET=$NEW_REFRESH_SECRET" >> .env.new
```

#### 2. Graceful rotation (zero-downtime)

```bash
# 1. Добавить новые секреты как fallback (TODO: реализовать поддержку множественных секретов)
# 2. Развернуть приложение с обоими секретами
# 3. Подождать истечения старых токенов (JWT_REFRESH_TTL)
# 4. Удалить старые секреты
# 5. Обновить JWT_SECRET_VERSION и JWT_SECRET_ROTATION_DATE
```

#### 3. Обновление переменных

```bash
# Production
JWT_SECRET_VERSION=v2
JWT_SECRET_ROTATION_DATE=2026-09-01T00:00:00Z
```

### Рекомендуемый график ротации

| Окружение | Частота ротации |
|-----------|----------------|
| **Production** | Каждые 90 дней |
| **Development** | По необходимости |
| **Test** | При компрометации |

## Маскирование PII в логах

### Автоматически маскируются:

**Токены и авторизация:**
- `req.headers.authorization`
- `req.headers.cookie`
- `res.headers["set-cookie"]`
- `req.body.password`
- `req.body.token`
- `req.body.refreshToken`
- `req.body.accessToken`

**PII данные:**
- `req.body.email`
- `req.body.phone`
- `req.body.firstName`
- `req.body.lastName`
- `req.body.name`
- `req.body.address`
- `req.query.email`
- `req.query.phone`

### Пример лога с маскированием:

```json
{
  "level": "info",
  "req": {
    "method": "POST",
    "url": "/online-store/auth/login",
    "body": {
      "email": "[REDACTED]",
      "password": "[REDACTED]"
    }
  },
  "correlationId": "uuid-here"
}
```

## Проверка безопасности

### Pre-commit чек-лист

```bash
# 1. Проверить, что env файлы не в git
git status | grep -E '\.env$|\..*\.env$'
# Должно быть пусто!

# 2. Проверить .gitignore
git check-ignore .production.env
# Должен вернуть: .production.env

# 3. Проверить отсутствие секретов в коде
grep -r "JWT_ACCESS_SECRET.*=.*[a-f0-9]{32}" src/
# Должно быть пусто!
```

### Сканирование на утечки секретов

```bash
# Установить gitleaks (опционально)
# https://github.com/gitleaks/gitleaks

# Проверить текущее состояние
gitleaks detect --source . --verbose

# Проверить всю историю
gitleaks detect --source . --log-opts="--all" --verbose
```

## Использование secrets manager (production)

### Рекомендуемые решения:

1. **HashiCorp Vault**
   - Централизованное хранилище секретов
   - Динамическая генерация секретов
   - Аудит доступа

2. **AWS Secrets Manager**
   - Интеграция с AWS infrastructure
   - Автоматическая ротация
   - Шифрование KMS

3. **Azure Key Vault**
   - Для Azure infrastructure
   - Managed identity integration
   - RBAC управление доступом

### Пример интеграции (концептуально):

```typescript
// src/infrastructure/config/secrets/vault.service.ts
async function getSecret(key: string): Promise<string> {
    if (process.env.NODE_ENV === 'production') {
        // Получаем из Vault/AWS Secrets
        return await secretsClient.getSecret(key);
    }
    // В dev используем env файлы
    return process.env[key];
}
```

## Troubleshooting

### Ошибка: "Секрет содержит слабое значение"

**Причина**: В production/staging используется placeholder из примеров.

**Решение**:
```bash
# Генерируем сильный секрет
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Обновляем в .production.env
JWT_ACCESS_SECRET=<сгенерированный_секрет>
```

### Ошибка: "Секрет должен содержать минимум 32 символа"

**Причина**: В production/staging используется короткий секрет.

**Решение**: Используйте секрет длиной минимум 32 символа (рекомендуется 64).

### Предупреждение: "Секреты JWT должны быть ротированы"

**Причина**: `JWT_SECRET_ROTATION_DATE` в прошлом.

**Решение**: Выполните ротацию секретов (см. раздел выше).

### .test.env случайно закоммичен

**Решение**:
```bash
# 1. Удалить из индекса
git rm --cached .test.env

# 2. Закоммитить удаление
git commit -m "chore(security): remove .test.env from git tracking"

# 3. Убедиться что .gitignore актуален
git check-ignore .test.env
# Должен вернуть: .test.env
```

## Чек-лист для нового окружения

- [ ] Скопировать соответствующий `*.env.example` в `.<окружение>.env`
- [ ] Сгенерировать сильные секреты (32+ символов)
- [ ] Проверить что все обязательные переменные заполнены
- [ ] Проверить что файл в `.gitignore`
- [ ] Для prod/staging: установить `JWT_SECRET_ROTATION_DATE`
- [ ] Для prod/staging: установить `JWT_SECRET_VERSION=v1`
- [ ] Запустить приложение и проверить отсутствие ошибок валидации
- [ ] Проверить логи на утечки PII

## Дополнительные ресурсы

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App - Config](https://12factor.net/config)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)

