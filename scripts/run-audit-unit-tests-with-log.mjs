#!/usr/bin/env node

/**
 * Скрипт для запуска unit тестов audit сервисов с записью логов в файл
 * Тестирует:
 *   - audit.service.unit.test.ts
 *   - role-audit.service.unit.test.ts
 *
 * Использование:
 *   node scripts/run-audit-unit-tests-with-log.js
 *   node scripts/run-audit-unit-tests-with-log.js --verbose
 *   node scripts/run-audit-unit-tests-with-log.js --coverage
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'test-logs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(
    logDir,
    `audit-unit-tests-${timestamp}.log`,
);

// Создать директорию для логов, если её нет
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Парсинг дополнительных опций
const args = process.argv.slice(2);
const jestArgs = [
    '--selectProjects',
    'unit',
    '--testPathPatterns',
    'audit.*unit.test',
];

// Добавить опции, если они переданы
if (args.includes('--verbose')) {
    jestArgs.push('--verbose');
}
if (args.includes('--coverage')) {
    jestArgs.push('--coverage');
}
if (args.includes('--watch')) {
    jestArgs.push('--watch');
}

console.log(`🚀 Запуск unit тестов для audit сервисов...`);
console.log(`📝 Логи будут записаны в: ${logFile}\n`);

const writeStream = fs.createWriteStream(logFile, { flags: 'w' });

// Записать заголовок лога
writeStream.write(`=== Audit Unit Tests Log ===\n`);
writeStream.write(`Date: ${new Date().toISOString()}\n`);
writeStream.write(`Command: jest ${jestArgs.join(' ')}\n`);
writeStream.write(`Test Files:\n`);
writeStream.write(`  - audit.service.unit.test.ts\n`);
writeStream.write(`  - role-audit.service.unit.test.ts\n`);
writeStream.write(`${'='.repeat(60)}\n\n`);

const testStartTime = Date.now();

// Запустить jest
const jest = spawn('npx', ['jest', ...jestArgs], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, NODE_ENV: 'test' },
});

    let stdoutBuffer = '';

// Записывать stdout в файл и консоль
jest.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    writeStream.write(output);
    stdoutBuffer += output;
});

// Записывать stderr в файл и консоль
jest.stderr.on('data', (data) => {
    const output = data.toString();
    process.stderr.write(output);
    writeStream.write(`[STDERR] ${output}`);
});

// Обработка завершения
jest.on('close', (code) => {
    const duration = Date.now() - testStartTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    writeStream.write(`\n${'='.repeat(60)}\n`);
    writeStream.write(`Exit Code: ${code}\n`);
    writeStream.write(`Duration: ${durationSeconds}s\n`);
    writeStream.write(`Finished at: ${new Date().toISOString()}\n`);
    writeStream.write(`${'='.repeat(60)}\n`);

    // Статистика тестов
    const passedTests = (stdoutBuffer.match(/PASS/g) ?? []).length;
    const failedTests = (stdoutBuffer.match(/FAIL/g) ?? []).length;
    const totalTests = passedTests + failedTests;

    // Статистика по файлам
    const auditServiceTests = (stdoutBuffer.match(/audit\.service\.unit\.test/g) ?? []).length;
    const roleAuditServiceTests = (stdoutBuffer.match(/role-audit\.service\.unit\.test/g) ?? []).length;

    if (totalTests > 0) {
        writeStream.write(`\nTest Results:\n`);
        writeStream.write(`  Total Suites: ${totalTests}\n`);
        writeStream.write(`  Passed: ${passedTests}\n`);
        writeStream.write(`  Failed: ${failedTests}\n`);
        writeStream.write(`\nTest Files:\n`);
        writeStream.write(`  audit.service.unit.test.ts: ${auditServiceTests > 0 ? '✅' : '⏭️ '}\n`);
        writeStream.write(`  role-audit.service.unit.test.ts: ${roleAuditServiceTests > 0 ? '✅' : '⏭️ '}\n`);
    }

    writeStream.end();

    console.log(`\n${'='.repeat(60)}`);
    if (code === 0) {
        console.log(`✅ Все тесты пройдены успешно!`);
        if (totalTests > 0) {
            console.log(`   Провалено: ${passedTests} | Упало: ${failedTests}`);
        }
    } else {
        console.log(`❌ Тесты завершились с ошибкой (код: ${code})`);
        if (totalTests > 0) {
            console.log(`   Провалено: ${passedTests} | Упало: ${failedTests}`);
        }
    }
    console.log(`⏱️  Время выполнения: ${durationSeconds}s`);
    console.log(`📄 Полный лог сохранён в: ${logFile}`);
    console.log(`${'='.repeat(60)}`);

    process.exit(code);
});

// Обработка ошибок
jest.on('error', (error) => {
    const errorMsg = `[ERROR] Ошибка при запуске jest: ${error.message}\n`;
    const stackMsg = `[STACK] ${error.stack}\n`;

    console.error(errorMsg);
    writeStream.write(errorMsg);
    writeStream.write(stackMsg);
    writeStream.end();

    process.exit(1);
});

