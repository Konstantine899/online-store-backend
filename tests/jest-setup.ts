import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Jest global setup - загружает .test.env перед запуском тестов
 * 
 * Этот файл выполняется перед всеми тестами и обеспечивает
 * наличие необходимых environment переменных для unit-тестов.
 */

// Загружаем .test.env из корня проекта
const envPath = path.resolve(__dirname, '../.test.env');

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn(
        `⚠️  Не удалось загрузить .test.env из ${envPath}. ` +
            `Unit-тесты могут упасть из-за отсутствия env переменных.`,
    );
    console.warn(`Ошибка: ${result.error.message}`);
} else {
    console.log(`✅ Environment loaded from ${envPath}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
}


