# 📦 Детальные атомарные планы для Production Ready

## 🎯 Навигация

Все планы для доведения **online-store-backend** до production-ready Middle уровня.

---

## 📁 Структура файлов

Каждый модуль имеет **два файла**:

### **`.mdc` файлы** - Концепция + High-Level задачи

Содержат:

- 🎯 Проблема и анализ
- 🔍 Текущее vs целевое состояние
- 📋 **Разбиение на задачи (High-Level)** - 4-6 задач с подзадачами
- 🏗️ Архитектура решения
- 🎓 Middle vs Junior подход
- 📚 Ресурсы и best practices

**Читай СНАЧАЛА** - понять что и зачем!

### **`.plan.mdc` файлы** - Детальные атомарные подзадачи

Содержат:

- ⚙️ Атомарные подзадачи для каждой high-level задачи
- 📝 Точные файлы для изменения
- 🎯 Step-by-step инструкции
- ✅ DoD (Definition of Done)
- 💬 Commit message
- ⏱️ Точная оценка времени

**Используй для выполнения** - конкретные действия!

**Пример:**

- `testing-fixes.mdc` → 4 high-level задачи (PROD-001 до PROD-004)
- `testing-fixes.plan.mdc` → 18 атомарных подзадач (1.1, 1.2, ... 4.4)

Аналогично `.cursor/rules/SaaS/models/` структуре.

---

## 📅 Порядок выполнения

### **Неделя 1-2: Testing Fixes** (критично!)

**Концепция:** [testing-fixes.mdc](./testing-fixes.mdc) - понять проблемы
**План задач:** [testing-fixes.plan.mdc](./testing-fixes.plan.mdc) - что делать

**Задачи:**

- PROD-001: Исправить race conditions (6 атомарных задач)
- PROD-002: Исправить 500 errors (4 задачи)
- PROD-003: Исправить addresses и rbac (4 задачи)
- PROD-004: Test utilities (4 задачи)

**Итого:** 18 атомарных задач
**Время:** 14-20 часов
**Результат:** Все тесты зелёные, 0 failed

---

### **Неделя 3-4: Security Hardening** (production-grade)

**Концепция:** [security-hardening.mdc](./security-hardening.mdc) - угрозы и защита
**План задач:** [security-hardening.plan.mdc](./security-hardening.plan.mdc) - что делать

**Задачи:**

- PROD-010: Env validation с Joi (5 задач)
- PROD-011: HTTP защита (Helmet, CORS, CSP) (4 задачи)
- PROD-012: JWT укрепление + cookies (5 задач)
- PROD-013: Rate limiting (3 задачи)
- PROD-014: Input validation (2 задачи)
- PROD-015: Swagger + Logging (3 задачи)

**Итого:** 22 атомарные задачи
**Время:** 20-24 часа
**Результат:** Production-grade security

---

### **Неделя 5-6: Coverage Improvement** (до 75%+)

**Концепция:** [coverage-improvement.mdc](./coverage-improvement.mdc) - testing strategy
**План задач:** [coverage-improvement.plan.mdc](./coverage-improvement.plan.mdc) - что делать

**Задачи:**

- PROD-020: Auth comprehensive tests (6 задач, +30 тестов)
- PROD-021: Security tests (5 задач, +27 тестов)
- PROD-022: RBAC tests (4 задачи, +20 тестов)
- PROD-023: Coverage config (4 задачи)

**Итого:** 19 атомарных задач
**Время:** 32-40 часов
**Результат:** 75%+ coverage, 85%+ critical modules

---

### **Неделя 7: Performance Optimization**

**Концепция:** [performance-optimization.mdc](./performance-optimization.mdc) - N+1 и indexes
**План задач:** [performance-optimization.plan.mdc](./performance-optimization.plan.mdc) - что делать

**Задачи:**

- PROD-030: Исправить N+1 queries (5 задач)
- PROD-031: Добавить индексы (5 задач)
- PROD-032: Пагинация и лимиты (4 задачи)

**Итого:** 14 атомарных задач
**Время:** 10-14 часов
**Результат:** Оптимизированные queries, правильные индексы

---

### **Неделя 8: Deployment & CI/CD**

**Концепция:** [deployment.mdc](./deployment.mdc) - CI/CD и production
**План задач:** [deployment.plan.mdc](./deployment.plan.mdc) - что делать

**Задачи:**

- PROD-040: CI/CD pipeline (5 задач)
- PROD-041: Railway deployment (7 задач)
- PROD-042: Docker production (4 задачи)

**Итого:** 16 атомарных задач
**Время:** 12-16 часов
**Результат:** Live production deployment

---

### **Неделя 9: Documentation**

**Концепция:** [documentation.mdc](./documentation.mdc) - профессиональная документация
**План задач:** [documentation.plan.mdc](./documentation.plan.mdc) - что делать

**Задачи:**

- PROD-050: Professional README (5 задач)
- PROD-051: ADR documents (5 задач)
- PROD-052: Swagger complete (4 задачи)
- PROD-053: GitHub profile (5 задач)

**Итого:** 19 атомарных задач
**Время:** 12-16 часов
**Результат:** Профессиональная документация

---

## 📊 Общая статистика

### Всего атомарных задач: **108**

### Общее время: **100-130 часов**

- При 14 часов/неделю: **7-9 недель** (1.5-2 месяца)
- При 20 часов/неделю: **5-7 недель** (1-1.5 месяца)

### Результат:

**Production-ready Middle-level проект** готовый для портфолио и устройства на работу

---

## ✅ Как использовать эти планы

### 0. Сначала понять концепцию:

```
testing-fixes.mdc
```

Прочитай `.mdc` файл чтобы понять:

- В чём проблема
- Почему важно исправить
- Какой подход используем
- Best practices

### 1. Затем открой план задач:

```
testing-fixes.plan.mdc
```

### 2. Выбери первую атомарную подзадачу:

```
Атомарная задача 1.1: Добавить cleanup для user_role в afterEach
```

Это **детализация** high-level задачи PROD-001 из `.mdc` файла!

### 3. Скажи "Одобряю 1.1" и начинай

### 4. После завершения подзадачи:

- Коммит с указанным сообщением
- Переход к следующей атомарной подзадаче (1.2, 1.3, ...)

### 5. После завершения всех подзадач одной задачи:

- PROD-001 завершён (все 6 подзадач выполнены)
- Переход к PROD-002 (следующая high-level задача)

### 6. После завершения всех задач модуля:

- Testing Fixes завершён (PROD-001 до PROD-004)
- Переход к Security Hardening

---

## 💡 Принципы работы

### Атомарная задача:

- ≤14 слов в названии
- 10 минут - 2 часа работы
- Один аспект проблемы
- Один коммит
- Measurable DoD

### Полный цикл:

Для новых features:

1. Миграция (если нужна)
2. Модель
3. Сервис
4. DTO
5. Контроллер
6. Тесты
7. Коммит

### Для fixes/refactoring:

1. Анализ проблемы
2. Исправление
3. Проверка/тесты
4. Коммит

---

## 🚀 Мотивация

### После этих 9 недель у тебя будет:

- ✅ Production-ready проект (не учебный!)
- ✅ 75%+ coverage (показывает качество)
- ✅ Security hardened (production-grade)
- ✅ Live deployment (можно показать работодателю)
- ✅ Professional documentation (ADR + Swagger)
- ✅ CI/CD pipeline (DevOps опыт)

**Это strong Middle портфолио!**

**Начинай прямо сейчас:**

1. **Прочитай:** [testing-fixes.mdc](./testing-fixes.mdc) - понять проблему
2. **Открой:** [testing-fixes.plan.mdc](./testing-fixes.plan.mdc) - начать выполнение
3. **Скажи:** "Одобряю 1.1" - начать первую атомарную задачу
