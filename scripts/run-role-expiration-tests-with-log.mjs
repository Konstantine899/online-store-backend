#!/usr/bin/env node

/**
 * Скрипт для запуска тестов SAAS-017-17 (Role Expiration/Renewal) с логированием в файл
 *
 * Запускает:
 * - Unit тесты: MetricsCollector (role expiration metrics), RoleRepository (auto-renewal), RoleService (expiration/renewal)
 * - Integration тесты: RoleExpirationService, RoleExpirationNotificationService
 */

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const testType = process.argv.includes('--integration') ? 'integration' : 'unit';
const testDir = join(process.cwd(), 'test-logs');
const logFile = join(testDir, `role-expiration-${testType}-tests-${timestamp}.log`);

// Создаём директорию для логов если её нет
try {
    mkdirSync(testDir, { recursive: true });
} catch (error) {
    // Директория уже существует
}

// Паттерны для поиска тестов
const unitTestPatterns = [
    'metrics-collector.unit.test', // Role expiration metrics
    'role.repository.unit.test',   // Auto-renewal config methods
    'role.service.unit.test',      // deactivateExpiredRoles, autoRenewRole
];

const integrationTestPatterns = [
    'role-expiration.integration.test',
];

const patterns = testType === 'unit' ? unitTestPatterns : integrationTestPatterns;
// Формируем паттерн для Jest: объединяем все паттерны через | (без кавычек)
// Экранируем точки для regex
const testPathPattern = patterns.map(p => p.replace(/\./g, '\\.')).join('|');

console.log(`🚀 Запуск ${testType} тестов для SAAS-017-17 (Role Expiration/Renewal)...`);
console.log(`📝 Логи будут сохранены в: ${logFile}`);
console.log(`🔍 Паттерн поиска: ${patterns.join(', ')}\n`);

const args = [
    '--selectProjects',
    testType,
    '--testPathPatterns',
    testPathPattern,
];

if (testType === 'integration') {
    args.push('--runInBand');
}

if (process.argv.includes('--verbose')) {
    args.push('--verbose');
}

if (process.argv.includes('--coverage')) {
    args.push('--coverage');
}

const jestProcess = spawn('npx', ['jest', ...args], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: {
        ...process.env,
        NODE_ENV: 'test',
        DEBUG_SQL: 'true', // Включаем отладочные логи SQL и других операций
        // Устанавливаем кодировку UTF-8 для Windows
        ...(process.platform === 'win32' && { CHCP: '65001' }),
    },
});

let stdoutBuffer = '';
let stderrBuffer = '';

jestProcess.stdout?.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);
    stdoutBuffer += text;
});

jestProcess.stderr?.on('data', (data) => {
    const text = data.toString();
    process.stderr.write(text);
    stderrBuffer += text;
});

jestProcess.on('close', (code) => {
    // Извлекаем статистику из вывода
    const passedMatch = stdoutBuffer.match(/(\d+) passed/);
    const failedMatch = stdoutBuffer.match(/(\d+) failed/);
    const totalMatch = stdoutBuffer.match(/(\d+) total/);

    const passedCount = passedMatch ? passedMatch[1] : '0';
    const failedCount = failedMatch ? failedMatch[1] : '0';
    const totalCount = totalMatch ? totalMatch[1] : '?';

    const logContent = `
================================================================================
Role Expiration/Renewal Tests (SAAS-017-17) - ${testType.toUpperCase()} Tests
================================================================================
Дата: ${new Date().toISOString()}
Тип: ${testType}
Паттерны: ${patterns.join(', ')}
DEBUG_SQL: true

================================================================================
РЕЗУЛЬТАТЫ ТЕСТОВ
================================================================================
Всего тестов: ${totalCount}
✅ Пройдено: ${passedCount}
❌ Провалено: ${failedCount}
Exit Code: ${code}
${code === 0 ? '✅ Тесты прошли успешно' : '❌ Тесты завершились с ошибками'}

================================================================================
STDOUT (полный вывод)
================================================================================
${stdoutBuffer}

================================================================================
STDERR (полный вывод)
================================================================================
${stderrBuffer}

================================================================================
КОНЕЦ ЛОГА
================================================================================
`;

    writeFileSync(logFile, logContent, 'utf-8');

    console.log(`\n📄 Полный лог сохранён в: ${logFile}`);
    console.log(`📊 Статистика: ${passedCount}/${totalCount} тестов прошло`);

    process.exit(code ?? 1);
});

jestProcess.on('error', (error) => {
    console.error('❌ Ошибка запуска Jest:', error);
    process.exit(1);
});

