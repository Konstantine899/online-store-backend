# База знаний разработки - online-store-backend

## 📋 Быстрая навигация

### 🐛 Частые проблемы
- [404 ошибки в тестах](#проблема-404-ошибки-в-интеграционных-тестах)
- [Sequelize returning не работает](#проблема-sequelize-returning-true-не-работает)
- [Unicode символы в тестах](#best-practices-для-интеграционных-тестов)

### ✅ Best Practices
- [Sequelize сериализация](#правильная-сериализация-sequelize-моделей)
- [Порядок декораторов](#правильный-порядок-декораторов-в-nestjs)
- [Тестирование](#best-practices-для-интеграционных-тестов)

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
