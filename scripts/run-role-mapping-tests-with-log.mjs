#!/usr/bin/env node

/**
 * Script to run Role Mapping tests (Этап 4: Role Mapping) with file logging
 *
 * Runs:
 * - Unit tests: MappingRuleEngine, MappingRuleValidator, RoleMappingService
 *
 * Usage:
 *   node scripts/run-role-mapping-tests-with-log.mjs
 *   node scripts/run-role-mapping-tests-with-log.mjs --verbose
 *   node scripts/run-role-mapping-tests-with-log.mjs --coverage
 *   node scripts/run-role-mapping-tests-with-log.mjs --watch
 *   node scripts/run-role-mapping-tests-with-log.mjs --debug-sql
 */

import { spawn, exec } from 'child_process';
import { writeFileSync, mkdirSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const testDir = join(process.cwd(), 'test-logs');

// Create logs directory if it doesn't exist
try {
    mkdirSync(testDir, { recursive: true });
} catch (error) {
    // Directory already exists
}

// Test patterns (all unit tests for Role Mapping)
const unitTestPatterns = [
    'mapping-rule-engine.unit.test',
    'mapping-rule-validator.unit.test',
    'role-mapping.service.unit.test',
];

/**
 * Run tests with logging
 */
async function runTests() {
    const logFile = join(testDir, `role-mapping-unit-tests-${timestamp}.log`);
    const testPathPattern = unitTestPatterns.map((p) => p.replace(/\./g, '\\.')).join('|');

    console.log(`🚀 Running unit tests for Role Mapping (Этап 4)...`);
    console.log(`📝 Logs will be saved to: ${logFile}`);
    console.log(`🔍 Search pattern: ${unitTestPatterns.join(', ')}\n`);

    const args = [
        '--selectProjects',
        'unit',
        '--testPathPatterns',
        testPathPattern,
    ];

    if (process.argv.includes('--verbose')) {
        args.push('--verbose');
    }

    if (process.argv.includes('--coverage')) {
        args.push('--coverage');
    }

    if (process.argv.includes('--watch')) {
        args.push('--watch');
    }

    return new Promise(async (resolve) => {
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
        const tempOutputFile = process.platform === 'win32'
            ? join(testDir, `jest-output-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.tmp`)
            : null;

        let stdoutBuffer = '';
        let stderrBuffer = '';
        let exitCode = 1;
        const startTime = Date.now();

        if (tempOutputFile && process.platform === 'win32') {
            // Use exec with output redirection to file for Windows
            const command = ['npx', 'jest', ...args]
                .map(arg => {
                    // Escape special characters for Windows cmd
                    if (arg.includes(' ') || arg.includes('|') || arg.includes('&') || arg.includes('(') || arg.includes(')')) {
                        return `"${arg.replace(/"/g, '""')}"`;
                    }
                    return arg;
                })
                .join(' ');

            try {
                // Run Jest with output redirected to temp file
                await execAsync(
                    `${command} > "${tempOutputFile}" 2>&1`,
                    {
                        encoding: 'utf8',
                        maxBuffer: 10 * 1024 * 1024, // 10MB
                        env,
                        shell: true,
                    }
                );

                // Read output from file
                if (existsSync(tempOutputFile)) {
                    const fileContent = readFileSync(tempOutputFile, 'utf8');
                    stdoutBuffer = fileContent;
                    stderrBuffer = fileContent; // Jest outputs everything to stdout when redirected

                    // Output to console
                    process.stdout.write(fileContent);
                    process.stderr.write(fileContent);
                }

                exitCode = 0; // Will be determined from statistics
            } catch (error) {
                // Jest failed, but we still want to read the output
                exitCode = error.code || 1;

                // Try to read output from file
                if (existsSync(tempOutputFile)) {
                    try {
                        const fileContent = readFileSync(tempOutputFile, 'utf8');
                        stdoutBuffer = fileContent;
                        stderrBuffer = fileContent;
                        process.stdout.write(fileContent);
                        process.stderr.write(fileContent);
                    } catch (e) {
                        // File not readable
                    }
                }
            } finally {
                // Clean up temp file
                if (tempOutputFile && existsSync(tempOutputFile)) {
                    try {
                        unlinkSync(tempOutputFile);
                    } catch (e) {
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
        const passedMatch = stdoutBuffer.match(/(\d+)\s+passed/i) || stdoutBuffer.match(/(\d+)\s*✓/);
        const failedMatch = stdoutBuffer.match(/(\d+)\s+failed/i) || stdoutBuffer.match(/(\d+)\s*✕/);
        const totalMatch = stdoutBuffer.match(/(\d+)\s+total/i);

        const passedCount = passedMatch ? passedMatch[1] : '?';
        const failedCount = failedMatch ? failedMatch[1] : '?';
        const totalCount = totalMatch ? totalMatch[1] : '?';

        // Create log content
        const logContent = `=== Role Mapping Tests Execution Log ===
Date: ${new Date().toISOString()}
Command: npx jest ${args.join(' ')}
Working Directory: ${process.cwd()}
Node Version: ${process.version}
Platform: ${process.platform}
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
  Success Rate: ${totalCount !== '?' && parseInt(totalCount) > 0
    ? ((parseInt(passedCount) / parseInt(totalCount)) * 100).toFixed(1) + '%'
    : 'N/A'}

Test Files:
${unitTestPatterns.map((p, i) => `  ${i + 1}. ${p}.ts`).join('\n')}
`;

        // Write log file
        try {
            writeFileSync(logFile, logContent, 'utf8');
            console.log(`\n✅ Log saved to: ${logFile}`);
        } catch (error) {
            console.error(`\n❌ Error writing log file: ${error.message}`);
        }

        // Print summary
        console.log(`\n============================================================`);
        console.log(`Test Summary:`);
        console.log(`  Total: ${totalCount}`);
        console.log(`  Passed: ${passedCount}`);
        console.log(`  Failed: ${failedCount}`);
        console.log(`  Duration: ${duration}s`);
        console.log(`============================================================\n`);

        resolve(exitCode);
    });
}

// Main execution
(async () => {
    try {
        const exitCode = await runTests();
        process.exit(exitCode);
    } catch (error) {
        console.error('Error running tests:', error);
        process.exit(1);
    }
})();

