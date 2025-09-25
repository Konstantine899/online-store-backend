// Интеграционный тест для проверки rate limiting
// Запуск: node tests/integration/rate-limiting.test.js

const baseUrl = 'http://localhost:5000/online-store/auth';

async function testRateLimiting() {
    console.log('🧪 Тестирование rate limiting...\n');

    // Тест 1: Логин - превышение лимита (5 попыток в 15 минут)
    console.log('1️⃣ Тестируем лимит логина (5 попыток в 15 минут)...');
    
    for (let i = 1; i <= 7; i++) {
        try {
            const response = await fetch(`${baseUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
            });
            
            if (response.status === 401) {
                const error = await response.text();
                if (error.includes('Too many login attempts')) {
                    console.log(`✅ Попытка ${i}: Лимит сработал - ${error}`);
                    break;
                } else {
                    console.log(`❌ Попытка ${i}: Неправильная ошибка - ${error}`);
                }
            } else {
                console.log(`⚠️  Попытка ${i}: Статус ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Попытка ${i}: Ошибка сети - ${error.message}`);
        }
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n2️⃣ Тестируем лимит refresh (10 попыток в 5 минут)...');
    
    // Тест 2: Refresh - превышение лимита (10 попыток в 5 минут)
    for (let i = 1; i <= 12; i++) {
        try {
            const response = await fetch(`${baseUrl}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Отправляем без cookie для тестирования
            });
            
            if (response.status === 401) {
                const error = await response.text();
                if (error.includes('Too many refresh attempts')) {
                    console.log(`✅ Попытка ${i}: Лимит сработал - ${error}`);
                    break;
                } else if (error.includes('Refresh token cookie is missing')) {
                    console.log(`⚠️  Попытка ${i}: Ожидаемая ошибка cookie - ${error}`);
                } else {
                    console.log(`❌ Попытка ${i}: Неправильная ошибка - ${error}`);
                }
            } else {
                console.log(`⚠️  Попытка ${i}: Статус ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Попытка ${i}: Ошибка сети - ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n3️⃣ Тестируем лимит регистрации (3 попытки в минуту)...');
    
    // Тест 3: Регистрация - превышение лимита (3 попытки в минуту)
    for (let i = 1; i <= 5; i++) {
        try {
            const response = await fetch(`${baseUrl}/registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: `test${i}@example.com`,
                    password: 'password123',
                    firstName: 'Test',
                    lastName: 'User'
                })
            });
            
            if (response.status === 401) {
                const error = await response.text();
                if (error.includes('Too many registration attempts')) {
                    console.log(`✅ Попытка ${i}: Лимит сработал - ${error}`);
                    break;
                } else {
                    console.log(`❌ Попытка ${i}: Неправильная ошибка - ${error}`);
                }
            } else if (response.status === 201) {
                console.log(`✅ Попытка ${i}: Успешная регистрация`);
            } else {
                console.log(`⚠️  Попытка ${i}: Статус ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Попытка ${i}: Ошибка сети - ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✅ Тестирование завершено!');
    console.log('\n📋 Ожидаемые результаты:');
    console.log('- Логин: 401 после 5 попыток с сообщением "Too many login attempts"');
    console.log('- Refresh: 401 после 10 попыток с сообщением "Too many refresh attempts"');
    console.log('- Регистрация: 401 после 3 попыток с сообщением "Too many registration attempts"');
}

// Запуск теста
testRateLimiting().catch(console.error);
