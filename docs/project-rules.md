# Правила проекта - online-store-backend

## 📚 Полезные ресурсы

- **[База знаний разработки](./development-knowledge-base.md)** - решенные проблемы и best practices для Sequelize + NestJS
- **[Миграции БД](../../MIGRATION_GUIDE.md)** - руководство по работе с миграциями
- **[Оптимизация производительности](../../PERFORMANCE_OPTIMIZATION.md)** - рекомендации по производительности

## 🎯 Основные принципы

### Архитектура
- **Domain Layer**: интерфейсы, модели, DTO, типы (без внешних зависимостей)
- **Infrastructure Layer**: контроллеры, сервисы, репозитории, конфигурация
- **Зависимости**: контроллеры → сервисы → репозитории → БД

### Стиль кода
- **TypeScript strict mode**: без `any`, явные типы
- **Интерфейсы**: префикс `I` (`IUserService`)
- **Файлы**: `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.dto.ts`
- **Отступы**: 4 пробела, не табы

### API и валидация
- **Swagger**: обязательные summary, description, responses
- **DTO**: все входные данные через DTO с `class-validator`
- **Пагинация**: `{ data: T[], meta: MetaData }`
- **Сообщения об ошибках**: на русском языке

### Безопасность
- **JWT**: короткий access токен (15m), долгий refresh токен (30d)
- **Rate Limiting**: `BruteforceGuard` с разными лимитами
- **Валидация**: глобальная через `CustomValidationPipe`

### Тестирование
- **Unit**: сервисы, пайпы, гварды (без БД/файлов/сети)
- **Integration**: ORM/репозитории/контроллеры через реальный HTTP слой
- **Покрытие**: критичные модули ≥ 80%

## 🔧 Частые проблемы и решения

При возникновении проблем с Sequelize, NestJS или тестами - **обязательно проверяйте [базу знаний](./development-knowledge-base.md)** на похожие решения.

### Быстрые ссылки на решения:
- [404 ошибки в тестах](./development-knowledge-base.md#проблема-404-ошибки-в-интеграционных-тестах)
- [Sequelize сериализация](./development-knowledge-base.md#правильная-сериализация-sequelize-моделей)
- [Порядок декораторов](./development-knowledge-base.md#правильный-порядок-декораторов-в-nestjs)
- [Unicode символы в тестах](./development-knowledge-base.md#best-practices-для-интеграционных-тестов)

## 🚀 Команды разработки

```bash
# Тестирование
npm test                                    # все тесты
npm test -- --testPathPattern="user"       # тесты пользователей
npm test -- --runInBand                    # последовательно

# Разработка
npm run build                              # сборка
npm run lint                               # проверка стиля
npm run start:dev                          # разработка

# База данных
npm run migration:run                      # применить миграции
npm run migration:generate -- --name=...   # создать миграцию
npm run seed:run                           # запустить сиды
```

---

**Версия:** 1.0  
**Последнее обновление:** 2025-01-05
