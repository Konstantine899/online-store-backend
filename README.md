# 🛒 Online Store Backend

**Production-ready REST API для интернет-магазина** построенный на NestJS с Clean Architecture, comprehensive testing (878 tests, 73.73% coverage), и enterprise-grade security.

---

## 📊 Badges

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-878%20passed-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-73.73%25-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![NestJS](https://img.shields.io/badge/NestJS-10.0-red)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📑 Table of Contents

- [About](#about)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Testing](#тестирование)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Security](#security)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 About

**Online Store Backend** — это полнофункциональный REST API для e-commerce платформы, демонстрирующий **Middle-level backend development skills**:

- 🏗️ **Clean Architecture** с разделением Domain/Infrastructure слоёв
- 🔒 **Enterprise Security**: JWT auth, RBAC, rate limiting, input sanitization
- 🧪 **Comprehensive Testing**: 878 tests (73.73% coverage, 85-100% critical modules)
- 📚 **100% Swagger Documentation** для всех endpoints
- 🚀 **Production-ready**: CI/CD, migrations, health checks, monitoring

**Проект создан как портфолио для демонстрации:**

- Clean Code & SOLID principles
- Security best practices
- Test-Driven Development
- Database design & optimization
- DevOps & CI/CD practices

---

## ✨ Key Features

### 🔐 Authentication & Authorization

- ✅ JWT-based authentication (access + refresh tokens)
- ✅ Refresh token rotation (single-use, automatic invalidation)
- ✅ Role-Based Access Control (RBAC): ADMIN, USER, CUSTOMER
- ✅ Password reset flow с email verification
- ✅ Brute force protection (rate limiting)
- ✅ Secure cookies (HttpOnly, SameSite)

### 🛍️ E-Commerce Core

- ✅ Product management (CRUD, categories, brands, ratings)
- ✅ Shopping cart (guest & authenticated users)
- ✅ Order management (create, track, admin panel)
- ✅ User profiles (addresses, preferences, notifications)
- ✅ Search & filtering (pagination, sorting)

### 🛡️ Security

- ✅ Input validation & sanitization (XSS, SQL injection prevention)
- ✅ Rate limiting (login, registration, refresh)
- ✅ CORS & Helmet configuration
- ✅ Password strength validation
- ✅ SQL injection, Path Traversal, CSRF protection (203 security tests)

### 🧪 Testing & Quality

- ✅ **878 tests**: 868 unit/integration + 10 E2E
- ✅ **73.73% global coverage**, 85-100% critical modules
- ✅ **Security testing**: Password reset, Brute force, Input validation, RBAC, Race conditions
- ✅ **E2E tests**: Critical user journeys (Registration → Shopping → Checkout)
- ✅ **CI/CD**: GitHub Actions с автоматическими проверками

### 📊 Monitoring & Observability

- ✅ Health checks (`/health`)
- ✅ Correlation ID для request tracing
- ✅ Structured logging (pino)
- ✅ PII masking в логах
- ✅ Login history tracking

---

## 🏗️ Architecture

Проект использует **Clean Architecture** с разделением на слои:

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, Guards, Pipes, Filters)  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│          Application Layer              │
│        (Services, Use Cases)            │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│            Domain Layer                 │
│   (Entities, Interfaces, DTO, Models)   │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Infrastructure Layer            │
│     (Database, Repositories, Config)    │
└─────────────────────────────────────────┘
```

### Принципы:

- ✅ **Dependency Inversion**: Domain layer не зависит от Infrastructure
- ✅ **Single Responsibility**: каждый модуль имеет одну ответственность
- ✅ **Interface Segregation**: интерфейсы для всех контрактов
- ✅ **Separation of Concerns**: Controllers → Services → Repositories

---

## 🛠️ Tech Stack

### Core

- **Runtime**: Node.js 18+
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.1 (strict mode)
- **Package Manager**: npm

### Database

- **RDBMS**: MySQL 8.0
- **ORM**: Sequelize 6.x (TypeScript support)
- **Migrations**: sequelize-cli
- **Connection Pooling**: Configured

### Authentication & Security

- **Auth**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: class-validator, class-transformer
- **Security Headers**: Helmet
- **CORS**: Configured
- **Rate Limiting**: @nestjs/throttler
- **Cookie Parser**: cookie-parser (signed cookies)

### Testing

- **Framework**: Jest 29.x
- **Coverage**: 73.73% global, 85-100% critical modules
- **E2E**: Supertest
- **Mocking**: jest.mock
- **Test DB**: MySQL test instance (Docker)

### Documentation

- **API Docs**: Swagger/OpenAPI 3.0
- **Architecture**: ADR (Architecture Decision Records)
- **Code Docs**: TSDoc comments

### DevOps & CI/CD

- **CI/CD**: GitHub Actions
- **Containerization**: Docker (planned)
- **Deployment**: Railway (planned)
- **Environment**: dotenv

### Code Quality

- **Linter**: ESLint (TypeScript rules)
- **Formatter**: Prettier
- **Git Hooks**: Husky (planned)
- **Commit Convention**: Conventional Commits

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 8.0+ или Docker
- **npm** 9+

### Installation

#### Option 1: Docker (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/Konstantine899/online-store-backend.git
cd online-store-backend

# 2. Start MySQL с Docker
docker run -d \
  --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=online_store_dev \
  -e MYSQL_USER=dev_user \
  -e MYSQL_PASSWORD=DevPass123! \
  -p 3307:3306 \
  mysql:8.0

# 3. Copy environment файлы
cp .development.env.example .development.env
cp .migrate.env.example .migrate.env

# 4. Install dependencies
npm install

# 5. Build DB models
npm run db:build

# 6. Run migrations
npm run db:migrate

# 7. Seed initial data
npm run db:seed:all

# 8. Start development server
npm run start:dev
```

#### Option 2: Manual MySQL Setup

1. Install MySQL 8.0+ locally
2. Create database: `online_store_dev`
3. Follow steps 3-8 from Docker setup

### Verify Installation

- **API**: http://localhost:5000/online-store/health
- **Swagger**: http://localhost:5000/online-store/docs

Expected response:

```json
{
    "status": "ok",
    "info": {
        "database": { "status": "up" }
    }
}
```

---

## 🧪 Тестирование

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

✅ **Auth Services**: 96-98% (controller + service)
✅ **Security Guards**: 95-99% (bruteforce, role)
✅ **Exception Filters**: 97.97%
✅ **User Services**: 81-92%
✅ **Token Services**: 96.75%
✅ **Notification Services**: 94.17%

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

# E2E тесты (critical user journeys)
npm run test:e2e

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
├── e2e/                     # E2E тесты (critical user journeys)
│   ├── user-journey.e2e.test.ts
│   └── admin-journey.e2e.test.ts
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
- **Timeout**: 5s (unit), 30s (integration), 60s (E2E)
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
✅ **Проверяет coverage thresholds** (блокирует merge при падении)

**Важно**: В CI используются другие credentials (из `.github/workflows/ci.yml`):

- Database: `online_store_test`
- User: `test_user`
- Password: `test_password` ⚠️ (не `TestPass123!`)
- Port: `3306` (не `3308`)

Все тесты проходят автоматически при push/PR в ветки `main` и `dev`.

---

## 📚 API Documentation

### Swagger UI

Полная интерактивная документация доступна по адресу:

**Development**: http://localhost:5000/online-store/docs

### Основные endpoints

#### Authentication

- `POST /auth/registration` - Регистрация нового пользователя
- `POST /auth/login` - Вход в систему
- `GET /auth/check` - Проверка авторизации
- `POST /auth/refresh` - Обновление access токена
- `POST /auth/logout` - Выход из системы

#### Products

- `GET /product/list-v2` - Получение списка продуктов (с пагинацией)
- `GET /product/one/:id` - Получение продукта по ID
- `GET /product/category/:categoryId/list-v2` - Фильтр по категории
- `GET /product/brand/:brandId/list-v2` - Фильтр по бренду
- `POST /product/create` - Создание продукта (ADMIN)
- `PUT /product/update/:id` - Обновление продукта (ADMIN)
- `DELETE /product/delete/:id` - Удаление продукта (ADMIN)

#### Orders

- `POST /order/user/create-order` - Создание заказа (USER, CUSTOMER)
- `GET /order/user/get-all-order` - Список заказов пользователя
- `GET /order/user/get-order/:orderId` - Детали заказа
- `GET /order/admin/get-all-order` - Все заказы магазина (ADMIN)

#### Cart

- `GET /cart/get-cart` - Просмотр корзины
- `PUT /cart/product/:productId/append/:quantity` - Добавить в корзину
- `PUT /cart/product/:productId/increment/:quantity` - Увеличить количество
- `PUT /cart/product/:productId/decrement/:quantity` - Уменьшить количество
- `DELETE /cart/product/:productId/delete` - Удалить из корзины
- `DELETE /cart/clear` - Очистить корзину

#### Users

- `GET /user/profile` - Профиль пользователя
- `PATCH /user/profile` - Обновление профиля
- `PATCH /user/profile/password` - Смена пароля
- `POST /user/verify/email/request` - Запросить код верификации email
- `POST /user/verify/email/confirm` - Подтвердить email

### Формат ответа (Pagination)

Все endpoints с пагинацией используют единый формат:

```json
{
    "data": [...],
    "meta": {
        "totalCount": 100,
        "lastPage": 20,
        "currentPage": 1,
        "nextPage": 2,
        "previousPage": null,
        "limit": 5
    }
}
```

---

## 🗄️ Database

### Migrations

Проект использует **Sequelize migrations** для версионирования схемы БД:

```bash
# Применить миграции
npm run db:migrate

# Откатить последнюю миграцию
npm run db:migrate:undo

# Статус миграций
npm run db:migrate:status
```

### Database Schema

**15+ таблиц:**

- `user` - Пользователи (с расширенными полями: phone, flags, preferences)
- `role` - Роли (ADMIN, USER, CUSTOMER, etc.)
- `user_role` - Связь пользователь-роль (many-to-many)
- `product` - Продукты
- `category` - Категории
- `brand` - Бренды
- `cart` - Корзины
- `order` - Заказы
- `rating` - Рейтинги
- `user_address` - Адреса доставки
- `refresh_token` - Refresh токены
- `login_history` - История входов
- `user_verification_code` - Коды верификации
- `password_reset_token` - Токены сброса пароля
- `notification` - Уведомления

### Seeders

Начальные данные для development:

```bash
# Применить все seeds
npm run db:seed:all

# Откатить seeds
npm run db:seed:undo:all
```

**Seed data:**

- Roles (ADMIN, USER, CUSTOMER, VIP_CUSTOMER, etc.)
- Test users (admin@example.com, user@example.com)
- Categories (Электроника, Одежда)
- Brands (Apple, Nike)
- Products (5 test products)

---

## 🔒 Security

### Authentication

- **JWT Strategy**: Access tokens (15m) + Refresh tokens (30d)
- **Token Rotation**: Single-use refresh tokens с автоматической инвалидацией
- **Password Security**: bcrypt hashing, strength validation
- **Session Management**: Refresh token table, login history tracking

### Authorization

- **RBAC**: Role-Based Access Control
- **Roles**: ADMIN, USER, CUSTOMER, VIP_CUSTOMER, WHOLESALE, AFFILIATE, GUEST
- **Guards**: AuthGuard (JWT validation), RoleGuard (permission checks)
- **401 vs 403**: Proper distinction (Unauthorized vs Forbidden)

### Input Validation

- **DTO Validation**: class-validator для всех входных данных
- **Sanitization**: @IsSanitizedString для защиты от XSS
- **Custom Validators**: @IsValidPhone, @IsValidName, @IsPasswordStrong
- **SQL Injection**: Parameterized queries, Sequelize ORM
- **Path Traversal**: File path validation

### Rate Limiting

- **Login**: 5 attempts / 15 minutes
- **Registration**: 3 attempts / minute
- **Refresh**: 10 attempts / 5 minutes
- **Global**: 3 req/s, 20 req/10s, 100 req/min
- **Headers**: Retry-After (RFC 6585)

### Security Headers

- **Helmet**: Cross-Origin policies, XSS protection
- **CORS**: Whitelist allowed origins
- **Cookies**: HttpOnly, SameSite, Secure (production)

---

## 📁 Project Structure

```
online-store-backend/
├── src/
│   ├── domain/                    # Domain Layer (бизнес-логика)
│   │   ├── controllers/           # Интерфейсы контроллеров
│   │   ├── dto/                   # DTO интерфейсы
│   │   ├── models/                # Sequelize модели
│   │   ├── responses/             # Response интерфейсы
│   │   └── services/              # Service интерфейсы
│   ├── infrastructure/            # Infrastructure Layer (реализация)
│   │   ├── common/                # Guards, Pipes, Decorators, Validators
│   │   ├── config/                # Конфигурация (JWT, Sequelize, Swagger)
│   │   ├── controllers/           # HTTP controllers
│   │   ├── dto/                   # DTO классы
│   │   ├── exceptions/            # Exception filters
│   │   ├── repositories/          # Data access layer
│   │   ├── responses/             # Response классы
│   │   └── services/              # Бизнес-логика
│   ├── app.module.ts              # Главный модуль
│   └── main.ts                    # Entry point
├── db/
│   ├── migrations/                # Database migrations
│   ├── seeders/                   # Seed data
│   └── models/                    # DB model definitions
├── tests/
│   ├── unit/                      # Unit тесты
│   ├── integration/               # Integration тесты
│   ├── e2e/                       # E2E тесты
│   ├── setup/                     # Test utilities
│   └── utils/                     # Test helpers
├── docs/                          # Documentation
│   ├── SECURITY.md
│   ├── TESTING.md
│   ├── COVERAGE-THRESHOLDS.md
│   └── KNOWN_FLAKY_TESTS.md
├── .cursor/rules/                 # AI assistant rules
├── jest.config.js                 # Jest configuration
├── jest.e2e.config.js             # E2E test configuration
└── README.md                      # This file
```

---

## 🎨 Domain Layer (Clean Architecture)

### domain/controllers

`interfaces` описывающие методы контроллеров

### domain/dto

`interfaces` описывающие структуры входящих данных `Data Transfer Object`

### domain/models

`interfaces` и `sequelize` `models` описывающие структуры данных таблиц в БД

### domain/repositories

`interfaces` описывающие методы в `repositories`

### domain/services

`interfaces` описывающие методы `services`

### domain/responses

`interfaces` описывающие возвращаемые ответы функций и методов

---

## 🏭 Infrastructure Layer

### infrastructure/common

Общие компоненты для всего приложения:

- **decorators** - Кастомные декораторы (@Roles, Swagger decorators)
  См: [decorators.md](src/infrastructure/common/decorators/decorators.md)
- **guards** - Guards для auth & authorization (AuthGuard, RoleGuard, BruteforceGuard)
  См: [guards.md](src/infrastructure/common/guards/guards.md)
- **strategies** - Passport strategies (JwtStrategy)
  См: [strategies.md](src/infrastructure/common/strategies/strategies.md)
- **validators** - Кастомные валидаторы (@IsSanitizedString, @IsValidPhone)

### infrastructure/config

Конфигурация библиотек и фреймворков:

- [jwt.config.md](src/infrastructure/config/jwt/jwt.config.md)
- [multer.config.md](src/infrastructure/config/multer/multer.config.md)
- [sequelize.config.md](src/infrastructure/config/sequelize)
- [swagger.config.md](src/infrastructure/config/swagger/swagger.config.md)

### infrastructure/controllers

Бизнес логика контроллеров. См: [controllers.md](src/infrastructure/controllers/controllers.md)

### infrastructure/services

Бизнес логика сервисов. См: [services.md](src/infrastructure/services/services.md)

### infrastructure/repositories

Data access layer. См: [repositories.md](src/infrastructure/repositories/repositories.md)

---

## 📜 Available Scripts

### Development

```bash
npm run start:dev          # Запуск в development режиме (hot-reload)
npm run start:debug        # Запуск в debug режиме
npm run build              # Production сборка
npm run start              # Запуск production build
```

### Database

```bash
npm run db:migrate         # Применить миграции
npm run db:migrate:undo    # Откатить последнюю миграцию
npm run db:seed:all        # Применить seeds
npm run db:reset           # Полный reset БД
npm run db:build           # Скомпилировать TypeScript migrations/seeders
```

### Testing

```bash
npm run test               # Все тесты
npm run test:unit          # Unit тесты
npm run test:integration   # Integration тесты
npm run test:e2e           # E2E тесты
npm run test:cov           # С coverage
npm run test:html:open     # HTML отчёт
```

### Code Quality

```bash
npm run lint:ts            # Проверка TypeScript линтером
npm run lint:ts:fix        # Автофикс линтера
npm run prettier           # Форматирование кода
npm run db:lint            # Линтер для DB файлов
```

---

## 🤝 Contributing

Проект разработан как портфолио для демонстрации Middle-level backend skills.

### Development Workflow

1. Создать feature branch: `git checkout -b feature/my-feature`
2. Внести изменения
3. Запустить тесты: `npm run test`
4. Запустить линтер: `npm run lint:ts:fix`
5. Commit: `git commit -m "feat: my feature"`
6. Push: `git push origin feature/my-feature`

### Code Style

- **TypeScript**: strict mode, no `any`, явные типы
- **Naming**: PascalCase (classes), camelCase (methods/variables)
- **Imports**: сгруппированы (NestJS → external → internal)
- **Comments**: JSDoc для публичных методов
- **Formatting**: Prettier (4 spaces, single quotes, 120 chars)

---

## 📄 License

MIT © [Konstantin Atroshchenko](https://github.com/Konstantine899)

---

## 👨‍💻 Author

**Konstantin Atroshchenko**

- Middle Backend Developer
- Специализация: NestJS, TypeScript, Clean Architecture, Testing
- GitHub: [@Konstantine899](https://github.com/Konstantine899)
- Email: kostay375298918971@gmail.com

---

## 🙏 Acknowledgments

Проект создан для демонстрации production-ready backend development skills:

- ✅ Clean Architecture & SOLID
- ✅ Comprehensive Testing (878 tests)
- ✅ Security Best Practices
- ✅ Enterprise-grade Code Quality
- ✅ Professional Documentation

**Ready for production. Ready for portfolio. Ready for Middle-level positions.**
