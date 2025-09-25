// Настройка переменных окружения для тестов
import { config } from 'dotenv';
import path from 'path';

// Загружаем тестовые переменные окружения
config({ path: path.join(__dirname, '../../.test.env') });

// Устанавливаем NODE_ENV для тестов
process.env.NODE_ENV = 'test';

// Настройки для тестовой БД
if (!process.env.TEST_MYSQL_HOST) {
  console.warn('⚠️  TEST_MYSQL_HOST не установлен, используем значения по умолчанию');
  process.env.TEST_MYSQL_HOST = '127.0.0.1';
  process.env.TEST_MYSQL_PORT = '3308';
  process.env.TEST_MYSQL_DATABASE = 'online_store_test';
  process.env.TEST_MYSQL_USER = 'test_user';
  process.env.TEST_MYSQL_PASSWORD = 'TestPass123!';
  process.env.TEST_DIALECT = 'mysql';
}

// Настройки JWT для тестов
if (!process.env.JWT_ACCESS_SECRET) {
  process.env.JWT_ACCESS_SECRET = 'test_access_secret';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
  process.env.JWT_ACCESS_EXPIRES = '5m';
  process.env.JWT_REFRESH_EXPIRES = '1h';
}

// Настройки CORS для тестов
if (!process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';
}

// Настройки для cookie parser
if (!process.env.COOKIE_PARSER_SECRET_KEY) {
  process.env.COOKIE_PARSER_SECRET_KEY = 'test_cookie_secret';
}

// Отключаем логирование в тестах
process.env.LOG_LEVEL = 'error';
