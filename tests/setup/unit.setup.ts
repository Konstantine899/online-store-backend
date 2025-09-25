// Настройки для unit тестов
import { config } from 'dotenv';
import path from 'path';

// Загружаем тестовые переменные окружения
config({ path: path.join(__dirname, '../../.test.env') });

// Настройки для unit тестов
beforeAll(async () => {
  console.log('🔧 Настройка unit тестов...');
  
  // Здесь можно добавить:
  // - Настройку моков для внешних зависимостей
  // - Инициализацию тестовых утилит
});

afterAll(async () => {
  console.log('🧹 Очистка после unit тестов...');
});

// Настройки для каждого unit теста
beforeEach(async () => {
  // Очистка моков перед каждым тестом
  jest.clearAllMocks();
});

afterEach(async () => {
  // Очистка после каждого теста
});
