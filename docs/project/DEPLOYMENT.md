# 🚀 Deployment Documentation

## CI/CD Pipeline

### GitHub Actions

- **Параллельные джобы**: lint, test:unit, test:integration, build
- **MySQL сервис**: автоматическая настройка тестовой БД
- **Кэширование**: TypeScript, Jest, npm dependencies
- **Автоотмена**: отмена предыдущих запусков при новых коммитах

#### Детальная CI/CD конфигурация

**Полный GitHub Actions workflow:**

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
    pull_request:
        branches: [main, dev]
    push:
        branches: [main, dev]

# Автоматическая отмена устаревших запусков при новых коммитах
concurrency:
    group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
    cancel-in-progress: true

# Общие переменные окружения для всех джоб
env:
    CI: 'true' # Включает оптимизации Jest для CI (bail, silent, minimal reporters)
    NODE_VERSION: '22'
    NODE_ENV: test
    LOG_LEVEL: 'error' # Только ошибки в логах (убирает WARN шум)
    # Database configuration (для runtime тестов и sequelize-cli)
    MYSQL_HOST: 127.0.0.1
    MYSQL_PORT: 3306
    MYSQL_DATABASE: online_store_test
    MYSQL_USER: test_user
    MYSQL_PASSWORD: test_password
    DIALECT: mysql
    SQL_LOGGING: 'false'
    SEQUELIZE_LOGGING: 'false'
    # JWT secrets for tests
    JWT_ACCESS_SECRET: test-secret-key-for-ci-pipeline-access-token-32chars
    JWT_REFRESH_SECRET: test-secret-key-for-ci-pipeline-refresh-token-32chars
    JWT_ACCESS_EXPIRES: 15m
    JWT_REFRESH_EXPIRES: 30d
    # Security
    COOKIE_PARSER_SECRET_KEY: test-cookie-parser-secret-key-for-ci-pipeline-min-32-chars
    ALLOWED_ORIGINS: 'http://localhost,http://127.0.0.1:3000,http://127.0.0.1:5000'
    # Rate limiting
    RATE_LIMIT_ENABLED: 'true'
    RATE_LIMIT_LOGIN_ATTEMPTS: '5'
    RATE_LIMIT_LOGIN_WINDOW: '15m'
    RATE_LIMIT_REFRESH_ATTEMPTS: '10'
    RATE_LIMIT_REFRESH_WINDOW: '5m'
    RATE_LIMIT_REG_ATTEMPTS: '3'
    RATE_LIMIT_REG_WINDOW: '1m'

jobs:
    lint:
        name: Lint Code
        runs-on: ubuntu-latest
        steps:
            - name: Checkout code
              uses: actions/checkout@v4
              with:
                  fetch-depth: 1 # Shallow clone для ускорения (не нужна история)

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: ${{ env.NODE_VERSION }}
                  cache: 'npm'

            - name: Install dependencies
              run: npm ci --prefer-offline --no-audit

            - name: Run ESLint
              run: npm run lint:ts

    build:
        name: Build Application
        runs-on: ubuntu-latest
        # Параллельно с lint, не блокируем друг друга
        steps:
            - name: Checkout code
              uses: actions/checkout@v4
              with:
                  fetch-depth: 1 # Shallow clone для ускорения

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: ${{ env.NODE_VERSION }}
                  cache: 'npm'

            - name: Cache TypeScript build
              uses: actions/cache@v4
              with:
                  path: |
                      dist
                      **/*.tsbuildinfo
                  key: ${{ runner.os }}-tsc-${{ hashFiles('**/tsconfig*.json', 'src/**/*.ts') }}
                  restore-keys: |
                      ${{ runner.os }}-tsc-

            - name: Install dependencies
              run: npm ci --prefer-offline --no-audit

            - name: Build TypeScript
              run: npm run build

            - name: Upload build artifacts
              uses: actions/upload-artifact@v4
              with:
                  name: dist
                  path: dist/
                  retention-days: 7

    test-integration:
        name: Integration Tests with Coverage
        runs-on: ubuntu-latest
        # Параллельно с test-unit, не зависим друг от друга

        services:
            mysql:
                image: mysql:8.0
                env:
                    MYSQL_ROOT_PASSWORD: test_root_password
                    MYSQL_DATABASE: online_store_test
                    MYSQL_USER: test_user
                    MYSQL_PASSWORD: test_password
                ports:
                    - 3306:3306
                options: >-
                    --health-cmd="mysqladmin ping"
                    --health-interval=10s
                    --health-timeout=5s
                    --health-retries=3
                    --tmpfs /var/lib/mysql:rw
                    --mount type=tmpfs,destination=/tmp

        steps:
            - name: Checkout code
              uses: actions/checkout@v4
              with:
                  fetch-depth: 1 # Shallow clone для ускорения

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: ${{ env.NODE_VERSION }}
                  cache: 'npm'

            - name: Cache Jest
              uses: actions/cache@v4
              with:
                  path: .jest-cache
                  key: ${{ runner.os }}-jest-integration-${{ hashFiles('**/jest.config.js', 'tests/**/*.ts') }}
                  restore-keys: |
                      ${{ runner.os }}-jest-integration-
                      ${{ runner.os }}-jest-

            - name: Install dependencies
              run: npm ci --prefer-offline --no-audit

            - name: Wait for MySQL
              run: |
                  until mysqladmin ping -h $MYSQL_HOST -P $MYSQL_PORT --silent; do
                    echo 'waiting for mysql...'
                    sleep 2
                  done

            - name: Optimize MySQL for tests
              run: |
                  mysql -h $MYSQL_HOST -P $MYSQL_PORT -u root -ptest_root_password -e "
                    SET GLOBAL innodb_flush_log_at_trx_commit = 2;
                    SET GLOBAL sync_binlog = 0;
                  "

            - name: Run database migrations
              run: npm run db:migrate:test

            - name: Run database seeds
              run: npm run db:seed:test

            - name: Run integration tests with coverage
              run: npm run test:cov:integration

            - name: Upload integration test coverage
              uses: actions/upload-artifact@v4
              with:
                  name: coverage-integration
                  path: coverage/
                  retention-days: 7

    migration-check:
        name: Database Migrations Check
        runs-on: ubuntu-latest
        # Параллельно со всеми остальными джобами

        services:
            mysql:
                image: mysql:8.0
                env:
                    MYSQL_ROOT_PASSWORD: test_root_password
                    MYSQL_DATABASE: online_store_test
                    MYSQL_USER: test_user
                    MYSQL_PASSWORD: test_password
                ports:
                    - 3306:3306
                options: >-
                    --health-cmd="mysqladmin ping"
                    --health-interval=10s
                    --health-timeout=5s
                    --health-retries=3
                    --tmpfs /var/lib/mysql:rw
                    --mount type=tmpfs,destination=/tmp

        steps:
            - name: Checkout code
              uses: actions/checkout@v4
              with:
                  fetch-depth: 1 # Shallow clone для ускорения

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: ${{ env.NODE_VERSION }}
                  cache: 'npm'

            - name: Install dependencies
              run: npm ci --prefer-offline --no-audit

            - name: Wait for MySQL
              run: |
                  until mysqladmin ping -h $MYSQL_HOST -P $MYSQL_PORT --silent; do
                    echo 'waiting for mysql...'
                    sleep 2
                  done

            - name: Optimize MySQL for tests
              run: |
                  mysql -h $MYSQL_HOST -P $MYSQL_PORT -u root -ptest_root_password -e "
                    SET GLOBAL innodb_flush_log_at_trx_commit = 2;
                    SET GLOBAL sync_binlog = 0;
                  "

            - name: Check migrations can be applied
              run: npm run db:migrate:test

            - name: Check migrations can be rolled back
              run: npm run db:migrate:undo:test

            - name: Re-apply migrations
              run: npm run db:migrate:test

    all-checks-passed:
        name: All Checks Passed
        runs-on: ubuntu-latest
        needs:
            [
                lint,
                build,
                test-unit,
                test-integration,
                coverage-report,
                migration-check,
            ]
        if: always()
        steps:
            - name: Check all jobs status
              run: |
                  if [ "${{ needs.lint.result }}" != "success" ] || \
                     [ "${{ needs.build.result }}" != "success" ] || \
                     [ "${{ needs.test-unit.result }}" != "success" ] || \
                     [ "${{ needs.test-integration.result }}" != "success" ] || \
                     [ "${{ needs.coverage-report.result }}" != "success" ] || \
                     [ "${{ needs.migration-check.result }}" != "success" ]; then
                    echo "One or more checks failed"
                    exit 1
                  fi
                  echo "All checks passed successfully! 🚀"
```

**CI оптимизации:**

- **Shallow clone**: `fetch-depth: 1` для быстрого клонирования
- **Build artifacts**: кэширование результатов сборки
- **MySQL оптимизации**: быстрая настройка тестовой БД
- **Параллелизация**: до 4 воркеров для integration тестов
- **Кэширование**: TypeScript, Jest, npm dependencies
- **Автоотмена**: отмена предыдущих запусков при новых коммитах

## Deployment платформы

### Railway

- **Автодеплой**: из GitHub репозитория
- **Переменные окружения**: через Railway dashboard
- **База данных**: автоматическое создание MySQL
- **Домен**: автоматический SSL сертификат
- **Мониторинг**: встроенные метрики и логи

### Render

- **Автодеплой**: из GitHub репозитория
- **Переменные окружения**: через Render dashboard
- **База данных**: отдельный MySQL сервис
- **Домен**: кастомный домен с SSL
- **Масштабирование**: автоматическое и ручное

## Docker

### Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/main.js"]
```

#### Детальные Docker конфигурации

**Multi-stage Dockerfile для production:**

```dockerfile
# Multi-stage build для оптимизации размера образа
FROM node:18-alpine AS builder

# Установка зависимостей для сборки
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копирование исходного кода и сборка
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Создание пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Установка только production зависимостей
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копирование собранного приложения
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Переключение на непривилегированного пользователя
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Открытие порта
EXPOSE 5000

# Запуск приложения
CMD ["node", "dist/main.js"]
```

**Development Dockerfile:**

```dockerfile
# Development Dockerfile для локальной разработки
FROM node:18-alpine

WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка всех зависимостей (включая dev)
RUN npm install

# Копирование исходного кода
COPY . .

# Открытие порта
EXPOSE 5000

# Запуск в режиме разработки
CMD ["npm", "run", "start:dev"]
```

**Оптимизированный .dockerignore:**

```dockerignore
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist
build
coverage

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode
.idea
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Documentation
README.md
docs
*.md

# Test files
tests
jest.config.js
jest.e2e.config.js

# CI/CD
.github

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port
```

### Docker Compose

```yaml
version: '3.8'
services:
    app:
        build: .
        ports:
            - '5000:5000'
        environment:
            - NODE_ENV=production
        depends_on:
            - mysql

    mysql:
        image: mysql:8.0
        environment:
            MYSQL_ROOT_PASSWORD: password
            MYSQL_DATABASE: online_store
        volumes:
            - mysql_data:/var/lib/mysql

volumes:
    mysql_data:
```

**Production Docker Compose:**

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
    app:
        build:
            context: .
            dockerfile: Dockerfile
            target: production
        ports:
            - '5000:5000'
        environment:
            - NODE_ENV=production
            - PORT=5000
        env_file:
            - .env.production
        depends_on:
            mysql:
                condition: service_healthy
        restart: unless-stopped
        healthcheck:
            test:
                [
                    'CMD',
                    'node',
                    '-e',
                    "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })",
                ]
            interval: 30s
            timeout: 10s
            retries: 3
            start_period: 40s

    mysql:
        image: mysql:8.0
        environment:
            MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
            MYSQL_DATABASE: ${MYSQL_DATABASE}
            MYSQL_USER: ${MYSQL_USER}
            MYSQL_PASSWORD: ${MYSQL_PASSWORD}
        volumes:
            - mysql_data:/var/lib/mysql
            - ./db/init:/docker-entrypoint-initdb.d
        ports:
            - '3306:3306'
        restart: unless-stopped
        healthcheck:
            test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost']
            interval: 30s
            timeout: 10s
            retries: 3
            start_period: 30s
        command: --default-authentication-plugin=mysql_native_password

    nginx:
        image: nginx:alpine
        ports:
            - '80:80'
            - '443:443'
        volumes:
            - ./nginx.conf:/etc/nginx/nginx.conf
            - ./ssl:/etc/nginx/ssl
        depends_on:
            - app
        restart: unless-stopped

volumes:
    mysql_data:
        driver: local
```

**Development Docker Compose:**

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
    app:
        build:
            context: .
            dockerfile: Dockerfile.dev
        ports:
            - '5000:5000'
        environment:
            - NODE_ENV=development
        env_file:
            - .env.development
        volumes:
            - .:/app
            - /app/node_modules
        depends_on:
            - mysql
        command: npm run start:dev

    mysql:
        image: mysql:8.0
        environment:
            MYSQL_ROOT_PASSWORD: dev_password
            MYSQL_DATABASE: online_store_dev
            MYSQL_USER: dev_user
            MYSQL_PASSWORD: dev_password
        ports:
            - '3306:3306'
        volumes:
            - mysql_dev_data:/var/lib/mysql
        command: --default-authentication-plugin=mysql_native_password

volumes:
    mysql_dev_data:
        driver: local
```

**Nginx конфигурация для production:**

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Rate limiting
        limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
        limit_req zone=api burst=20 nodelay;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://app;
            access_log off;
        }
    }
}
```

## Health Checks

### Terminus интеграция

- **`/health`** - общий health check
- **`/health/database`** - проверка подключения к БД
- **`/health/memory`** - проверка использования памяти
- **`/health/disk`** - проверка свободного места

#### Детальные Health Checks

**Health Controller с Terminus интеграцией:**

```typescript
// src/infrastructure/controllers/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SequelizeHealthIndicator } from './sequelize.health';

@Controller()
export class HealthController {
    constructor(
        private readonly healthCheck: HealthCheckService,
        private readonly db: SequelizeHealthIndicator,
    ) {}

    @Get('health')
    @HealthCheck()
    health() {
        return this.healthCheck.check([() => this.db.pingCheck()]);
    }

    @Get('live')
    live() {
        return { status: 'ok' };
    }

    @Get('ready')
    @HealthCheck()
    ready() {
        return this.healthCheck.check([() => this.db.pingCheck()]);
    }
}
```

**Sequelize Health Indicator:**

```typescript
// src/infrastructure/controllers/health/sequelize.health.ts
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class SequelizeHealthIndicator extends HealthIndicator {
    constructor(private readonly sequelize: Sequelize) {
        super();
    }

    async pingCheck(key = 'database'): Promise<HealthIndicatorResult> {
        try {
            await this.sequelize.authenticate();
            return this.getStatus(key, true);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'unhealthy';
            return this.getStatus(key, false, { message });
        }
    }
}
```

**Health Module:**

```typescript
// src/infrastructure/controllers/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { SequelizeHealthIndicator } from './sequelize.health';

@Module({
    imports: [TerminusModule],
    controllers: [HealthController],
    providers: [SequelizeHealthIndicator],
})
export class HealthModule {}
```

**Kubernetes Health Check Probes:**

```yaml
# kubernetes-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: online-store-backend
spec:
    replicas: 3
    selector:
        matchLabels:
            app: online-store-backend
    template:
        metadata:
            labels:
                app: online-store-backend
        spec:
            containers:
                - name: app
                  image: online-store-backend:latest
                  ports:
                      - containerPort: 5000
                  livenessProbe:
                      httpGet:
                          path: /health
                          port: 5000
                      initialDelaySeconds: 30
                      periodSeconds: 10
                      timeoutSeconds: 5
                      failureThreshold: 3
                  readinessProbe:
                      httpGet:
                          path: /ready
                          port: 5000
                      initialDelaySeconds: 5
                      periodSeconds: 5
                      timeoutSeconds: 3
                      failureThreshold: 3
                  startupProbe:
                      httpGet:
                          path: /live
                          port: 5000
                      initialDelaySeconds: 10
                      periodSeconds: 5
                      timeoutSeconds: 3
                      failureThreshold: 30
```

### Мониторинг

- **Uptime**: отслеживание доступности сервиса
- **Response time**: время ответа endpoints
- **Error rate**: процент ошибок
- **Database connections**: количество активных соединений

## Миграции в production

### Автоматические миграции

- **При деплое**: автоматическое применение миграций
- **Rollback**: возможность отката к предыдущей версии
- **Проверка**: валидация миграций перед применением

### Безопасность миграций

- **Backup**: автоматическое создание бэкапов
- **Тестирование**: проверка миграций на staging
- **Мониторинг**: отслеживание процесса миграции

## Переменные окружения

### Production

```bash
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://your-domain.com
COOKIE_PARSER_SECRET_KEY=your_secure_secret
JWT_ACCESS_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
SQL_LOGGING=false
SECURITY_HELMET_ENABLED=true
SECURITY_CORS_ENABLED=true
SECURITY_CSP_ENABLED=true
RATE_LIMIT_ENABLED=true
```

#### Детальные Environment переменные

**Полный список переменных из env.example:**

```bash
# =============================================================================
# ONLINE STORE BACKEND - Environment Variables Reference
# =============================================================================

NODE_ENV=development
PORT=5000

ALLOWED_ORIGINS=http://localhost:3000

# Secrets (минимум 32 символа для production/staging)
# Генерация: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
COOKIE_PARSER_SECRET_KEY=GENERATE_STRONG_SECRET_HERE
JWT_ACCESS_SECRET=GENERATE_STRONG_SECRET_HERE
JWT_REFRESH_SECRET=GENERATE_DIFFERENT_SECRET_HERE

JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d

# Secret Rotation (опционально, для production/staging)
# JWT_SECRET_ROTATION_DATE=2026-01-01T00:00:00Z
# JWT_SECRET_VERSION=v1

# Security
SQL_LOGGING=false
SECURITY_HELMET_ENABLED=true
SECURITY_CORS_ENABLED=true
SECURITY_CSP_ENABLED=true

# Rate limiting
RATE_LIMIT_ENABLED=true
# Global limits
RATE_LIMIT_GLOBAL_RPS=3
RATE_LIMIT_GLOBAL_RPM=100
# Profiles
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_LOGIN_WINDOW=15m
RATE_LIMIT_REFRESH_ATTEMPTS=10
RATE_LIMIT_REFRESH_WINDOW=5m
RATE_LIMIT_REG_ATTEMPTS=3
RATE_LIMIT_REG_WINDOW=1m

# Database
DIALECT=mysql
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=YOUR_DB_PASSWORD
MYSQL_DATABASE=online_store
MYSQL_PORT=3306
```

**Production переменные:**

```bash
# Production Environment Variables
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Strong secrets for production (32+ characters)
COOKIE_PARSER_SECRET_KEY=your_production_cookie_secret_32_chars_minimum
JWT_ACCESS_SECRET=your_production_jwt_access_secret_32_chars_minimum
JWT_REFRESH_SECRET=your_production_jwt_refresh_secret_32_chars_minimum

JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d

# Secret rotation for production
JWT_SECRET_ROTATION_DATE=2026-01-01T00:00:00Z
JWT_SECRET_VERSION=v1

# Security settings
SQL_LOGGING=false
SECURITY_HELMET_ENABLED=true
SECURITY_CORS_ENABLED=true
SECURITY_CSP_ENABLED=true

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_GLOBAL_RPS=10
RATE_LIMIT_GLOBAL_RPM=1000
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_LOGIN_WINDOW=15m
RATE_LIMIT_REFRESH_ATTEMPTS=10
RATE_LIMIT_REFRESH_WINDOW=5m
RATE_LIMIT_REG_ATTEMPTS=3
RATE_LIMIT_REG_WINDOW=1m

# Database (production)
DIALECT=mysql
MYSQL_HOST=your_production_db_host
MYSQL_USER=your_production_db_user
MYSQL_PASSWORD=your_production_db_password
MYSQL_DATABASE=online_store_production
MYSQL_PORT=3306

# Swagger (disable in production)
SWAGGER_ENABLED=false
```

**Staging переменные:**

```bash
# Staging Environment Variables
NODE_ENV=staging
PORT=5000
ALLOWED_ORIGINS=https://staging.your-domain.com

# Staging secrets (different from production)
COOKIE_PARSER_SECRET_KEY=your_staging_cookie_secret_32_chars_minimum
JWT_ACCESS_SECRET=your_staging_jwt_access_secret_32_chars_minimum
JWT_REFRESH_SECRET=your_staging_jwt_refresh_secret_32_chars_minimum

# Security settings
SQL_LOGGING=false
SECURITY_HELMET_ENABLED=true
SECURITY_CORS_ENABLED=true
SECURITY_CSP_ENABLED=true

# Rate limiting (more lenient for staging)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_GLOBAL_RPS=20
RATE_LIMIT_GLOBAL_RPM=2000

# Database (staging)
DIALECT=mysql
MYSQL_HOST=your_staging_db_host
MYSQL_USER=your_staging_db_user
MYSQL_PASSWORD=your_staging_db_password
MYSQL_DATABASE=online_store_staging
MYSQL_PORT=3306

# Swagger (enabled for staging testing)
SWAGGER_ENABLED=true
```

**Development переменные:**

```bash
# Development Environment Variables
NODE_ENV=development
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Development secrets (can be weaker)
COOKIE_PARSER_SECRET_KEY=dev_cookie_secret_key_minimum_32_chars
JWT_ACCESS_SECRET=dev_jwt_access_secret_key_minimum_32_chars
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_key_minimum_32_chars

# Security settings (relaxed for development)
SQL_LOGGING=true
SECURITY_HELMET_ENABLED=true
SECURITY_CORS_ENABLED=true
SECURITY_CSP_ENABLED=false

# Rate limiting (disabled for development)
RATE_LIMIT_ENABLED=false

# Database (local)
DIALECT=mysql
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_local_password
MYSQL_DATABASE=online_store_dev
MYSQL_PORT=3306

# Swagger (enabled for development)
SWAGGER_ENABLED=true
```

## NPM Scripts

### Полный список доступных команд

**Build и запуск:**

```json
{
    "build": "nest build",
    "start": "cross-env NODE_ENV=production nest start",
    "start:dev": "cross-env NODE_ENV=development nest start --watch"
}
```

**Linting и форматирование:**

```json
{
    "lint:ts": "eslint \"{src,config,db}/**/*.ts\"",
    "lint:ts:fix": "eslint \"{src,config,db}/**/*.ts\" --fix",
    "prettier": "prettier --write \"src/**/*.ts\" \"db/**/*.{js,ts}\""
}
```

**Тестирование:**

```json
{
    "test": "cross-env NODE_ENV=test jest",
    "test:watch": "jest --watch",
    "test:unit": "jest --selectProjects unit",
    "test:integration": "jest --selectProjects integration --runInBand",
    "test:integration:ci": "cross-env CI=true jest --selectProjects integration --maxWorkers=4",
    "test:unit:watch": "jest --selectProjects unit --watch",
    "test:integration:watch": "jest --selectProjects integration --watch --runInBand",
    "test:cov": "jest --coverage",
    "test:cov:unit": "jest --selectProjects unit --coverage",
    "test:cov:integration": "jest --selectProjects integration --coverage --runInBand",
    "test:cov:integration:ci": "cross-env CI=true jest --selectProjects integration --coverage --maxWorkers=4",
    "test:cov:open": "npm run test:cov && start coverage/index.html",
    "test:html": "npm run test && start test-reports/test-report.html",
    "test:html:open": "npm run test && start test-reports/test-report.html",
    "test:ci": "cross-env CI=true NODE_ENV=test jest",
    "test:debug": "jest --detectOpenHandles --runInBand",
    "test:e2e": "cross-env NODE_ENV=test jest --config ./jest.e2e.config.js",
    "test:setup": "node scripts/test-db-setup.js",
    "test:reset": "npm run db:drop:test && npm run test:setup",
    "pretest:integration": "npm run test:setup --if-present"
}
```

**Database management:**

```json
{
    "db:migrate": "npx sequelize-cli db:migrate",
    "db:migrate:undo": "npx sequelize-cli db:migrate:undo",
    "db:migrate:undo:all": "npx sequelize-cli db:migrate:undo:all",
    "db:migrate:status": "npx sequelize-cli db:migrate:status",
    "db:seed:all": "npx sequelize-cli db:seed:all",
    "db:seed:undo:all": "npx sequelize-cli db:seed:undo:all",
    "db:reset": "npm run db:drop && npm run db:create && npm run db:migrate && npm run db:seed:all",
    "db:drop": "npx sequelize-cli db:drop",
    "db:create": "npx sequelize-cli db:create",
    "db:build": "tsc -p db/tsconfig.json",
    "db:lint": "eslint \"db/**/*.ts\"",
    "db:lint:fix": "eslint \"db/**/*.ts\" --fix",
    "db:migration:generate": "npx sequelize-cli migration:generate --name",
    "db:migrate:test": "cross-env NODE_ENV=test npx sequelize-cli db:migrate --config db/config/database.js --migrations-path db/migrations",
    "db:migrate:undo:test": "cross-env NODE_ENV=test npx sequelize-cli db:migrate:undo --config db/config/database.js --migrations-path db/migrations",
    "db:migrate:undo:all:test": "cross-env NODE_ENV=test npx sequelize-cli db:migrate:undo:all --config db/config/database.js --migrations-path db/migrations",
    "db:seed:test": "cross-env NODE_ENV=test npx sequelize-cli db:seed:all --config db/config/database.js --seeders-path db/seeders",
    "db:seed:undo:test": "cross-env NODE_ENV=test npx sequelize-cli db:seed:undo:all --config db/config/database.js --seeders-path db/seeders"
}
```

**Docker команды:**

```json
{
    "docker:build": "docker build -t online-store-backend .",
    "docker:run": "docker run -p 5000:5000 online-store-backend",
    "docker:dev": "docker-compose -f docker-compose.dev.yml up",
    "docker:prod": "docker-compose -f docker-compose.prod.yml up",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "docker:clean": "docker system prune -f"
}
```

**Deployment команды:**

```json
{
    "deploy:staging": "npm run build && npm run db:migrate && npm run start",
    "deploy:production": "npm run build && npm run db:migrate && npm run start",
    "deploy:docker": "docker build -t online-store-backend . && docker run -p 5000:5000 online-store-backend"
}
```

## Мониторинг и логирование

### Структурированные логи

- **JSON формат**: для production
- **Pretty printing**: для development
- **Уровни**: info, warn, error
- **Correlation ID**: для трассировки запросов

### Метрики

- **Response time**: время ответа endpoints
- **Throughput**: количество запросов в секунду
- **Error rate**: процент ошибок
- **Memory usage**: использование памяти
- **Database connections**: активные соединения

### Алерты

- **High error rate**: превышение порога ошибок
- **Slow response**: медленные ответы
- **Memory leak**: утечки памяти
- **Database issues**: проблемы с БД

## Безопасность в production

### HTTPS

- **SSL сертификаты**: автоматические через платформы
- **HSTS**: принудительное использование HTTPS
- **Secure cookies**: только HTTPS в production

### Headers безопасности

- **Helmet**: автоматические безопасные заголовки
- **CORS**: строгие настройки для production
- **CSP**: Content Security Policy

### Rate Limiting

- **Глобальные лимиты**: защита от DDoS
- **Auth лимиты**: защита от брутфорса
- **IP блокировка**: автоматическая блокировка подозрительных IP

## Backup и восстановление

### База данных

- **Автоматические бэкапы**: ежедневные бэкапы БД
- **Point-in-time recovery**: восстановление на определенный момент
- **Тестирование**: регулярное тестирование восстановления

### Код и конфигурация

- **Git**: версионирование кода
- **Environment variables**: безопасное хранение конфигурации
- **Secrets management**: управление секретами

## Масштабирование

### Горизонтальное масштабирование

- **Load balancer**: распределение нагрузки
- **Stateless**: приложение без состояния
- **Database**: отдельная БД для каждого инстанса

### Вертикальное масштабирование

- **Memory**: увеличение RAM
- **CPU**: увеличение процессорной мощности
- **Storage**: увеличение дискового пространства

## Troubleshooting

### Частые проблемы

- **Database connection**: проблемы с подключением к БД
- **Memory leak**: утечки памяти
- **Slow queries**: медленные SQL запросы
- **Rate limiting**: блокировка по IP

### Диагностика

- **Logs**: анализ структурированных логов
- **Metrics**: мониторинг метрик
- **Health checks**: проверка состояния сервиса
- **Database**: анализ производительности БД

### Восстановление

- **Rollback**: откат к предыдущей версии
- **Restart**: перезапуск сервиса
- **Database restore**: восстановление из бэкапа
- **Scaling**: масштабирование ресурсов
