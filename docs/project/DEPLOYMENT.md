# 🚀 Deployment Documentation

## CI/CD Pipeline

### GitHub Actions

- **Параллельные джобы**: lint, test:unit, test:integration, build
- **MySQL сервис**: автоматическая настройка тестовой БД
- **Кэширование**: TypeScript, Jest, npm dependencies
- **Автоотмена**: отмена предыдущих запусков при новых коммитах

### Конфигурация CI

```yaml
strategy:
    matrix:
        include:
            - name: 'Lint & Format'
              command: 'npm run lint:ts'
            - name: 'Unit Tests'
              command: 'npm run test:unit'
            - name: 'Integration Tests'
              command: 'npm run test:integration:ci'
            - name: 'Build'
              command: 'npm run build'
```

### CI оптимизации

- **Shallow clone**: `fetch-depth: 1` для быстрого клонирования
- **Build artifacts**: кэширование результатов сборки
- **MySQL оптимизации**: быстрая настройка тестовой БД
- **Параллелизация**: до 4 воркеров для integration тестов

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

## Health Checks

### Terminus интеграция

- **`/health`** - общий health check
- **`/health/database`** - проверка подключения к БД
- **`/health/memory`** - проверка использования памяти
- **`/health/disk`** - проверка свободного места

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

### Staging

```bash
NODE_ENV=staging
PORT=5000
ALLOWED_ORIGINS=https://staging.your-domain.com
# ... остальные переменные как в production
```

### Development

```bash
NODE_ENV=development
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000
# ... остальные переменные
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
