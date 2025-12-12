#!/usr/bin/env node

/**
 * Скрипт для запуска unit тестов audit сервисов с записью логов в файл
 * Использование: node scripts/run-audit-tests-with-log.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logDir = path.join(process.cwd(), 'test-logs');
const logFile = path.join(
    logDir,
    `audit-unit-tests-${new Date().toISOString().replace(/[:.]/g, '-')}.log`,
);

// Создать директорию для логов, если её нет
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

console.log(`Запуск unit тестов для audit сервисов...`);
console.log(`Логи будут записаны в: ${logFile}\n`);

const writeStream = fs.createWriteStream(logFile, { flags: 'w' });
writeStream.write(`=== Audit Unit Tests Log ===\n`);
writeStream.write(`Date: ${new Date().toISOString()}\n`);
writeStream.write(`Command: jest --selectProjects unit audit --verbose\n`);
writeStream.write(`${'='.repeat(50)}\n\n`);

// Запустить jest
const jest = spawn(
    'npx',
    ['jest', '--selectProjects', 'unit', 'audit', '--verbose'],
    {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, NODE_ENV: 'test' },
    },
);

let stdout = '';
let stderr = '';

jest.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output); // Вывести в консоль
    writeStream.write(`[STDOUT] ${output}`); // Записать в файл
    stdout += output;
});

jest.stderr.on('data', (data) => {
    const output = data.toString();
    process.stderr.write(output); // Вывести в консоль
    writeStream.write(`[STDERR] ${output}`); // Записать в файл
    stderr += output;
});

jest.on('close', (code) => {
    writeStream.write(`\n${'='.repeat(50)}\n`);
    writeStream.write(`Exit code: ${code}\n`);
    writeStream.write(`Finished at: ${new Date().toISOString()}\n`);
    writeStream.end();

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Тесты завершены с кодом: ${code}`);
    console.log(`Логи сохранены в: ${logFile}`);
    console.log(`${'='.repeat(50)}`);

    process.exit(code);
});

jest.on('error', (error) => {
    writeStream.write(`\n[ERROR] ${error.message}\n`);
    writeStream.write(`Stack: ${error.stack}\n`);
    writeStream.end();

    console.error('Ошибка запуска jest:', error);
    process.exit(1);
});
