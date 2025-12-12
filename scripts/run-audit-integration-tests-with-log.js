#!/usr/bin/env node

/**
 * Скрипт для запуска integration тестов audit endpoints с записью логов в файл
 * Использование: node scripts/run-audit-integration-tests-with-log.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logDir = path.join(process.cwd(), 'test-logs');
const logFile = path.join(
    logDir,
    `audit-integration-tests-${new Date().toISOString().replace(/[:.]/g, '-')}.log`,
);

// Создать директорию для логов, если её нет
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

console.log(`Запуск integration тестов для audit endpoints...`);
console.log(`Логи будут записаны в: ${logFile}\n`);

const writeStream = fs.createWriteStream(logFile, { flags: 'w' });
writeStream.write(`=== Audit Integration Tests Log ===\n`);
writeStream.write(`Date: ${new Date().toISOString()}\n`);
writeStream.write(
    `Command: jest --selectProjects integration --testPathPatterns="role-audit.controller.integration.test" --verbose --runInBand\n`,
);
writeStream.write(`${'='.repeat(50)}\n\n`);

// Запустить jest
const jest = spawn(
    'npx',
    [
        'jest',
        '--selectProjects',
        'integration',
        '--testPathPatterns',
        'role-audit.controller.integration.test',
        '--verbose',
        '--runInBand',
    ],
    {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, NODE_ENV: 'test' },
    },
);

// Записывать stdout в файл и консоль
jest.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    writeStream.write(output);
});

// Записывать stderr в файл и консоль
jest.stderr.on('data', (data) => {
    const output = data.toString();
    process.stderr.write(output);
    writeStream.write(`[STDERR] ${output}`);
});

// Обработка завершения
jest.on('close', (code) => {
    writeStream.write(`\n${'='.repeat(50)}\n`);
    writeStream.write(`Exit code: ${code}\n`);
    writeStream.write(`Date: ${new Date().toISOString()}\n`);
    writeStream.end();

    if (code === 0) {
        console.log(`\n✅ Тесты завершены успешно!`);
    } else {
        console.log(`\n❌ Тесты завершились с ошибкой (код: ${code})`);
    }
    console.log(`📄 Полный лог сохранён в: ${logFile}\n`);
    process.exit(code);
});

// Обработка ошибок
jest.on('error', (error) => {
    const errorMsg = `Ошибка при запуске jest: ${error.message}\n`;
    console.error(errorMsg);
    writeStream.write(`[ERROR] ${errorMsg}`);
    writeStream.end();
    process.exit(1);
});

