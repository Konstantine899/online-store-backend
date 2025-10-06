# База знаний разработки - online-store-backend

## 📋 Быстрая навигация

### 🐛 Частые проблемы
- [404 ошибки в тестах](#проблема-404-ошибки-в-интеграционных-тестах)
- [Sequelize returning не работает](#проблема-sequelize-returning-true-не-работает)
- [Unicode символы в тестах](#best-practices-для-интеграционных-тестов)
- [Rate limiting в тестах](#проблема-rate-limiting-в-интеграционных-тестах)

### ✅ Best Practices
- [Sequelize сериализация](#правильная-сериализация-sequelize-моделей)
- [Порядок декораторов](#правильный-порядок-декораторов-в-nestjs)
- [Тестирование](#best-practices-для-интеграционных-тестов)
- [Rate limiting и безопасность](#rate-limiting-и-bruteforceguard)

### 🔧 Полезные команды
- [Тестирование](#полезные-команды)
- [Отладка](#полезные-команды)
- [Производительность](#полезные-команды)

---

## 🎯 Sequelize + NestJS Best Practices

### ✅ Правильная сериализация Sequelize моделей

**В контроллерах:**
```typescript
// ✅ Правильно - для сериализации в контроллерах
return this.createResponse(user.get({ plain: true }));

// ❌ Проблематично - может вызывать ошибки с unicode
return this.createResponse(user.toJSON());
```

**При обновлениях:**
```typescript
// ✅ Правильно - для обновления без returning
const [affectedRows] = await this.userModel.update(updates, {
    where: { id: userId },
});
return affectedRows > 0 ? this.userModel.findByPk(userId) : null;

// ❌ Проблематично - returning: true не работает с MySQL
const [affectedRows] = await this.userModel.update(updates, {
    where: { id: userId },
    returning: true  // Не работает с MySQL!
});
```

### ✅ Правильный порядок декораторов в NestJS

```typescript
@Roles(...USER_ROLES)           // 1. Роли
@UserGuards()                   // 2. Гварды
@UpdateUserSwaggerDecorator()   // 3. Swagger документация
@Patch('profile/preferences')   // 4. HTTP метод
@HttpCode(HttpStatus.OK)        // 5. Статус код
async updatePreferences() {
    // логика метода
}
```

## 🐛 Решенные проблемы

### Проблема: 404 ошибки в интеграционных тестах

**Симптомы:**
- Тесты падают с `expected 200 "OK", got 404 "Not Found"`
- В логах видно, что метод контроллера вызывается и выполняется успешно
- SQL запросы выполняются корректно

**Причины:**
1. Неправильная сериализация Sequelize моделей
2. Unicode символы (эмодзи) в тестовых данных
3. Неправильный порядок декораторов

**Решения:**
1. Использовать `user.get({ plain: true })` вместо `user.toJSON()`
2. Избегать unicode символов в тестовых данных
3. Проверить порядок декораторов согласно конвенциям проекта

### Проблема: Sequelize returning: true не работает

**Симптомы:**
- `returning: true` не возвращает обновленную запись
- Приходится делать дополнительный `findByPk()` запрос

**Решение:**
- Убрать `returning: true` и использовать `findByPk()` после `update()`

### Проблема: Rate limiting в интеграционных тестах

**Симптомы:**
- Тесты падают с `Unexpected 429 on first attempt`
- BruteforceGuard вызывается несколько раз для одного запроса
- Глобальный rate limiter блокирует тесты

**Причины:**
1. BruteforceGuard наследуется от ThrottlerGuard и может вызываться несколько раз
2. Глобальный rate limiter применяется до инициализации приложения
3. Переменные окружения устанавливаются после создания приложения

**Решения:**
1. **Защита от повторных вызовов:**
```typescript
// В BruteforceGuard
if ((request as any).__bruteforceProcessed) {
    return true;
}
(request as any).__bruteforceProcessed = true;
```

2. **Установка переменных ДО создания приложения:**
```typescript
beforeAll(async () => {
    // Устанавливаем переменные ДО создания приложения
    process.env.RATE_LIMIT_ENABLED = 'true';
    process.env.RATE_LIMIT_LOGIN_ATTEMPTS = '2';
    // ... другие переменные
    
    app = await setupTestAppWithRateLimit();
});
```

3. **Сброс счётчиков между тестами:**
```typescript
beforeEach(async () => {
    BruteforceGuard.resetCounters();
});
```

4. **Использование setupTestAppWithRateLimit вместо setupTestApp:**
```typescript
// ✅ Правильно - не мокирует BruteforceGuard
app = await setupTestAppWithRateLimit();

// ❌ Проблематично - мокирует BruteforceGuard
app = await setupTestApp();
```

## 🧪 Тестирование

### ✅ Best practices для интеграционных тестов

**Избегайте unicode символов в тестовых данных:**
```typescript
// ❌ Проблематично
notificationPreferences: {
    'unicode': 'тест 🚀',  // Эмодзи вызывают проблемы
    'special-chars': 'test@#$%^&*()',
}

// ✅ Правильно
notificationPreferences: {
    'special-chars': 'test@#$%^&*()',
    'spaces and symbols': 'value with spaces'
}
```

**Проверка стабильности тестов:**
- Запускайте тесты несколько раз для проверки стабильности
- Используйте `--runInBand` для последовательного выполнения
- Проверяйте изоляцию тестов

## 🔧 Архитектурные решения

### Структура контроллеров
- Тонкие контроллеры - только транспорт/валидация/декораторы
- Вся бизнес-логика в сервисах
- Репозитории только для доступа к БД

### Обработка ошибок
- Используйте глобальные фильтры для Sequelize ошибок
- Сообщения об ошибках на русском языке
- Логирование с correlation ID

## 🛡️ Rate Limiting и BruteforceGuard

### ✅ Правильная реализация BruteforceGuard

**Структура guard:**
```typescript
@Injectable()
export class BruteforceGuard extends ThrottlerGuard {
    private static counters = new Map<string, { count: number; resetAt: number }>();
    
    // Защита от повторных вызовов
    protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
        const request = requestProps.context.switchToHttp().getRequest<Request>();
        
        if ((request as any).__bruteforceProcessed) {
            return true;
        }
        (request as any).__bruteforceProcessed = true;
        
        // Логика для разных endpoints
        if (request.url.includes('/auth/login')) {
            return this.handleLoginAttempt(requestProps);
        }
        // ... другие endpoints
    }
}
```

**Профили rate limiting:**
- **Login**: 5 попыток за 15 минут
- **Refresh**: 10 попыток за 5 минут  
- **Registration**: 3 попытки за минуту

**Логирование без PII:**
```typescript
this.logger.warn(`${profile} rate limit exceeded`, {
    route: request.url,
    method: request.method,
    correlationId: request.headers['x-request-id'],
    // НЕ логируем IP, email, пароли
});
```

### ✅ Глобальный rate limiter

**Реализация в main.ts:**
```typescript
if (cfg.RATE_LIMIT_ENABLED) {
    const perIpCounters = new Map<string, { s: number; sTs: number; m: number; mTs: number }>();
    
    app.use((req: Request, res: Response, next: NextFunction) => {
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
        // Логика счётчиков 3 rps / 100 rpm
    });
}
```

**Настройки по умолчанию:**
- 3 запроса в секунду
- 100 запросов в минуту
- Отключается через `RATE_LIMIT_ENABLED=false`

### ✅ Тестирование rate limiting

**Правильная настройка тестов:**
```typescript
beforeAll(async () => {
    // Устанавливаем переменные ДО создания приложения
    process.env.NODE_ENV = 'test';
    process.env.RATE_LIMIT_ENABLED = 'true';
    process.env.RATE_LIMIT_LOGIN_ATTEMPTS = '2';
    
    app = await setupTestAppWithRateLimit(); // НЕ setupTestApp!
});

beforeEach(async () => {
    BruteforceGuard.resetCounters(); // Сброс между тестами
});
```

**Проверка сценариев:**
```typescript
it('should return 429 after exceeding attempts', async () => {
    // Первая попытка - должна пройти (400/401)
    const res1 = await request(server).post('/auth/login').send(data);
    expect(res1.status).not.toBe(429);
    
    // Вторая попытка - должна пройти (400/401)
    const res2 = await request(server).post('/auth/login').send(data);
    expect(res2.status).not.toBe(429);
    
    // Третья попытка - должна быть заблокирована (429)
    const res3 = await request(server).post('/auth/login').send(data);
    expect(res3.status).toBe(429);
});
```

## 📝 Полезные команды

### Тестирование
```bash
# Запуск конкретного теста
npm test -- --testPathPattern="user-preferences.integration.test.ts"

# Запуск теста с именем
npm test -- --testNamePattern="special characters in preferences"

# Последовательное выполнение
npm test -- --runInBand
```

### Отладка
```bash
# Сборка проекта
npm run build

# Проверка линтера
npm run lint

# Проверка типов
npm run type-check
```

## 🚀 Производительность

### Sequelize оптимизация
- Используйте `attributes` для выбора нужных полей
- Избегайте N+1 запросов с помощью `include`
- Используйте пагинацию для списков

### NestJS оптимизация
- Параллельные независимые вызовы через `Promise.all`
- Кэширование для справочников
- Ограничение payload размеров

---

## 🤖 Автоматические проверки

### Когда проверять базу знаний:

1. **При 404 ошибках в тестах** → [Решение](#проблема-404-ошибки-в-интеграционных-тестах)
2. **При проблемах с Sequelize** → [Сериализация](#правильная-сериализация-sequelize-моделей)
3. **При ошибках декораторов** → [Порядок декораторов](#правильный-порядок-декораторов-в-nestjs)
4. **При проблемах с тестами** → [Тестирование](#best-practices-для-интеграционных-тестов)
5. **При работе с unicode** → [Unicode символы](#best-practices-для-интеграционных-тестов)
6. **При проблемах с rate limiting** → [Rate limiting](#проблема-rate-limiting-в-интеграционных-тестах)

### Быстрые команды для проверки:

```bash
# Проверить конкретный тест
npm test -- --testNamePattern="special characters"

# Проверить все тесты пользователей
npm test -- --testPathPattern="user-preferences"

# Последовательное выполнение для стабильности
npm test -- --runInBand

# Coverage отчеты
npm run test:cov                    # все тесты с покрытием
npm run test:cov:open               # открыть HTML отчет в браузере
npm run test:cov:unit               # только unit тесты с покрытием
npm run test:cov:integration        # только integration тесты с покрытием
```

---

**Последнее обновление:** 2025-01-05  
**Версия проекта:** online-store-backend v1.0  
**Связанные файлы:** [Правила проекта](./project-rules.md)
