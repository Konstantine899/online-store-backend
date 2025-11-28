const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Очистка кеша Jest...');

// Путь к корню проекта (на уровень выше scripts/)
const rootPath = path.join(__dirname, '..');

// 1. Удаляем папку кеша Jest
const jestCachePath = path.join(rootPath, 'node_modules', '.cache', 'jest');
if (fs.existsSync(jestCachePath)) {
    fs.rmSync(jestCachePath, { recursive: true, force: true });
    console.log('✅ Кеш Jest удалён:', jestCachePath);
} else {
    console.log('⚠️ Кеш Jest не найден:', jestCachePath);
}

// 2. Удаляем папку .swc (если используется)
const swcCachePath = path.join(rootPath, 'node_modules', '.cache', '.swc');
if (fs.existsSync(swcCachePath)) {
    fs.rmSync(swcCachePath, { recursive: true, force: true });
    console.log('✅ Кеш SWC удалён:', swcCachePath);
}

// 3. Удаляем папку ts-jest (если есть)
const tsJestCachePath = path.join(rootPath, 'node_modules', '.cache', 'ts-jest');
if (fs.existsSync(tsJestCachePath)) {
    fs.rmSync(tsJestCachePath, { recursive: true, force: true });
    console.log('✅ Кеш ts-jest удалён:', tsJestCachePath);
}

// 4. Запускаем команду очистки Jest
try {
    execSync('npx jest --clearCache', { stdio: 'inherit', cwd: rootPath });
    console.log('✅ Команда jest --clearCache выполнена успешно');
} catch (error) {
    console.log('⚠️ Ошибка при выполнении jest --clearCache:', error.message);
}

console.log('✅ Очистка завершена! Теперь можно запускать тесты.');

