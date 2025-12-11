# Руководство по настройке SSO (Single Sign-On)

## Обзор

Система поддерживает интеграцию с внешними SSO провайдерами через три протокола:

- **OAuth 2.0** (Azure AD, Google Workspace, Generic OAuth 2.0)
- **SAML 2.0** (любые SAML-совместимые провайдеры)
- **OpenID Connect (OIDC)** (любые OIDC-совместимые провайдеры)

## Архитектура

SSO интеграция реализована через:

- **Динамические стратегии** - конфигурации загружаются из БД (tenant-specific)
- **Just-in-time provisioning** - пользователи создаются автоматически при первом SSO входе
- **Автоматическая синхронизация ролей** - роли синхронизируются через RoleMapping

## Endpoints

### Инициация SSO

```
GET /auth/sso/:providerId
```

Инициирует SSO flow, редиректит на страницу авторизации провайдера.

**Параметры:**

- `providerId` (path) - ID конфигурации SSO провайдера

**Ответы:**

- `302` - Редирект на страницу авторизации провайдера
- `400` - Некорректный providerId или конфигурация неактивна
- `401` - Провайдер не найден или отсутствует tenant ID

### OAuth 2.0 Callback

```
GET /auth/sso/oauth2/callback
```

Обрабатывает callback от OAuth 2.0 провайдера.

**Query параметры:**

- `code` - Authorization code от провайдера
- `state` - State parameter (содержит tenantId и providerId)

**Ответы:**

- `200` - Успешная аутентификация, возвращает `SSOLoginResponse`
- `400` - Некорректные параметры callback
- `401` - Ошибка аутентификации SSO

### SAML Callback

```
POST /auth/sso/saml/callback
```

Обрабатывает callback от SAML 2.0 провайдера.

**Body параметры:**

- `SAMLResponse` - SAML assertion от провайдера
- `RelayState` - RelayState (содержит tenantId и providerId)

**Ответы:**

- `200` - Успешная аутентификация, возвращает `SSOLoginResponse`
- `400` - Некорректные параметры callback
- `401` - Ошибка аутентификации SSO

### OIDC Callback

```
GET /auth/sso/oidc/callback
```

Обрабатывает callback от OpenID Connect провайдера.

**Query параметры:**

- `code` - Authorization code от провайдера
- `state` - State parameter (содержит tenantId и providerId)

**Ответы:**

- `200` - Успешная аутентификация, возвращает `SSOLoginResponse`
- `400` - Некорректные параметры callback
- `401` - Ошибка аутентификации SSO

### SSO Logout

```
POST /auth/sso/:strategyType/logout
```

Выполняет logout из SSO провайдера.

**Параметры:**

- `strategyType` (path) - Тип стратегии: `oauth2`, `saml`, `oidc`

**Body:**

```json
{
    "logoutUrl": "https://provider.com/logout"
}
```

**Ответы:**

- `200` - Успешный logout, возвращает `SSOLogoutResponse`
- `400` - Некорректные параметры

## Настройка провайдеров

### 1. Создание конфигурации через API

Используйте endpoint для создания конфигурации:

```
POST /role/external/configs
```

### 2. OAuth 2.0 провайдеры

#### Azure AD

```json
{
    "providerType": "AZURE_AD",
    "name": "Azure AD SSO",
    "description": "Интеграция с Azure Active Directory",
    "providerConfig": {
        "clientId": "your-azure-client-id",
        "clientSecret": "your-azure-client-secret",
        "authorizationURL": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        "tokenURL": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        "userInfoURL": "https://graph.microsoft.com/v1.0/me",
        "callbackURL": "https://your-app.com/auth/sso/oauth2/callback",
        "scope": ["openid", "profile", "email"]
    },
    "syncEnabled": true,
    "status": "ACTIVE"
}
```

**Настройка в Azure AD:**

1. Создайте App Registration в Azure Portal
2. Настройте Redirect URI: `https://your-app.com/auth/sso/oauth2/callback`
3. Добавьте необходимые API permissions (Microsoft Graph: User.Read)
4. Скопируйте Client ID и Client Secret

#### Google Workspace

```json
{
    "providerType": "GOOGLE_WORKSPACE",
    "name": "Google Workspace SSO",
    "description": "Интеграция с Google Workspace",
    "providerConfig": {
        "clientId": "your-google-client-id",
        "clientSecret": "your-google-client-secret",
        "authorizationURL": "https://accounts.google.com/o/oauth2/v2/auth",
        "tokenURL": "https://oauth2.googleapis.com/token",
        "userInfoURL": "https://www.googleapis.com/oauth2/v2/userinfo",
        "callbackURL": "https://your-app.com/auth/sso/oauth2/callback",
        "scope": ["openid", "profile", "email"]
    },
    "syncEnabled": true,
    "status": "ACTIVE"
}
```

**Настройка в Google Cloud Console:**

1. Создайте OAuth 2.0 Client ID в Google Cloud Console
2. Настройте Authorized redirect URIs: `https://your-app.com/auth/sso/oauth2/callback`
3. Скопируйте Client ID и Client Secret

#### Generic OAuth 2.0

```json
{
    "providerType": "GENERIC_OAUTH2",
    "name": "Okta SSO",
    "description": "Интеграция с Okta",
    "providerConfig": {
        "clientId": "your-okta-client-id",
        "clientSecret": "your-okta-client-secret",
        "authorizationURL": "https://your-okta-domain.okta.com/oauth2/default/v1/authorize",
        "tokenURL": "https://your-okta-domain.okta.com/oauth2/default/v1/token",
        "userInfoURL": "https://your-okta-domain.okta.com/oauth2/default/v1/userinfo",
        "callbackURL": "https://your-app.com/auth/sso/oauth2/callback",
        "scope": ["openid", "profile", "email"]
    },
    "syncEnabled": true,
    "status": "ACTIVE"
}
```

### 3. SAML 2.0 провайдеры

```json
{
    "providerType": "SAML",
    "name": "Corporate SAML SSO",
    "description": "Интеграция с корпоративным SAML провайдером",
    "providerConfig": {
        "entryPoint": "https://sso.company.com/saml/sso",
        "cert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
        "samlIssuer": "https://your-app.com",
        "samlCallbackURL": "https://your-app.com/auth/sso/saml/callback",
        "verifySSL": true
    },
    "syncEnabled": true,
    "status": "ACTIVE"
}
```

**Настройка SAML провайдера:**

1. Получите SAML metadata от провайдера
2. Извлеките:
    - **SSO URL** (entryPoint)
    - **X.509 Certificate** (cert)
    - **Entity ID** (samlIssuer)
3. Настройте в провайдере:
    - **Assertion Consumer Service (ACS) URL**: `https://your-app.com/auth/sso/saml/callback`
    - **Entity ID**: `https://your-app.com`
    - **Name ID Format**: `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`

### 4. OpenID Connect (OIDC) провайдеры

#### С использованием Issuer (рекомендуется)

```json
{
    "providerType": "OIDC",
    "name": "OIDC Provider",
    "description": "Интеграция с OIDC провайдером",
    "providerConfig": {
        "clientId": "your-oidc-client-id",
        "clientSecret": "your-oidc-client-secret",
        "issuer": "https://oidc-provider.com",
        "callbackURL": "https://your-app.com/auth/sso/oidc/callback",
        "scope": ["openid", "profile", "email"]
    },
    "syncEnabled": true,
    "status": "ACTIVE"
}
```

При использовании `issuer`, система автоматически выполняет discovery и получает все необходимые endpoints.

#### С явными URL

```json
{
    "providerType": "OIDC",
    "name": "OIDC Provider (Manual)",
    "description": "Интеграция с OIDC провайдером (ручная настройка)",
    "providerConfig": {
        "clientId": "your-oidc-client-id",
        "clientSecret": "your-oidc-client-secret",
        "authorizationURL": "https://oidc-provider.com/authorize",
        "tokenURL": "https://oidc-provider.com/token",
        "userInfoURL": "https://oidc-provider.com/userinfo",
        "callbackURL": "https://your-app.com/auth/sso/oidc/callback",
        "scope": ["openid", "profile", "email"]
    },
    "syncEnabled": true,
    "status": "ACTIVE"
}
```

## Just-in-time Provisioning

При первом SSO входе система автоматически:

1. Создает пользователя с данными из SSO профиля
2. Синхронизирует роли через RoleMapping
3. Возвращает access token и refresh token

**Маппинг полей:**

- `email` → `User.email`
- `firstName` → `User.firstName`
- `lastName` → `User.lastName`
- `displayName` → `User.displayName` (если доступно)
- `externalId` → сохраняется для связи с SSO провайдером

## Синхронизация ролей

Роли синхронизируются через **RoleMapping**:

1. При SSO входе система получает роли из SSO профиля
2. Применяются правила маппинга (RoleMapping) для преобразования внешних ролей в локальные
3. Пользователю назначаются соответствующие локальные роли

**Пример RoleMapping:**

```json
{
    "externalRole": "admin",
    "localRoleId": 1,
    "priority": 1,
    "conditions": null
}
```

## Безопасность

### Шифрование credentials

Все чувствительные данные (clientSecret, privateKey, bindCredentials) автоматически шифруются в БД с использованием AES-256-GCM.

### State parameter

State parameter используется для:

- Передачи `tenantId` и `providerId` в SSO flow
- Защиты от CSRF атак
- Валидации callback запросов

State генерируется с использованием криптографически стойкого генератора и имеет ограниченное время жизни.

### Rate Limiting

SSO endpoints защищены rate limiting:

- **SSO initiate**: 10 попыток в 5 минут
- **SSO callback**: 20 попыток в 15 минут
- **SSO logout**: 30 попыток в минуту

### Tenant Isolation

Все SSO операции изолированы по tenant:

- Конфигурации провайдеров доступны только для своего tenant
- State parameter содержит tenantId и валидируется при callback
- Пользователи создаются в контексте своего tenant

## Тестирование конфигурации

Используйте endpoint для тестирования конфигурации:

```
POST /role/external/configs/:id/test
```

Этот endpoint проверяет:

- Доступность endpoints провайдера
- Валидность credentials
- Корректность конфигурации

## Мониторинг

### Health Checks

#### Базовый Health Check

Проверка доступности SSO конфигураций:

```
GET /health
```

Health check включает:

- Проверку доступности репозитория конфигураций
- Статус активных SSO провайдеров
- Количество конфигураций по типам

#### Детальный SSO Health Check

Расширенная проверка SSO провайдеров:

```
GET /health/sso?tenantId=1&checkExternal=true
```

**Параметры:**

- `tenantId` (optional) - ID tenant для проверки конфигураций
- `checkExternal` (optional) - Проверять ли доступность внешних SSO серверов (true/false)

**Ответ:**

```json
{
    "status": "ok",
    "info": {
        "sso": {
            "status": "up",
            "message": "SSO configurations available",
            "totalConfigs": 3,
            "activeConfigs": 2,
            "configs": [
                {
                    "id": 1,
                    "name": "Azure AD SSO",
                    "providerType": "AZURE_AD",
                    "status": "ACTIVE"
                }
            ],
            "externalServers": {
                "Azure AD SSO (AZURE_AD)": true,
                "Google Workspace SSO (GOOGLE_WORKSPACE)": true
            }
        }
    }
}
```

### Метрики

Система собирает метрики для всех SSO операций:

- Количество успешных/неуспешных входов
- Время выполнения операций
- Ошибки по типам провайдеров

Метрики доступны через `MetricsCollector` и логируются в структурированном формате.

## Troubleshooting

### Проблема: "State parameter отсутствует в callback"

**Причина:** State parameter не был передан или был потерян при редиректе.

**Решение:**

- Убедитесь, что провайдер поддерживает сохранение state в URL
- Проверьте, что callback URL настроен правильно
- Проверьте логи для деталей ошибки

### Проблема: "Конфигурация провайдера не найдена"

**Причина:** ProviderId не существует или недоступен для текущего tenant.

**Решение:**

- Проверьте, что конфигурация создана и активна
- Убедитесь, что используется правильный tenantId
- Проверьте статус конфигурации через API

### Проблема: "Ошибка обмена кода на токен"

**Причина:** Неверные credentials или неправильный callback URL.

**Решение:**

- Проверьте clientId и clientSecret
- Убедитесь, что callback URL совпадает с настройками в провайдере
- Проверьте, что провайдер поддерживает Authorization Code flow

### Проблема: "SAML assertion невалиден"

**Причина:** Проблемы с сертификатом или подписью SAML assertion.

**Решение:**

- Проверьте, что сертификат провайдера правильный и не истек
- Убедитесь, что SAML assertion подписан правильно
- Проверьте логи для деталей ошибки валидации

## Примеры использования

### Полный flow OAuth 2.0

1. **Инициация SSO:**

    ```bash
    curl -X GET "https://your-app.com/auth/sso/1" \
      -H "X-Tenant-Id: 1"
    ```

    Ответ: Редирект на страницу авторизации провайдера

2. **Пользователь авторизуется на провайдере**

3. **Callback обрабатывается автоматически:**
    ```
    GET /auth/sso/oauth2/callback?code=...&state=...
    ```
    Ответ: `SSOLoginResponse` с access token и refresh token

### Полный flow SAML

1. **Инициация SSO:**

    ```bash
    curl -X GET "https://your-app.com/auth/sso/2" \
      -H "X-Tenant-Id: 1"
    ```

    Ответ: Редирект на SAML SSO endpoint

2. **Пользователь авторизуется на провайдере**

3. **Callback обрабатывается автоматически:**
    ```
    POST /auth/sso/saml/callback
    Body: SAMLResponse=...&RelayState=...
    ```
    Ответ: `SSOLoginResponse` с access token и refresh token

## Дополнительные ресурсы

- [API документация](./API.md) - Полная документация API
- [Архитектура](./ARCHITECTURE.md) - Архитектурные решения
- [Безопасность](./SECURITY.md) - Рекомендации по безопасности

## Поддержка

При возникновении проблем:

1. Проверьте логи приложения
2. Используйте health checks для диагностики
3. Проверьте метрики SSO операций
4. Обратитесь к документации провайдера
