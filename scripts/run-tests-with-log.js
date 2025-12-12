#!/usr/bin/env node

/**
 * Универсальный скрипт для запуска тестов с записью логов в файл
 *
 * Использование:
 *   node scripts/run-tests-with-log.js [test-pattern] [options]
 *
 * Примеры:
 *   node scripts/run-tests-with-log.js "audit.*unit.test"
 *   node scripts/run-tests-with-log.js "audit.service.unit.test" --verbose
 *   node scripts/run-tests-with-log.js --selectProjects unit audit
 *
 * Опции:
 *   --selectProjects <project>  - выбрать проект Jest (unit/integration)
 *   --testPathPatterns <pattern> - паттерн для поиска тестов
 *   --verbose                   - подробный вывод
 *   --coverage                  - включить покрытие
 *   --watch                     - режим watch
 *   --runInBand                 - запускать последовательно
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Парсинг аргументов командной строки
const args = process.argv.slice(2);
const jestArgs = [];
let testName = 'tests';
let logPrefix = 'tests';

// Обработка аргументов
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--selectProjects' || arg === '--testPathPatterns') {
        jestArgs.push(arg, nextArg);
        if (arg === '--selectProjects') {
            testName = nextArg;
            logPrefix = nextArg;
        } else if (arg === '--testPathPatterns') {
            testName = nextArg.replace(/["']/g, '').replace(/\./g, '-');
            logPrefix = testName;
        }
        i++; // Пропустить следующий аргумент
    } else if (
        ['--verbose', '--coverage', '--watch', '--runInBand'].includes(arg)
    ) {
        jestArgs.push(arg);
    } else if (!arg.startsWith('--')) {
        // Если не опция, это паттерн тестов
        jestArgs.push('--testPathPatterns', arg);
        testName = arg.replace(/\./g, '-');
        logPrefix = testName;
    } else {
        // Передать остальные опции как есть
        jestArgs.push(arg);
        if (nextArg && !nextArg.startsWith('--')) {
            jestArgs.push(nextArg);
            i++;
        }
    }
}

// Определить тип тестов из пути или опций
if (args.some((a) => a.includes('integration'))) {
    logPrefix = 'integration-tests';
} else if (args.some((a) => a.includes('unit'))) {
    logPrefix = 'unit-tests';
}

// Создать имя файла лога
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logDir = path.join(process.cwd(), 'test-logs');
const logFile = path.join(logDir, `${logPrefix}-${timestamp}.log`);

// Создать директорию для логов, если её нет
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

console.log(`🚀 Запуск тестов...`);
console.log(`📝 Логи будут записаны в: ${logFile}\n`);

const writeStream = fs.createWriteStream(logFile, { flags: 'w' });

// Записать заголовок лога
writeStream.write(`=== Test Execution Log ===\n`);
writeStream.write(`Date: ${new Date().toISOString()}\n`);
writeStream.write(`Command: jest ${jestArgs.join(' ')}\n`);
writeStream.write(`Working Directory: ${process.cwd()}\n`);
writeStream.write(`Node Version: ${process.version}\n`);
writeStream.write(`${'='.repeat(60)}\n\n`);

// Запустить jest
const jest = spawn('npx', ['jest', ...jestArgs], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, NODE_ENV: 'test' },
});

let stdoutBuffer = '';
let stderrBuffer = '';
let testStartTime = Date.now();

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
    stderrBuffer += output;
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

    // Статистика
    const passedTests = (stdoutBuffer.match(/PASS/g) || []).length;
    const failedTests = (stdoutBuffer.match(/FAIL/g) || []).length;
    const totalTests = passedTests + failedTests;

    if (totalTests > 0) {
        writeStream.write(`\nTest Results:\n`);
        writeStream.write(`  Total: ${totalTests}\n`);
        writeStream.write(`  Passed: ${passedTests}\n`);
        writeStream.write(`  Failed: ${failedTests}\n`);
    }

    writeStream.end();

    console.log(`\n${'='.repeat(60)}`);
    if (code === 0) {
        console.log(`✅ Тесты завершены успешно!`);
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
