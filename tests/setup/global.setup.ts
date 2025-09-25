// Глобальная настройка для всех тестов
import { config } from 'dotenv';
import path from 'path';

// Загружаем переменные окружения для тестов
config({ path: path.join(__dirname, '../../.test.env') });

// Глобальные настройки
beforeAll(async () => {
  // Настройки, которые выполняются перед всеми тестами
  console.log('🧪 Запуск тестов...');
});

afterAll(async () => {
  // Очистка после всех тестов
  console.log('✅ Тесты завершены');
});

// Глобальные утилиты для тестов
declare global {
  var testUtils: {
    delay: (ms: number) => Promise<void>;
    generateRandomEmail: () => string;
    generateRandomString: (length?: number) => string;
    generateTestUser: () => any;
    generateTestProduct: () => any;
  };
}

global.testUtils = {
  // Задержка для асинхронных операций
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Генерация случайных данных
  generateRandomEmail: () => `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@example.com`,
  generateRandomString: (length: number = 10) => 
    Math.random().toString(36).substring(2, length + 2),
  
  // Генерация тестовых объектов
  generateTestUser: () => ({
    email: global.testUtils.generateRandomEmail(),
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  }),
  
  generateTestProduct: () => ({
    name: `Test Product ${Date.now()}`,
    description: 'Test product description',
    price: 99.99,
    stock: 100
  })
};
