#!/usr/bin/env node

/**
 * Script to run LDAP/AD tests (Stage 2: LDAP/AD integration) with file logging
 *
 * Runs:
 * - Unit tests: LDAPClientService, LDAPProvider, LDAPRoleSyncService
 * - Integration tests: LDAPProvider with mock LDAP server
 *
 * Usage:
 *   node scripts/run-ldap-tests-with-log.mjs --unit
 *   node scripts/run-ldap-tests-with-log.mjs --integration
 *   node scripts/run-ldap-tests-with-log.mjs --unit --integration
 *   node scripts/run-ldap-tests-with-log.mjs --unit --verbose
 *   node scripts/run-ldap-tests-with-log.mjs --unit --coverage
 */

import { spawn, exec } from 'child_process';
import { writeFileSync, mkdirSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const testDir = join(process.cwd(), 'test-logs');

// Determine which tests to run
const runUnit = process.argv.includes('--unit');
const runIntegration = process.argv.includes('--integration');
const runAll = !runUnit && !runIntegration; // If not specified, run all

// Create logs directory if it doesn't exist
try {
    mkdirSync(testDir, { recursive: true });
} catch (error) {
    // Directory already exists
}

// Test patterns
const unitTestPatterns = [
    'ldap-client.service.unit.test',
    'ldap-provider.unit.test',
    'ldap-role-sync.service.unit.test',
];

const integrationTestPatterns = [
    'ldap-provider.integration.test',
];

/**
 * Run tests with logging
 */
async function runTests(testType, patterns) {
    const logFile = join(testDir, `ldap-${testType}-tests-${timestamp}.log`);
    const testPathPattern = patterns.map((p) => p.replace(/\./g, '\\.')).join('|');

    console.log(`🚀 Running ${testType} tests for LDAP/AD integration...`);
    console.log(`📝 Logs will be saved to: ${logFile}`);
    console.log(`🔍 Search pattern: ${patterns.join(', ')}\n`);

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
                    console.error('❌ Error starting Jest:', error);
                    exitCode = 1;
                    processResolve();
                });
            });
        }

        // Combine stdout and stderr for statistics search
        const combinedOutput = stdoutBuffer + stderrBuffer;

        // Extract statistics
        let passedCount = '0';
        let failedCount = '0';
        let totalCount = '?';

        // Main Jest pattern: "Tests: 26 failed, 14 passed, 40 total"
        const testsMatch = combinedOutput.match(/Tests:\s+(\d+)\s+(failed|passed).*?(\d+)\s+(failed|passed).*?(\d+)\s+total/i);
        if (testsMatch) {
            const [, count1, type1, count2, type2, total] = testsMatch;
            if (type1 === 'failed') {
                failedCount = count1;
                passedCount = count2;
            } else {
                passedCount = count1;
                failedCount = count2;
            }
            totalCount = total;
        } else {
            // Alternative patterns
            const passedMatch = combinedOutput.match(/(\d+)\s+passed/i);
            const failedMatch = combinedOutput.match(/(\d+)\s+failed/i);
            const totalMatch = combinedOutput.match(/(\d+)\s+total/i);

            if (passedMatch) passedCount = passedMatch[1];
            if (failedMatch) failedCount = failedMatch[1];
            if (totalMatch) totalCount = totalMatch[1];
        }

        // Clean buffers from ANSI codes for better readability in file
        const cleanStdout = stdoutBuffer
            .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI escape codes
            .replace(/\r\n/g, '\n') // Normalize line breaks
            .trim();
        const cleanStderr = stderrBuffer
            .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI escape codes
            .replace(/\r\n/g, '\n') // Normalize line breaks
            .trim();

        const logContent = `
================================================================================
LDAP/AD Integration Tests (Stage 2) - ${testType.toUpperCase()} Tests
================================================================================
Date: ${new Date().toISOString()}
Type: ${testType}
Patterns: ${patterns.join(', ')}
Command: jest ${args.join(' ')}
DEBUG_SQL: ${process.env.DEBUG_SQL || 'false'}
Platform: ${process.platform}
Node version: ${process.version}

================================================================================
TEST RESULTS
================================================================================
Total tests: ${totalCount}
✅ Passed: ${passedCount}
❌ Failed: ${failedCount}
Exit Code: ${exitCode}
${exitCode === 0 ? '✅ Tests passed successfully' : '❌ Tests completed with errors'}

================================================================================
STDOUT (full output)
================================================================================
${cleanStdout || '(empty)'}

================================================================================
STDERR (full output)
================================================================================
${cleanStderr || '(empty)'}

================================================================================
END OF LOG
================================================================================
`;

        writeFileSync(logFile, logContent, 'utf-8');

        console.log(`\n📄 Full log saved to: ${logFile}`);
        console.log(`📊 Statistics: ${passedCount}/${totalCount} tests passed`);

        resolve(exitCode);
    });
}

// Main function
async function main() {
    const results = [];

    if (runAll || runUnit) {
        const unitCode = await runTests('unit', unitTestPatterns);
        results.push({ type: 'unit', code: unitCode });
    }

    if (runAll || runIntegration) {
        const integrationCode = await runTests('integration', integrationTestPatterns);
        results.push({ type: 'integration', code: integrationCode });
    }

    // Final statistics
    console.log('\n' + '='.repeat(60));
    console.log('FINAL STATISTICS');
    console.log('='.repeat(60));

    const allPassed = results.every((r) => r.code === 0);
    results.forEach((result) => {
        const status = result.code === 0 ? '✅' : '❌';
        console.log(`${status} ${result.type.toUpperCase()}: ${result.code === 0 ? 'Success' : 'Errors'}`);
    });

    console.log('='.repeat(60));

    // Exit with error code if any test failed
    const exitCode = allPassed ? 0 : 1;
    process.exit(exitCode);
}

main().catch((error) => {
    console.error('❌ Critical error:', error);
    process.exit(1);
});
