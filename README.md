## Просто делай коммит до обновления проекта

## Запуск проекта

```
npm install - установка необходимых зависимостей
npm run start:dev

```

### Быстрый старт (development)

1. Скопируйте пример окружения и заполните значения:
    ```bash
    cp .development.env.example .development.env
    ```
    2a. Убедитесь, что существует файл `.migrate.env` для `sequelize-cli` (используется `db/config/database.js`).
    Значения DEV\_\* должны соответствовать runtime-настройкам из `.development.env`:
    DEV_MYSQL_HOST, DEV_MYSQL_PORT, DEV_MYSQL_DATABASE, DEV_MYSQL_USER, DEV_MYSQL_PASSWORD, DEV_DIALECT.
2. Установите зависимости:
    ```bash
    npm install
    ```
3. Примените миграции (если требуется):
    ```bash
    npm run db:migrate
    ```
4. Запустите приложение:
    ```bash
    npm run start:dev
    ```

Swagger (dev): http://localhost:5000/online-store/docs
Health: http://localhost:5000/online-store/health

---

<br/>
<br/>

## Скрипты

- `npm run build` - production сборка проекта
- `npm run start` - запуск проекта в `production` режиме
- `npm run start:dev` - запуск проекта в development режиме
- `npm run lint:ts` - Проверка ts файлов линтером
- `npm run lint:ts:fix` - Исправление `ts` файлов линтером
- `npm run prettier` - Форматирование файлов линтером
- `npm run db:migrate` - Создание таблиц в БД с помощь миграции (использует `.migrate.env`)
- `npm run db:migrate:undo` - Удаление последней миграции
- `npm run db:migrate:undo:all` - Удаление всех миграций
- `npm run db:seed:all` - Добавление данных в таблицы
- `npm run db:seed:undo:all` - Удаление всех данных из таблиц

---

<br/>
<br/>

### Swagger

Swagger - доступен по [http://localhost:5000/online-store/docs](http://localhost:5000/online-store/docs)

<br/>
<br/>

## Миграции

- `db/config` - содержит файл конфигурации, который сообщает `sequelize CLI`, как подключаться к базе данных
- `db/config/migrations` - содержит все файлы миграций. В названии файлов миграций содержится `hash`.
  Пример: `20230602150332-create-user.js`. `Hash` - это время создания в `unix` формате.

```
Важно! При создании таблицы, автоматически создается ассоциация(и). таким образом если таблица на которую ссылается ассоциация еще не создана, то возникнет ошибка.
```

- `db/models` - содержит все модели проекта.
- `db/seeders` - файлы которые содержат все исходные данные для добавления в таблицы.
- `.sequelizerc` - Это специальный файл конфигурации в котором прописаны настройки для `sequelize CLI`. Подробнее можно
  ознакомится в документации [.sequelizerc](https://sequelize.org/docs/v6/other-topics/migrations/#the-sequelizerc-file)

Подробнее о миграциях можно почитать в
документации - [Migrations](https://sequelize.org/docs/v6/other-topics/migrations/)

---

<br/>
<br/>

## Слой domain

- `domain/controllers` - `interfaces` описывающие методы контроллеров
- `domain/dto` - `interfaces` описывающие структуры входящих данные `Data Transfer Object`
- `domain/headers` - `interface` описывающий заголовки
- `domain/jwt` - `interfaces` `jwt` `token`.
- `domain/models` - `interfaces` и `sequelize` `models` описывающие структуры данных таблиц в БД.
- `domain/paginate` - `interfaces` необходимые для пагинации.
- `domain/pipes` - `interfaces` необходимые для преобразования или валидации входящих данных.
- `domain/repositories` - `interfaces` описывающие методы в `repositories`
- `domain/request` - `interfaces` описывающие данные входящие в запрос.
- `domain/responses` - `interfaces` описывающие возвращаемые ответы функций и методов.
- `domain/services` - `interfaces` описывающие методы `services`
- `domain/transform` - `interfaces` - описывающие преобразование данных

<br/>
<br/>
<br/>

## Слой infrastructure

- `infrastructure/common` - директория в которой используются функции `decorators`, `guards`, `strategies`. Они
  взаимодействуют со всем приложением.
- `infrastructure/common/decorators` - общие декораторы для всего проекта, например: `roles-auth.decorator.ts`, декоратор
  проверяющий роли пользователя в `endpoints`. Для более подробного ознакомления
  перейдите [decorators.md](src/infrastructure/common/decorators/decorators.md)
- `infrastructure/common/decorators/swagger` - декораторы с помощью которых задокументированы `endpoints`. Для более
  подробного ознакомления использующихся в проекте `swagger` `decorators`
  перейдите [swagger.decorators.md](src/infrastructure/common/decorators/swagger/swagger.decorators.md)
- `infrastructure/common/guards` - защитники, например: `auth.guard.ts` - проверяет авторизацию пользователя,
  `role.guard.ts` - проверяет роль пользователя. Для более подробного ознакомления использующихся в проекте `guards`
  перейдите [guards.md](src/infrastructure/common/guards/guards.md) или
  документацию [guards](https://docs.nestjs.com/websockets/guards#binding-guards)
- `infrastructure/common/strategies` - стратегии использующиеся для аутентификации и авторизации пользователя в
  приложении. Например: `JwtStrategy`, `GoogleStrategy`, `GithubStrategy` и т.д. Для более подробного ознакомления
  использующихся в проекте `strategies`
  перейдите [strategies.md](src/infrastructure/common/strategies/strategies.md) или
  документацию [Passport (authentication)](https://docs.nestjs.com/recipes/passport#implementing-passport-strategies).

<br/>
<br/>

- `infrastructure/config` - в этой директории содержится конфигурация библиотек и фраемворков. Более подробно об
  конфигурациях использующихся в проекте можно
  почитать [jwt.config.md](src/infrastructure/config/jwt/jwt.config.md), [multer.config.md](src/infrastructure/config/multer/multer.config.md), [sequelize.config.md](src/infrastructure/config/sequelize), [swagger.config.md](src/infrastructure/config/swagger/swagger.config.md)
- `infrastructure/controllers` - в этой директории бизнес логика контроллеров. Более подробно можно
  ознакомится [controllers.md](src/infrastructure/controllers/controllers.md)
- `infrastructure/dto` - в этой директории содержится структура входящих данных. Более подробно можно
  ознакомится [dto.md](src/infrastructure/dto/dto.md)
- `infrastructure/exceptions` - в этой директории содержутся исключения с помощью которых выводим частичную или более
  подробную информацию об ошибке. Для более подробного ознакомления о `custom` `exceptions` использующихся в проекте
  ознакомьтесь [exceptions.md](src/infrastructure/exceptions/exceptions.md). Для более подробного ознакомления
  перейдите в документацию [exceptions](https://docs.nestjs.com/exception-filters#throwing-standard-exceptions)
- `infrastructure/paginate` - методы требующиеся для постраничного вывода. Более подробно можно
  ознакомится [paginate.md](src/infrastructure/paginate/paginate.md)
- `infrastructure/pipes` - в этой директории содержаться классы с помощью которых мы можем преобразовывать входящие
  данные в желаемый формат, или осуществлять валидацию входящих данных. Более подробно, об использующихся custom pipes в
  проекте можно ознакомится [pipes](src/infrastructure/pipes/pipes.md). Для более подробной информации можно
  ознакомится с документацией [pipes](https://docs.nestjs.com/pipes).
- `infrastructure/repositories` - в этой директории бизнес логика репозиториев. Более подробно можно
  ознакомится [repositories.md](src/infrastructure/repositories/repositories.md)
- `infrastructure/requests` - запросы. Более подробно можно
  ознакомится [requests.md](src/infrastructure/requests/requests.md)
- `infrastructure/responses` - ответы возвращаемые функциями и методами. Более подробно можно
  ознакомится [responses.md](src/infrastructure/responses/responses.md)
- `infrastructure/services` - в этой директории бизнес логика сервисов. Более подробно можно
  ознакомится [services.md](src/infrastructure/services/services.md)

## API Endpoints

### Продукты (V2 - новый формат пагинации)

Все endpoints для работы с продуктами теперь используют новый формат пагинации `{ data, meta }`:

- `GET /online-store/product/list-v2` - Получение списка продуктов
- `GET /online-store/product/brand/{brandId}/list-v2` - Получение продуктов по бренду
- `GET /online-store/product/category/{categoryId}/list-v2` - Получение продуктов по категории
- `GET /online-store/product/brand/{brandId}/category/{categoryId}/list-v2` - Получение продуктов по бренду и категории

#### Формат ответа V2

```json
{
    "data": [
        {
            "id": 1,
            "name": "iPhone 15",
            "price": 999.99,
            "rating": 4.5,
            "image": "iphone15.jpg",
            "category_id": 1,
            "brand_id": 1
        }
    ],
    "meta": {
        "totalCount": 10,
        "lastPage": 2,
        "currentPage": 1,
        "nextPage": 2,
        "previousPage": null,
        "limit": 5
    }
}
```

#### Параметры запроса

- `search` (required) - Поиск по имени продукта
- `sort` (required) - Сортировка цены (`asc` или `desc`)
- `page` (optional) - Номер страницы (по умолчанию: 1)
- `size` (optional) - Количество элементов на странице (по умолчанию: 5)

#### Важные изменения

- **Исправлен баг с `page=0`**: Теперь параметр `page=0` автоматически корректируется до `page=1`
- **Универсальный формат**: Все endpoints используют единый формат `{ data, meta }`
- **Улучшенная пагинация**: Более детальная информация о страницах в `meta`

## Тестирование

Проект включает **comprehensive test suite** для обеспечения production-ready качества.

### 📊 Test Coverage

![Tests](https://img.shields.io/badge/tests-868%20passed-brightgreen)
![Suites](https://img.shields.io/badge/suites-44-blue)
![Coverage](https://img.shields.io/badge/coverage-73.73%25-green)

**Статистика**: 44 test suites, 868 тестов (unit + integration)

| Metric         | Global    | Critical Modules |
| -------------- | --------- | ---------------- |
| **Lines**      | 73.73% ✅ | 85-100% ✅       |
| **Statements** | 73.73% ✅ | 85-100% ✅       |
| **Functions**  | 62.07% ✅ | 75-90% ✅        |
| **Branches**   | 72.43% ✅ | 65-85% ✅        |

### Coverage по модулям:

- ✅ **Auth Services**: 96-98% (controller + service)
- ✅ **Security Guards**: 95-99% (bruteforce, role)
- ✅ **Exception Filters**: 97.97%
- ✅ **User Services**: 81-92%
- ✅ **Token Services**: 96.75%
- ✅ **Notification Services**: 94.17%

**Coverage Thresholds:** CI автоматически блокирует merge при снижении coverage.
См. подробности: [docs/COVERAGE-THRESHOLDS.md](docs/COVERAGE-THRESHOLDS.md)

⚠️ **Flaky Tests:** ~5% integration тестов могут быть нестабильны из-за shared state.
Автоматический retry включён (`jest.retryTimes(1)`). См: [docs/KNOWN_FLAKY_TESTS.md](docs/KNOWN_FLAKY_TESTS.md)

---

### Требования для тестов

Для интеграционных тестов требуется **MySQL сервер** с тестовой БД:

- **Host**: 127.0.0.1
- **Port**: 3308
- **Database**: `online_store_test`
- **User**: `test_user`
- **Password**: `TestPass123!`

#### Docker MySQL (рекомендуется)

```bash
docker run -d \
  --name mysql-test \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=online_store_test \
  -e MYSQL_USER=test_user \
  -e MYSQL_PASSWORD=TestPass123! \
  -p 3308:3306 \
  mysql:8.0
```

---

### Подготовка тестовой БД (первый запуск)

**Важно!** Перед первым запуском тестов необходимо подготовить тестовую БД:

```bash
# 1. Создать тестовую БД
npm run db:create:test

# 2. Применить все миграции
npm run db:migrate:test

# 3. Добавить seed данные (тестовые пользователи и роли)
npm run db:seed:test
```

**Seed данные включают**:

- Тестовые пользователи: `admin@example.com`, `user@example.com` (пароль: `Password123!`)
- Роли: ADMIN, USER, SUPER_ADMIN, и др.
- Системные данные для тестов

---

### Запуск тестов

```bash
# Все тесты (unit + integration)
npm run test

# С HTML отчётом (автоматически откроется в браузере)
npm run test:html:open

# Только unit тесты (быстрые, без БД)
npm run test:unit

# Только integration тесты (с БД)
npm run test:integration

# С покрытием кода
npm run test:cov
npm run test:cov:open  # + откроет отчёт в браузере

# CI режим (для GitHub Actions)
npm run test:ci

# Отладка (показывает открытые handles)
npm run test:debug
```

---

### Управление тестовой БД

```bash
# Статус миграций
npm run db:migrate:status:test

# Откат последней миграции
npm run db:migrate:undo:test

# Откат всех миграций
npm run db:migrate:undo:all:test

# Удалить seed данные
npm run db:seed:undo:all:test

# Полный reset БД (drop → create → migrate → seed)
npm run db:reset:test

# Удалить тестовую БД
npm run db:drop:test
```

---

### Troubleshooting

#### Тесты падают с ошибкой "Unknown database"

```bash
# Создайте тестовую БД и примените миграции
npm run db:create:test
npm run db:migrate:test
npm run db:seed:test
```

#### Тесты падают с ошибкой "Cannot add or update a child row"

```bash
# Примените seed данные (тестовые пользователи отсутствуют)
npm run db:seed:test
```

#### Connection refused / ECONNREFUSED

```bash
# Проверьте, что MySQL запущен на порту 3308
docker ps | grep mysql-test

# Если контейнер остановлен - запустите
docker start mysql-test
```

#### Слишком много SQL логов в консоли

Убедитесь, что в `.test.env` установлено:

```env
SQL_LOGGING=false
SEQUELIZE_LOGGING=false
```

---

### Структура тестов

```
tests/
├── unit/                    # Unit тесты (моки, без БД)
│   ├── services/
│   ├── pipes/
│   └── guards/
├── integration/             # Integration тесты (реальная БД)
│   ├── auth-flow.integration.test.ts
│   └── rbac.integration.test.ts
├── setup/                   # Вспомогательные утилиты
│   ├── app.ts              # Настройка тестового приложения
│   ├── auth.ts             # Хелперы для авторизации
│   └── test-app.module.ts  # Тестовый модуль
└── jest-setup.ts           # Глобальная настройка Jest

src/infrastructure/controllers/*/tests/
└── *.integration.test.ts    # Integration тесты рядом с контроллерами
```

---

### Конфигурация тестов

- **Jest config**: `jest.config.js`
- **Test environment**: `.test.env`
- **Coverage thresholds**:
    - Global: 70% branches, 60% functions, 70% lines/statements
    - Critical modules: 65-90% (auth, guards, exceptions, user, token)
    - Controllers: 10-45% (conservative baseline, gradual improvement)
- **Timeout**: 5s (unit), 30s (integration)
- **Execution**: Sequential локально, parallel в CI

---

### 🔒 Security Testing

Comprehensive security test coverage для production-ready SaaS:

**Test Coverage:**

- ✅ **Password Reset Flow** (12 tests) - forgot password, token validation, expiry
- ✅ **Brute Force Protection** (46 tests) - rate limiting, IP extraction, Retry-After headers
- ✅ **Input Validation** (32 tests) - SQL injection, XSS, Path Traversal, CSRF
- ✅ **RBAC Authorization** (67 tests) - role permissions, 401/403 distinction, multi-role
- ✅ **Race Conditions** (critical fixes) - inventory overselling, payment double-charge
- ✅ **Error Handling** (30 tests) - exception filters, graceful degradation
- ✅ **Token Invalidation** (8 tests) - session management, security audit

**Security Documentation:**

- [docs/SECURITY.md](docs/SECURITY.md) - Security best practices and known issues
- [docs/TESTING.md](docs/TESTING.md) - Testing strategy and guidelines

Подробнее о тестах см. документацию в `tests/` директории.

---

### CI/CD (GitHub Actions)

CI pipeline **полностью настроен** и автоматически:

✅ **Поднимает MySQL** в Docker контейнере
✅ **Применяет миграции** перед тестами
✅ **Добавляет seed данные** для интеграционных тестов
✅ **Оптимизирует MySQL** для быстрых тестов (tmpfs, отключение sync_binlog)
✅ **Запускает параллельно**: lint, build, unit tests, integration tests (с coverage)
✅ **Проверяет миграции**: up → down → up (rollback работает)
✅ **Собирает coverage** отчёты (только integration, threshold: 50%)

**Важно**: В CI используются другие credentials (из `.github/workflows/ci.yml`):

- Database: `online_store_test`
- User: `test_user`
- Password: `test_password` ⚠️ (не `TestPass123!`)
- Port: `3306` (не `3308`)

Все тесты проходят автоматически при push/PR в ветки `main` и `dev`.
