/**
 * Performance Testing Framework - инструменты для тестирования производительности
 *
 * Назначение:
 * - Бенчмарки для критичных операций
 * - Нагрузочное тестирование API endpoints
 * - Мониторинг производительности в CI
 * - Автоматическое выявление регрессий
 *
 * Использование:
 * ```typescript
 * import { PerformanceTesting } from '../utils/performance-testing';
 *
 * await PerformanceTesting.benchmark('cart-operation', async () => {
 *     await cartService.addToCart(productId, quantity);
 * });
 * ```
 */

import { Logger } from '@nestjs/common';

/**
 * Результат бенчмарка
 */
export interface BenchmarkResult {
    name: string;
    duration: number;
    iterations: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    throughput: number; // операций в секунду
    memoryUsage?: NodeJS.MemoryUsage;
    timestamp: Date;
}

/**
 * Конфигурация бенчмарка
 */
export interface BenchmarkConfig {
    iterations?: number;
    warmupIterations?: number;
    timeout?: number;
    memoryTracking?: boolean;
    threshold?: {
        maxAverageDuration?: number;
        maxMemoryUsage?: number;
    };
}

/**
 * Результат нагрузочного теста
 */
export interface LoadTestResult {
    name: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    duration: number;
    timestamp: Date;
}

/**
 * Конфигурация нагрузочного теста
 */
export interface LoadTestConfig {
    concurrentUsers: number;
    duration: number; // в миллисекундах
    rampUpTime?: number; // время наращивания нагрузки
    timeout?: number;
}

/**
 * Класс для тестирования производительности
 */
export class PerformanceTesting {
    private static logger = new Logger(PerformanceTesting.name);
    private static results: BenchmarkResult[] = [];
    private static loadTestResults: LoadTestResult[] = [];

    /**
     * Выполняет бенчмарк операции
     */
    static async benchmark<T>(
        name: string,
        operation: () => Promise<T>,
        config: BenchmarkConfig = {},
    ): Promise<BenchmarkResult> {
        const {
            iterations = 100,
            warmupIterations = 10,
            timeout = 30000,
            memoryTracking = false,
            threshold = {},
        } = config;

        this.logger.log(`Starting benchmark: ${name}`);

        // Прогрев
        if (warmupIterations > 0) {
            this.logger.debug(`Warming up with ${warmupIterations} iterations`);
            for (let i = 0; i < warmupIterations; i++) {
                await operation();
            }
        }

        const durations: number[] = [];
        const startTime = process.hrtime.bigint();
        let memoryBefore: NodeJS.MemoryUsage | undefined;

        if (memoryTracking) {
            memoryBefore = process.memoryUsage();
        }

        // Основные итерации
        for (let i = 0; i < iterations; i++) {
            const iterationStart = process.hrtime.bigint();

            try {
                await Promise.race([
                    operation(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), timeout),
                    ),
                ]);
            } catch (error) {
                this.logger.error(`Benchmark iteration ${i} failed:`, error);
                throw error;
            }

            const iterationEnd = process.hrtime.bigint();
            const duration = Number(iterationEnd - iterationStart) / 1_000_000; // в миллисекундах
            durations.push(duration);
        }

        const endTime = process.hrtime.bigint();
        const totalDuration = Number(endTime - startTime) / 1_000_000;

        const result: BenchmarkResult = {
            name,
            duration: totalDuration,
            iterations,
            averageDuration:
                durations.reduce((a, b) => a + b, 0) / durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            throughput: (iterations / totalDuration) * 1000, // операций в секунду
            memoryUsage: memoryTracking ? process.memoryUsage() : undefined,
            timestamp: new Date(),
        };

        // Проверка пороговых значений
        if (
            threshold.maxAverageDuration &&
            result.averageDuration > threshold.maxAverageDuration
        ) {
            this.logger.warn(
                `Benchmark ${name}: average duration ${result.averageDuration}ms exceeds threshold ${threshold.maxAverageDuration}ms`,
            );
        }

        if (threshold.maxMemoryUsage && memoryBefore && result.memoryUsage) {
            const memoryIncrease =
                result.memoryUsage.heapUsed - memoryBefore.heapUsed;
            if (memoryIncrease > threshold.maxMemoryUsage) {
                this.logger.warn(
                    `Benchmark ${name}: memory increase ${memoryIncrease} bytes exceeds threshold ${threshold.maxMemoryUsage} bytes`,
                );
            }
        }

        this.results.push(result);
        this.logger.log(
            `Benchmark ${name} completed: ${result.averageDuration.toFixed(2)}ms average`,
        );

        return result;
    }

    /**
     * Выполняет нагрузочный тест API endpoint
     */
    static async loadTest<T>(
        name: string,
        request: () => Promise<T>,
        config: LoadTestConfig,
    ): Promise<LoadTestResult> {
        const {
            concurrentUsers,
            duration,
            rampUpTime = 0,
            timeout = 10000,
        } = config;

        this.logger.log(
            `Starting load test: ${name} with ${concurrentUsers} concurrent users`,
        );

        const startTime = Date.now();
        const results: Array<{ success: boolean; duration: number }> = [];
        let activeUsers = 0;

        // Функция для выполнения запроса
        const executeRequest = async (): Promise<void> => {
            const requestStart = Date.now();
            try {
                await Promise.race([
                    request(),
                    new Promise((_, reject) =>
                        setTimeout(
                            () => reject(new Error('Request timeout')),
                            timeout,
                        ),
                    ),
                ]);
                const requestDuration = Date.now() - requestStart;
                results.push({ success: true, duration: requestDuration });
            } catch (error) {
                const requestDuration = Date.now() - requestStart;
                results.push({ success: false, duration: requestDuration });
            }
        };

        // Функция для пользователя
        const userLoop = async (): Promise<void> => {
            activeUsers++;
            while (Date.now() - startTime < duration) {
                await executeRequest();
                // Небольшая задержка между запросами
                await new Promise((resolve) =>
                    setTimeout(resolve, Math.random() * 100),
                );
            }
            activeUsers--;
        };

        // Постепенное наращивание нагрузки
        if (rampUpTime > 0) {
            const rampUpInterval = rampUpTime / concurrentUsers;
            for (let i = 0; i < concurrentUsers; i++) {
                setTimeout(() => userLoop(), i * rampUpInterval);
            }
        } else {
            // Мгновенный старт всех пользователей
            const promises = Array(concurrentUsers)
                .fill(null)
                .map(() => userLoop());
            await Promise.all(promises);
        }

        const totalDuration = Date.now() - startTime;
        const successfulRequests = results.filter((r) => r.success).length;
        const failedRequests = results.length - successfulRequests;
        const durations = results.map((r) => r.duration);

        const result: LoadTestResult = {
            name,
            totalRequests: results.length,
            successfulRequests,
            failedRequests,
            averageResponseTime:
                durations.reduce((a, b) => a + b, 0) / durations.length,
            minResponseTime: Math.min(...durations),
            maxResponseTime: Math.max(...durations),
            requestsPerSecond: (results.length / totalDuration) * 1000,
            errorRate: (failedRequests / results.length) * 100,
            duration: totalDuration,
            timestamp: new Date(),
        };

        this.loadTestResults.push(result);
        this.logger.log(
            `Load test ${name} completed: ${result.requestsPerSecond.toFixed(2)} req/s, ${result.errorRate.toFixed(2)}% errors`,
        );

        return result;
    }

    /**
     * Получает все результаты бенчмарков
     */
    static getBenchmarkResults(): BenchmarkResult[] {
        return [...this.results];
    }

    /**
     * Получает все результаты нагрузочных тестов
     */
    static getLoadTestResults(): LoadTestResult[] {
        return [...this.loadTestResults];
    }

    /**
     * Очищает все результаты
     */
    static clearResults(): void {
        this.results = [];
        this.loadTestResults = [];
    }

    /**
     * Генерирует отчет о производительности
     */
    static generateReport(): string {
        const benchmarkResults = this.getBenchmarkResults();
        const loadTestResults = this.getLoadTestResults();

        let report = '# Performance Test Report\n\n';
        report += `Generated at: ${new Date().toISOString()}\n\n`;

        if (benchmarkResults.length > 0) {
            report += '## Benchmark Results\n\n';
            report +=
                '| Name | Average (ms) | Min (ms) | Max (ms) | Throughput (ops/s) |\n';
            report +=
                '|------|--------------|----------|----------|-------------------|\n';

            benchmarkResults.forEach((result) => {
                report += `| ${result.name} | ${result.averageDuration.toFixed(2)} | ${result.minDuration.toFixed(2)} | ${result.maxDuration.toFixed(2)} | ${result.throughput.toFixed(2)} |\n`;
            });
            report += '\n';
        }

        if (loadTestResults.length > 0) {
            report += '## Load Test Results\n\n';
            report +=
                '| Name | RPS | Avg Response (ms) | Error Rate (%) | Total Requests |\n';
            report +=
                '|------|-----|-------------------|----------------|----------------|\n';

            loadTestResults.forEach((result) => {
                report += `| ${result.name} | ${result.requestsPerSecond.toFixed(2)} | ${result.averageResponseTime.toFixed(2)} | ${result.errorRate.toFixed(2)} | ${result.totalRequests} |\n`;
            });
            report += '\n';
        }

        return report;
    }

    /**
     * Сравнивает результаты с предыдущими (для CI)
     */
    static compareWithBaseline(baselineResults: BenchmarkResult[]): void {
        const currentResults = this.getBenchmarkResults();

        baselineResults.forEach((baseline) => {
            const current = currentResults.find(
                (r) => r.name === baseline.name,
            );
            if (!current) {
                this.logger.warn(
                    `No current result found for baseline: ${baseline.name}`,
                );
                return;
            }

            const performanceChange =
                ((current.averageDuration - baseline.averageDuration) /
                    baseline.averageDuration) *
                100;

            if (Math.abs(performanceChange) > 10) {
                // 10% изменение
                if (performanceChange > 0) {
                    this.logger.error(
                        `Performance regression in ${baseline.name}: ${performanceChange.toFixed(2)}% slower`,
                    );
                } else {
                    this.logger.log(
                        `Performance improvement in ${baseline.name}: ${Math.abs(performanceChange).toFixed(2)}% faster`,
                    );
                }
            }
        });
    }
}

/**
 * Декоратор для автоматического бенчмарка методов
 */
export function Benchmark(name?: string, config?: BenchmarkConfig) {
    return function (
        target: any,
        propertyName: string,
        descriptor: PropertyDescriptor,
    ) {
        const method = descriptor.value;
        const benchmarkName =
            name || `${target.constructor.name}.${propertyName}`;

        descriptor.value = async function (...args: any[]) {
            const result = await PerformanceTesting.benchmark(
                benchmarkName,
                () => method.apply(this, args),
                config,
            );
            return result;
        };
    };
}

/**
 * Утилиты для создания тестовых данных для нагрузочного тестирования
 */
export class LoadTestDataFactory {
    /**
     * Создает массив пользователей для нагрузочного тестирования
     */
    static createUsers(count: number): Array<{ email: string; phone: string }> {
        return Array(count)
            .fill(null)
            .map((_, index) => ({
                email: `loadtest${index}@example.com`,
                phone: `+7999${String(index).padStart(7, '0')}`,
            }));
    }

    /**
     * Создает массив товаров для нагрузочного тестирования
     */
    static createProducts(
        count: number,
    ): Array<{ name: string; price: number }> {
        return Array(count)
            .fill(null)
            .map((_, index) => ({
                name: `Load Test Product ${index}`,
                price: Math.floor(Math.random() * 10000) + 100,
            }));
    }

    /**
     * Создает случайные данные для корзины
     */
    static createCartData(): { productId: number; quantity: number } {
        return {
            productId: Math.floor(Math.random() * 100) + 1,
            quantity: Math.floor(Math.random() * 5) + 1,
        };
    }
}
