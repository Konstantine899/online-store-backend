#!/usr/bin/env node

/**
 * Test Database Setup Script
 *
 * Автоматически готовит тестовую БД перед запуском тестов:
 * 1. Создает БД (если не существует)
 * 2. Применяет миграции
 * 3. Применяет seeds
 *
 * Использование:
 *   node scripts/test-db-setup.js
 *   npm run test:setup
 */

const { execSync } = require('child_process');
const path = require('path');

// ANSI цвета для вывода
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, description) {
    log(`\n📦 ${description}...`, 'cyan');
    try {
        execSync(command, {
            stdio: 'inherit',
            cwd: path.resolve(__dirname, '..'),
            env: { ...process.env, NODE_ENV: 'test' },
        });
        log(`✅ ${description} - успешно`, 'green');
        return true;
    } catch (error) {
        // Некоторые команды возвращают ненулевой код, но это ок
        if (description.includes('Создание')) {
            log(
                `⚠️  ${description} - БД уже существует или ошибка создания`,
                'yellow',
            );
            return true; // Продолжаем
        }
        log(`❌ ${description} - ошибка`, 'red');
        return false;
    }
}

async function setupTestDatabase() {
    log('\n🚀 Подготовка тестовой БД для интеграционных тестов', 'cyan');
    log('═'.repeat(60), 'cyan');

    // Шаг 1: Создание БД (игнорируем ошибку, если уже существует)
    exec(
        'npx cross-env NODE_ENV=test sequelize-cli db:create --config db/config/database.js',
        'Создание тестовой БД',
    );

    // Шаг 2: Применение миграций
    const migrationsOk = exec(
        'npx cross-env NODE_ENV=test sequelize-cli db:migrate --config db/config/database.js --migrations-path db/migrations',
        'Применение миграций',
    );

    if (!migrationsOk) {
        log('\n❌ Не удалось применить миграции. Остановка.', 'red');
        process.exit(1);
    }

    // Шаг 3: Применение seeds
    const seedsOk = exec(
        'npx cross-env NODE_ENV=test sequelize-cli db:seed:all --config db/config/database.js --seeders-path db/seeders',
        'Применение seeds (тестовые пользователи)',
    );

    if (!seedsOk) {
        log('\n❌ Не удалось применить seeds. Остановка.', 'red');
        process.exit(1);
    }

    // Готово!
    log('\n' + '═'.repeat(60), 'green');
    log('✅ Тестовая БД готова к использованию!', 'green');
    log('═'.repeat(60), 'green');
    log('\n💡 Теперь можно запускать тесты:', 'cyan');
    log('   npm test', 'yellow');
    log('   npm run test:integration', 'yellow');
    log('   npm run test:watch', 'yellow');
}

// Запуск
setupTestDatabase().catch((error) => {
    log(`\n❌ Критическая ошибка: ${error.message}`, 'red');
    process.exit(1);
});
