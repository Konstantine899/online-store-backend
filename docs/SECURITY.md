# Документация по безопасности

## 🛡️ Стратегия защиты от CSRF (Cross-Site Request Forgery)

### Обзор

Проект использует **многоуровневую защиту от CSRF** на основе современных стандартов безопасности:

1. **SameSite Cookies** (основная защита)
2. **CORS Policy** (дополнительная защита)
3. **HttpOnly Cookies** для refresh токенов

### 1. SameSite Cookies

**Как работает:**

```typescript
cookies: {
    httpOnly: true,      // Защита от XSS (нет доступа из JS)
    sameSite: 'lax',     // Development: 'lax', Production: 'none' (с secure)
    secure: production,  // HTTPS only в production
    signed: true         // Подпись cookies для целостности
}
```

**Режимы SameSite:**

- **Lax (development)**: Cookies отправляются только для same-site запросов + top-level navigation
    - ✅ Защищает от большинства CSRF атак
    - ✅ Разрешает переходы по ссылкам
    - ⚠️ Требует same-origin или top-level navigation

- **None (production с HTTPS)**: Cookies отправляются на все запросы
    - ⚠️ Требует `secure: true` (HTTPS only)
    - ✅ Поддержка cross-origin requests (для SPA на другом домене)
    - ✅ В комбинации с CORS достаточно для защиты

**Защита:**

- ✅ **GET запросы**: Защищены полностью
- ✅ **POST/PUT/DELETE**: Требуют same-site context или CORS проверку
- ✅ **Refresh token**: HttpOnly + SameSite = двойная защита

### 2. CORS Policy

**Конфигурация:**

```typescript
CORS: {
    origin: whitelist,        // Только разрешенные origins из ALLOWED_ORIGINS
    credentials: true,        // Разрешить отправку cookies
    methods: 'GET,POST,PUT,PATCH,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
}
```

**Защита:**

- ✅ Только **whitelisted origins** могут делать запросы с credentials
- ✅ Браузер блокирует запросы с неразрешённых доменов
- ✅ Даже если attacker украдёт токен, CORS не позволит использовать его

**Настройка (production):**

```env
# .production.env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECURITY_CORS_ENABLED=true
```

### 3. HttpOnly Cookies для Refresh Token

**Зачем:**

- ✅ **Защита от XSS**: JavaScript не может прочитать refresh token
- ✅ **Автоматическая отправка**: Браузер сам управляет cookies
- ✅ **CSRF защита**: В комбинации с SameSite

**Flow:**

```
1. Login → Server устанавливает HttpOnly cookie с refresh token
2. Client получает access token (short-lived, 15 минут)
3. Access token истекает → Client делает POST /auth/refresh
4. Браузер автоматически отправляет HttpOnly cookie
5. Server проверяет refresh token → выдаёт новый access token
```

### 4. Почему НЕ нужны CSRF токены?

**Традиционный подход (устаревший):**

```javascript
// Старый метод (не используем):
<form>
  <input type="hidden" name="csrf_token" value="random_token">
</form>
```

**Современный подход (используем):**

- ✅ **SameSite cookies** = встроенная CSRF защита в браузере
- ✅ **CORS** = дополнительная проверка origin
- ✅ **JWT в Authorization header** = не подвержен CSRF (нет автоматической отправки)

**Вывод:** SameSite + CORS = достаточно для защиты от CSRF в современных веб-приложениях.

### 5. Best Practices (реализовано)

✅ **Access Token в Authorization header** (не в cookies)

```javascript
// Client-side:
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

- ✅ Не отправляется автоматически (нет CSRF)
- ✅ Короткое время жизни (15 минут)
- ⚠️ Уязвим к XSS (но защищён через Content-Security-Policy)

✅ **Refresh Token в HttpOnly cookie**

```javascript
// Server-side:
res.cookie('refreshToken', token, {
    httpOnly: true, // XSS protection
    sameSite: 'lax', // CSRF protection
    secure: true, // HTTPS only
    signed: true, // Integrity
});
```

✅ **Rate Limiting на auth endpoints**

- Login: 5 попыток / 15 минут
- Refresh: 10 попыток / 5 минут
- Registration: 3 попытки / минута

✅ **Correlation ID для трассировки**

- Каждый запрос имеет `x-request-id`
- Логирование подозрительной активности
- Мониторинг аномальных паттернов

### 6. Тестирование CSRF защиты

**Automated tests (32 теста):**

```bash
npm test -- input-validation.integration.test.ts
```

**Тесты включают:**

- ✅ SameSite cookies validation
- ✅ HttpOnly cookies для refresh token
- ✅ CORS origin validation
- ✅ Credentials requirement
- ✅ Unauthorized access blocking

### 7. Известные ограничения

⚠️ **Для старых браузеров** (без поддержки SameSite):

- Fallback: Полагаемся на CORS
- Рекомендация: Требовать современные браузеры

⚠️ **Subdomains:**

- SameSite 'lax' не защищает от subdomain attacks
- Рекомендация: Не доверять неконтролируемым subdomains

⚠️ **Cross-origin SPAs:**

- Production использует SameSite 'none' + HTTPS
- Требует строгий CORS whitelist

### 8. Рекомендации для production

1. **Включите HTTPS:**

```env
SECURITY_HELMET_ENABLED=true
SECURITY_CORS_ENABLED=true
SECURITY_CSP_ENABLED=true
```

2. **Настройте CORS whitelist:**

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

3. **Мониторинг:**

- Логируйте все CSRF attempts (429 responses)
- Алерты на аномальную активность
- Регулярный аудит CORS политики

4. **Регулярные обновления:**

- Следите за CVE для dependencies
- Обновляйте security headers
- Тестируйте новые векторы атак

### 9. Дополнительные ресурсы

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)

---

## 🔒 Другие механизмы безопасности

### SQL Injection Protection

- ✅ Sequelize ORM (prepared statements)
- ✅ Input validation (class-validator)
- ✅ Тесты: 6 SQL injection scenarios

### XSS Protection

- ✅ Content-Security-Policy headers
- ✅ Input sanitization (@IsSanitizedString)
- ✅ HTML tags blocking
- ✅ Тесты: 10 XSS scenarios

### Path Traversal Protection

- ✅ Filename sanitization (path.basename)
- ✅ MIME type validation
- ✅ Extension whitelist
- ✅ Тесты: 5 path traversal scenarios

### Brute Force Protection

- ✅ Rate limiting (BruteforceGuard)
- ✅ IP-based throttling
- ✅ Retry-After headers (RFC 6585)
- ✅ Тесты: 46 rate limiting scenarios

---

## 🔴 Known Security Issues

### SEC-001: Password Update без Refresh Token Invalidation (CRITICAL)

**Severity:** HIGH (CVSS ~7.5)
**Status:** 🔴 OPEN (Found: 2025-10-10 during TEST-030)
**Priority:** Fix before production deployment

**Problem:**

- `UserService.updatePassword()` НЕ инвалидирует refresh tokens при admin force password update
- Злоумышленник может продолжать использовать сессию после смены пароля админом
- Нарушает ожидания пользователей о безопасности

**Impact:**

- Unauthorized access: Скомпрометированная сессия остаётся активной
- User trust: Пользователь думает что аккаунт защищён, но это не так
- Compliance: Нарушение best practices session management

**Solution Required:**

```typescript
// В UserService.updatePassword():
await this.refreshTokenRepository.deleteAllByUserId(userId);
this.logger.warn({ msg: 'Admin force password update', userId });
```

**Effort:** 2-3 hours (code + tests + review)
**Tracking:** `docs/SEC-001-PASSWORD-UPDATE-TOKEN-INVALIDATION.md`
**Target:** Phase 5 или раньше

---

**Версия документа:** 1.1
**Дата обновления:** 2025-10-10
**Статус:** Production-ready with known issues (documented)
