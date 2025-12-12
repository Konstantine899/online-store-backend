#!/usr/bin/env node

/**
 * Script to run External Role Sync tests (Этап 5: Главный сервис синхронизации) with file logging
 *
 * Runs:
 * - Unit tests: ExternalRoleSyncService, ExternalRoleSyncScheduler
 * - Integration tests: ExternalRoleSyncService with real database
 *
 * Usage:
 *   node scripts/run-external-role-sync-tests-with-log.mjs --unit
 *   node scripts/run-external-role-sync-tests-with-log.mjs --integration
 *   node scripts/run-external-role-sync-tests-with-log.mjs --unit --integration
 *   node scripts/run-external-role-sync-tests-with-log.mjs --unit --verbose
 *   node scripts/run-external-role-sync-tests-with-log.mjs --unit --coverage
 *   node scripts/run-external-role-sync-tests-with-log.mjs --watch
 *   node scripts/run-external-role-sync-tests-with-log.mjs --debug-sql
 */

import { exec, spawn } from 'child_process';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    unlinkSync,
    writeFileSync,
} from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const timestamp = new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '');
const testDir = join(process.cwd(), 'test-logs');

// Determine which tests to run
const runUnit = process.argv.includes('--unit');
const runIntegration = process.argv.includes('--integration');
const runAll = !runUnit && !runIntegration; // If not specified, run all

// Create logs directory if it doesn't exist
try {
    mkdirSync(testDir, { recursive: true });
} catch {
    // Directory already exists
}

// Test patterns
const unitTestPatterns = [
    'external-role-sync.service.unit.test',
    'external-role-sync-scheduler.service.unit.test',
];

const integrationTestPatterns = [
    'external-role-sync.service.integration.test',
    'external-role-sync-scheduler.service.integration.test',
];

/**
 * Run tests with logging
 *
 * @param {string} testType - Type of tests ('unit' or 'integration')
 * @param {string[]} patterns - Array of test file patterns
 * @return {Promise<number>} Exit code (0 for success, 1 for failure)
 */
async function runTests(testType, patterns) {
    const logFile = join(
        testDir,
        `external-role-sync-${testType}-tests-${timestamp}.log`,
    );
    const testPathPattern = patterns
        .map((p) => p.replace(/\./g, '\\.'))
        .join('|');

    console.log(
        `🚀 Running ${testType} tests for External Role Sync (Этап 5)...`,
    );
    console.log(`📝 Logs will be saved to: ${logFile}`);
    console.log(`🔍 Search pattern: ${patterns.join(', ')}\n`);

    const args = [
        '--selectProjects',
        testType,
        '--testPathPatterns',
        testPathPattern,
        '--passWithNoTests', // Не падать, если тесты не найдены
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

    if (process.argv.includes('--watch')) {
        args.push('--watch');
    }

    return new Promise((resolve) => {
        // Setup environment
        const env = {
            ...process.env,
            NODE_ENV: 'test',
            DEBUG_SQL: process.argv.includes('--debug-sql') ? 'true' : 'false',
        };

        // For Windows set UTF-8 encoding
        if (process.platform === 'win32') {
            env.CHCP = '65001';
            env.PYTHONIOENCODING = 'utf-8';
            env.LANG = 'en_US.UTF-8';
            env.LC_ALL = 'en_US.UTF-8';
        }

        // For Windows, use temp file to capture output (avoids encoding issues)
        const tempOutputFile =
            process.platform === 'win32'
                ? join(
                      testDir,
                      `jest-output-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.tmp`,
                  )
                : null;

        let stdoutBuffer = '';
        let stderrBuffer = '';
        let exitCode = 1;
        const startTime = Date.now();

        // Async IIFE to handle async operations
        (async () => {
            if (tempOutputFile && process.platform === 'win32') {
                // Use exec with output redirection to file for Windows
                const command = ['npx', 'jest', ...args]
                    .map((arg) => {
                        // Escape special characters for Windows cmd
                        if (
                            arg.includes(' ') ||
                            arg.includes('|') ||
                            arg.includes('&') ||
                            arg.includes('(') ||
                            arg.includes(')')
                        ) {
                            return `"${arg.replace(/"/g, '""')}"`;
                        }
                        return arg;
                    })
                    .join(' ');

                try {
                    // Run Jest with output redirected to temp file
                    await execAsync(`${command} > "${tempOutputFile}" 2>&1`, {
                        encoding: 'utf8',
                        maxBuffer: 10 * 1024 * 1024, // 10MB
                        env,
                        shell: true,
                    });

                    // Read output from file
                    if (existsSync(tempOutputFile)) {
                        const fileContent = readFileSync(
                            tempOutputFile,
                            'utf8',
                        );
                        stdoutBuffer = fileContent;
                        stderrBuffer = fileContent; // Jest outputs everything to stdout when redirected

                        // Output to console
                        process.stdout.write(fileContent);
                        process.stderr.write(fileContent);
                    }

                    exitCode = 0; // Will be determined from statistics
                } catch (error) {
                    // Jest failed, but we still want to read the output
                    exitCode = error.code ?? 1;

                    // Try to read output from file
                    if (existsSync(tempOutputFile)) {
                        try {
                            const fileContent = readFileSync(
                                tempOutputFile,
                                'utf8',
                            );
                            stdoutBuffer = fileContent;
                            stderrBuffer = fileContent;
                            process.stdout.write(fileContent);
                            process.stderr.write(fileContent);
                        } catch {
                            // File not readable
                        }
                    }
                } finally {
                    // Clean up temp file
                    if (tempOutputFile && existsSync(tempOutputFile)) {
                        try {
                            unlinkSync(tempOutputFile);
                        } catch {
                            // Ignore cleanup errors
                        }
                    }
                }
            } else {
                // For non-Windows, use spawn
                const jestProcess = spawn('npx', ['jest', ...args], {
                    stdio: ['ignore', 'pipe', 'pipe'],
                    shell: true,
                    env,
                });

                jestProcess.stdout?.on('data', (data) => {
                    const text = data.toString('utf8');
                    process.stdout.write(text);
                    stdoutBuffer += text;
                });

                jestProcess.stderr?.on('data', (data) => {
                    const text = data.toString('utf8');
                    process.stderr.write(text);
                    stderrBuffer += text;
                });

                // Wait for process to finish
                await new Promise((processResolve) => {
                    jestProcess.on('close', (code) => {
                        exitCode = code ?? 1;
                        processResolve();
                    });
                    jestProcess.on('error', (error) => {
                        console.error('Error spawning Jest:', error);
                        exitCode = 1;
                        processResolve();
                    });
                });
            }

            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            // Extract statistics from output
            const passedMatch =
                stdoutBuffer.match(/(\d+)\s+passed/i) ??
                stdoutBuffer.match(/(\d+)\s*✓/);
            const failedMatch =
                stdoutBuffer.match(/(\d+)\s+failed/i) ??
                stdoutBuffer.match(/(\d+)\s*✕/);
            const totalMatch = stdoutBuffer.match(/(\d+)\s+total/i);
            const noTestsMatch = stdoutBuffer.match(/No tests found/i);

            const passedCount = passedMatch
                ? passedMatch[1]
                : noTestsMatch
                  ? '0'
                  : '?';
            const failedCount = failedMatch
                ? failedMatch[1]
                : noTestsMatch
                  ? '0'
                  : '?';
            const totalCount = totalMatch
                ? totalMatch[1]
                : noTestsMatch
                  ? '0'
                  : '?';

            // Create log content
            const logContent = `=== External Role Sync ${testType.charAt(0).toUpperCase() + testType.slice(1)} Tests Execution Log ===
Date: ${new Date().toISOString()}
Command: npx jest ${args.join(' ')}
Working Directory: ${process.cwd()}
Node Version: ${process.version}
Platform: ${process.platform}
Test Type: ${testType}
============================================================

${stdoutBuffer}

${stderrBuffer ? `\n=== STDERR ===\n${stderrBuffer}\n` : ''}

============================================================
Exit Code: ${exitCode}
Duration: ${duration}s
Finished at: ${new Date().toISOString()}
============================================================

Test Results:
  Total: ${totalCount}
  Passed: ${passedCount}
  Failed: ${failedCount}
  Success Rate: ${
      totalCount !== '?' && parseInt(totalCount) > 0
          ? ((parseInt(passedCount) / parseInt(totalCount)) * 100).toFixed(1) +
            '%'
          : 'N/A'
  }

Test Files:
${patterns.map((p, i) => `  ${i + 1}. ${p}.ts`).join('\n')}

Test Coverage:
${process.argv.includes('--coverage') ? '  Coverage report generated in coverage/ directory' : '  Run with --coverage flag to generate coverage report'}
`;

            // Write log file
            try {
                writeFileSync(logFile, logContent, 'utf8');
                console.log(`\n✅ Log saved to: ${logFile}`);
            } catch (error) {
                console.error(`\n❌ Error writing log file: ${error.message}`);
            }

            // Print summary
            console.log(
                `\n============================================================`,
            );
            console.log(
                `${testType.charAt(0).toUpperCase() + testType.slice(1)} Test Summary:`,
            );
            console.log(`  Total: ${totalCount}`);
            console.log(`  Passed: ${passedCount}`);
            console.log(`  Failed: ${failedCount}`);
            console.log(`  Duration: ${duration}s`);
            if (noTestsMatch) {
                console.log(`\n⚠️  No tests found. Expected test files:`);
                patterns.forEach((pattern, i) => {
                    console.log(`  ${i + 1}. ${pattern}.ts`);
                });
                console.log(
                    `\n  Location: src/infrastructure/services/role/tests/`,
                );
                console.log(
                    `  or: src/infrastructure/services/role/external-role-sync/tests/`,
                );
            }
            console.log(
                `============================================================\n`,
            );

            resolve(exitCode);
        })().catch((error) => {
            console.error('Error in test execution:', error);
            resolve(1);
        });
    });
}

// Main execution
(async () => {
    try {
        let exitCode = 0;

        if (runAll || runUnit) {
            console.log('📦 Running unit tests...\n');
            const unitExitCode = await runTests('unit', unitTestPatterns);
            exitCode = exitCode || unitExitCode;
        }

        if (runAll || runIntegration) {
            console.log('\n📦 Running integration tests...\n');
            const integrationExitCode = await runTests(
                'integration',
                integrationTestPatterns,
            );
            exitCode = exitCode || integrationExitCode;
        }

        if (!runAll && !runUnit && !runIntegration) {
            console.log('❌ Please specify --unit, --integration, or both');
            console.log('Usage:');
            console.log(
                '  node scripts/run-external-role-sync-tests-with-log.mjs --unit',
            );
            console.log(
                '  node scripts/run-external-role-sync-tests-with-log.mjs --integration',
            );
            console.log(
                '  node scripts/run-external-role-sync-tests-with-log.mjs --unit --integration',
            );
            process.exit(1);
        }

        process.exit(exitCode);
    } catch (error) {
        console.error('Error running tests:', error);
        process.exit(1);
    }
})();
