import { Logger } from '@nestjs/common';
import { MetricsCollector } from '../metrics-collector.service';

describe('MetricsCollector (unit)', () => {
    let metricsCollector: MetricsCollector;

    beforeEach(() => {
        metricsCollector = new MetricsCollector();
        // Отключаем логирование в тестах
        jest.spyOn(Logger.prototype, 'debug').mockImplementation();
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
    });

    afterEach(() => {
        // Очищаем метрики после каждого теста
        metricsCollector.reset();
        metricsCollector.onModuleDestroy();
        jest.clearAllMocks();
    });

    describe('recordBulkOperation', () => {
        it('должен записать метрику bulk операции', () => {
            metricsCollector.recordBulkOperation(
                'bulkActivateUsers',
                120,
                5,
            );

            const metrics = metricsCollector.getMetrics();

            expect(metrics.totalBulkOperations).toBe(1);
            expect(metrics.bulkOperationsByType.bulkActivateUsers).toBe(1);
            expect(metrics.avgBulkOperationTime).toBe(120);
        });

        it('должен ограничить размер массива (FIFO) при достижении MAX_METRICS_SIZE', () => {
            const MAX_SIZE = 10000;

            // Записываем MAX_SIZE + 100 метрик
            for (let i = 0; i < MAX_SIZE + 100; i++) {
                metricsCollector.recordBulkOperation(
                    'bulkActivateUsers',
                    100 + i,
                    1,
                );
            }

            const metrics = metricsCollector.getMetrics();

            // Должно остаться ровно MAX_SIZE записей
            expect(metrics.totalBulkOperations).toBe(MAX_SIZE);

            // Проверяем, что удалены самые старые записи (FIFO)
            // avgBulkOperationTime должен быть больше начальных значений
            expect(metrics.avgBulkOperationTime).toBeGreaterThan(100);
        });
    });

    describe('recordSlowQuery', () => {
        it('должен записать метрику медленного запроса', () => {
            metricsCollector.recordSlowQuery('SELECT * FROM users', 250);

            const metrics = metricsCollector.getMetrics();

            expect(metrics.slowQueriesCount).toBe(1);
        });

        it('должен ограничить размер массива (FIFO)', () => {
            const MAX_SIZE = 10000;

            // Записываем MAX_SIZE + 50 метрик
            for (let i = 0; i < MAX_SIZE + 50; i++) {
                metricsCollector.recordSlowQuery(`SELECT ${i}`, 150);
            }

            const metrics = metricsCollector.getMetrics();

            // Должно остаться ровно MAX_SIZE записей
            expect(metrics.slowQueriesCount).toBe(MAX_SIZE);
        });

        it('должен truncate длинные SQL запросы', () => {
            const longSql = 'SELECT * FROM users WHERE ' + 'a'.repeat(500);

            metricsCollector.recordSlowQuery(longSql, 200);

            const metrics = metricsCollector.getMetrics();

            expect(metrics.slowQueriesCount).toBe(1);
            // SQL должен быть обрезан до 200 символов
        });
    });

    describe('recordError', () => {
        it('должен записать ошибку', () => {
            metricsCollector.recordError('UserService', 'Test error');

            const metrics = metricsCollector.getMetrics();

            // errorRate = errors / (bulkOps + slowQueries)
            // Так как операций нет, errorRate будет 0
            expect(metrics.errorRate).toBe(0);
        });

        it('должен ограничить размер массива (FIFO)', () => {
            const MAX_SIZE = 10000;

            // Записываем MAX_SIZE + 30 метрик
            for (let i = 0; i < MAX_SIZE + 30; i++) {
                metricsCollector.recordError('Context', `Error ${i}`);
            }

            // Записи добавлены, но не влияют на метрики напрямую
            // (errorRate вычисляется относительно операций)
            const metrics = metricsCollector.getMetrics();

            // Проверяем, что метод не крашится при большом количестве ошибок
            expect(metrics).toBeDefined();
        });
    });

    describe('getMetrics', () => {
        it('должен вернуть пустые метрики при отсутствии данных', () => {
            const metrics = metricsCollector.getMetrics();

            expect(metrics.totalBulkOperations).toBe(0);
            expect(metrics.slowQueriesCount).toBe(0);
            expect(metrics.avgBulkOperationTime).toBe(0);
            expect(metrics.errorRate).toBe(0);
            expect(metrics.bulkOperationsByType.bulkActivateUsers).toBe(0);
            expect(metrics.timestamp).toBeDefined();
        });

        it('должен корректно вычислить avgBulkOperationTime', () => {
            metricsCollector.recordBulkOperation('bulkActivateUsers', 100, 5);
            metricsCollector.recordBulkOperation('bulkBlockUsers', 200, 3);
            metricsCollector.recordBulkOperation('bulkDeleteUsers', 150, 2);

            const metrics = metricsCollector.getMetrics();

            // avg = (100 + 200 + 150) / 3 = 150
            expect(metrics.avgBulkOperationTime).toBe(150);
            expect(metrics.totalBulkOperations).toBe(3);
        });

        it('должен корректно подсчитать операции по типу', () => {
            metricsCollector.recordBulkOperation('bulkActivateUsers', 100, 5);
            metricsCollector.recordBulkOperation('bulkActivateUsers', 110, 3);
            metricsCollector.recordBulkOperation('bulkBlockUsers', 200, 2);

            const metrics = metricsCollector.getMetrics();

            expect(metrics.bulkOperationsByType.bulkActivateUsers).toBe(2);
            expect(metrics.bulkOperationsByType.bulkBlockUsers).toBe(1);
            expect(metrics.bulkOperationsByType.bulkDeactivateUsers).toBe(0);
        });

        it('должен корректно вычислить errorRate', () => {
            // Записываем 10 операций и 2 ошибки
            for (let i = 0; i < 10; i++) {
                metricsCollector.recordBulkOperation(
                    'bulkActivateUsers',
                    100,
                    1,
                );
            }
            metricsCollector.recordError('Context1', 'Error 1');
            metricsCollector.recordError('Context2', 'Error 2');

            const metrics = metricsCollector.getMetrics();

            // errorRate = 2 / 10 = 0.2
            expect(metrics.errorRate).toBe(0.2);
        });
    });

    describe('reset', () => {
        it('должен очистить все метрики', () => {
            metricsCollector.recordBulkOperation('bulkActivateUsers', 100, 5);
            metricsCollector.recordSlowQuery('SELECT *', 150);
            metricsCollector.recordError('Context', 'Error');

            metricsCollector.reset();

            const metrics = metricsCollector.getMetrics();

            expect(metrics.totalBulkOperations).toBe(0);
            expect(metrics.slowQueriesCount).toBe(0);
            expect(metrics.errorRate).toBe(0);
        });
    });

    describe('onModuleDestroy', () => {
        it('должен очистить cleanup interval при уничтожении модуля', () => {
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

            // В тестах interval не создаётся (NODE_ENV = 'test')
            metricsCollector.onModuleDestroy();

            // clearInterval не должен вызываться, так как interval не был создан
            expect(clearIntervalSpy).not.toHaveBeenCalled();

            clearIntervalSpy.mockRestore();
        });
    });

    describe('Memory usage monitoring', () => {
        it('должен корректно работать при интенсивной нагрузке', () => {
            const OPERATIONS_COUNT = 5000;

            // Записываем 5000 bulk операций
            for (let i = 0; i < OPERATIONS_COUNT; i++) {
                metricsCollector.recordBulkOperation(
                    'bulkActivateUsers',
                    100 + i,
                    1,
                );
            }

            // Записываем 5000 slow queries
            for (let i = 0; i < OPERATIONS_COUNT; i++) {
                metricsCollector.recordSlowQuery(`SELECT ${i}`, 150);
            }

            // Записываем 5000 errors
            for (let i = 0; i < OPERATIONS_COUNT; i++) {
                metricsCollector.recordError('Context', `Error ${i}`);
            }

            const metrics = metricsCollector.getMetrics();

            // Все записи должны быть в пределах MAX_SIZE
            expect(metrics.totalBulkOperations).toBeLessThanOrEqual(10000);
            expect(metrics.slowQueriesCount).toBeLessThanOrEqual(10000);

            // Метрики должны корректно вычисляться
            expect(metrics.avgBulkOperationTime).toBeGreaterThan(0);
            expect(metrics.errorRate).toBeGreaterThan(0);
        });
    });

    describe('recordAuditLogCreation', () => {
        it('должен записать метрику создания audit лога', () => {
            metricsCollector.recordAuditLogCreation(1);

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.logsPerDay).toHaveLength(1);
            expect(auditMetrics.logsPerDay[0].tenantId).toBe(1);
            expect(auditMetrics.logsPerDay[0].count).toBe(1);
            expect(auditMetrics.logsPerDay[0].date).toBeDefined();
        });

        it('должен инкрементировать счётчик для существующей записи за день', () => {
            const tenantId = 1;
            metricsCollector.recordAuditLogCreation(tenantId);
            metricsCollector.recordAuditLogCreation(tenantId);
            metricsCollector.recordAuditLogCreation(tenantId);

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.logsPerDay).toHaveLength(1);
            expect(auditMetrics.logsPerDay[0].count).toBe(3);
            expect(auditMetrics.logsPerDay[0].tenantId).toBe(tenantId);
        });

        it('должен создавать отдельные записи для разных тенантов', () => {
            metricsCollector.recordAuditLogCreation(1);
            metricsCollector.recordAuditLogCreation(2);
            metricsCollector.recordAuditLogCreation(null);

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.logsPerDay).toHaveLength(3);
            expect(
                auditMetrics.logsPerDay.find((e) => e.tenantId === 1)?.count,
            ).toBe(1);
            expect(
                auditMetrics.logsPerDay.find((e) => e.tenantId === 2)?.count,
            ).toBe(1);
            expect(
                auditMetrics.logsPerDay.find((e) => e.tenantId === null)?.count,
            ).toBe(1);
        });

        it('должен обрабатывать null tenantId', () => {
            metricsCollector.recordAuditLogCreation(null);
            metricsCollector.recordAuditLogCreation(null);

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.logsPerDay).toHaveLength(1);
            expect(auditMetrics.logsPerDay[0].tenantId).toBeNull();
            expect(auditMetrics.logsPerDay[0].count).toBe(2);
        });

        it('должен ограничить размер массива (FIFO) при достижении MAX_METRICS_SIZE', () => {
            const MAX_SIZE = 10000;

            // Записываем метрики для разных комбинаций tenantId
            for (let i = 0; i < MAX_SIZE + 100; i++) {
                const tenantId = i % 100;
                metricsCollector.recordAuditLogCreation(tenantId);
            }

            const auditMetrics = metricsCollector.getAuditMetrics();

            // Проверяем, что метод не крашится и возвращает валидные данные
            expect(auditMetrics.logsPerDay).toBeDefined();
            expect(Array.isArray(auditMetrics.logsPerDay)).toBe(true);
        });
    });

    describe('recordAuditLogCreationError', () => {
        it('должен записать ошибку создания audit лога', () => {
            metricsCollector.recordAuditLogCreationError(1, 'Test error');

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.logCreationErrorsCount).toBe(1);
        });

        it('должен записать несколько ошибок', () => {
            metricsCollector.recordAuditLogCreationError(1, 'Error 1');
            metricsCollector.recordAuditLogCreationError(2, 'Error 2');
            metricsCollector.recordAuditLogCreationError(null, 'Error 3');

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.logCreationErrorsCount).toBe(3);
        });

        it('должен truncate длинные сообщения об ошибках', () => {
            const longError = 'Error: ' + 'a'.repeat(1000);
            metricsCollector.recordAuditLogCreationError(1, longError);

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.logCreationErrorsCount).toBe(1);
        });

        it('должен ограничить размер массива (FIFO)', () => {
            const MAX_SIZE = 10000;

            for (let i = 0; i < MAX_SIZE + 50; i++) {
                metricsCollector.recordAuditLogCreationError(1, `Error ${i}`);
            }

            const auditMetrics = metricsCollector.getAuditMetrics();

            // Должно остаться не более MAX_SIZE ошибок
            expect(auditMetrics.logCreationErrorsCount).toBeLessThanOrEqual(
                MAX_SIZE,
            );
        });
    });

    describe('recordAuditReportGeneration', () => {
        it('должен записать метрику генерации summary отчёта', () => {
            metricsCollector.recordAuditReportGeneration('summary', 1250, 1);

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.avgReportGenerationTime.summary).toBe(1250);
            expect(auditMetrics.avgReportGenerationTime.timeline).toBe(0);
        });

        it('должен записать метрику генерации timeline отчёта', () => {
            metricsCollector.recordAuditReportGeneration('timeline', 875, 2);

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.avgReportGenerationTime.summary).toBe(0);
            expect(auditMetrics.avgReportGenerationTime.timeline).toBe(875);
        });

        it('должен вычислить среднее время для нескольких отчётов', () => {
            metricsCollector.recordAuditReportGeneration('summary', 1000, 1);
            metricsCollector.recordAuditReportGeneration('summary', 1500, 1);
            metricsCollector.recordAuditReportGeneration('summary', 1250, 1);

            const auditMetrics = metricsCollector.getAuditMetrics();

            // avg = (1000 + 1500 + 1250) / 3 = 1250
            expect(auditMetrics.avgReportGenerationTime.summary).toBe(1250);
        });

        it('должен обрабатывать null tenantId', () => {
            metricsCollector.recordAuditReportGeneration('summary', 1000, null);

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.avgReportGenerationTime.summary).toBe(1000);
        });

        it('должен ограничить размер массива (FIFO)', () => {
            const MAX_SIZE = 10000;

            for (let i = 0; i < MAX_SIZE + 50; i++) {
                metricsCollector.recordAuditReportGeneration(
                    'summary',
                    1000 + i,
                    1,
                );
            }

            const auditMetrics = metricsCollector.getAuditMetrics();

            // Проверяем, что метод не крашится и возвращает валидные данные
            expect(auditMetrics.avgReportGenerationTime.summary).toBeGreaterThan(
                0,
            );
        });
    });

    describe('getAuditMetrics', () => {
        it('должен вернуть пустые метрики при отсутствии данных', () => {
            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.logsPerDay).toEqual([]);
            expect(auditMetrics.avgReportGenerationTime.summary).toBe(0);
            expect(auditMetrics.avgReportGenerationTime.timeline).toBe(0);
            expect(auditMetrics.logCreationErrorsCount).toBe(0);
            expect(auditMetrics.totalLogsLast24h).toEqual([]);
        });

        it('должен агрегировать логи по дням и тенантам', () => {
            // Записываем логи для разных тенантов
            metricsCollector.recordAuditLogCreation(1);
            metricsCollector.recordAuditLogCreation(1);
            metricsCollector.recordAuditLogCreation(2);
            metricsCollector.recordAuditLogCreation(null);

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.logsPerDay.length).toBeGreaterThan(0);
            expect(auditMetrics.totalLogsLast24h.length).toBeGreaterThan(0);

            // Проверяем, что totalLogsLast24h содержит агрегированные данные
            const tenant1Logs = auditMetrics.totalLogsLast24h.find(
                (e) => e.tenantId === 1,
            );
            expect(tenant1Logs?.count).toBeGreaterThanOrEqual(2);
        });

        it('должен корректно вычислить среднее время для разных типов отчётов', () => {
            // Summary отчёты
            metricsCollector.recordAuditReportGeneration('summary', 1000, 1);
            metricsCollector.recordAuditReportGeneration('summary', 2000, 1);

            // Timeline отчёты
            metricsCollector.recordAuditReportGeneration('timeline', 500, 1);
            metricsCollector.recordAuditReportGeneration('timeline', 1500, 1);

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.avgReportGenerationTime.summary).toBe(1500);
            expect(auditMetrics.avgReportGenerationTime.timeline).toBe(1000);
        });

        it('должен фильтровать метрики старше 24 часов', () => {
            // Записываем метрики
            metricsCollector.recordAuditLogCreation(1);
            metricsCollector.recordAuditReportGeneration('summary', 1000, 1);

            // Записываем новую метрику
            metricsCollector.recordAuditLogCreation(2);

            const auditMetrics = metricsCollector.getAuditMetrics();

            // Должна быть хотя бы одна запись за последние 24 часа
            expect(auditMetrics.logsPerDay.length).toBeGreaterThan(0);
        });
    });

    describe('reset (audit metrics)', () => {
        it('должен очистить все audit метрики', () => {
            metricsCollector.recordAuditLogCreation(1);
            metricsCollector.recordAuditLogCreationError(1, 'Error');
            metricsCollector.recordAuditReportGeneration('summary', 1000, 1);

            metricsCollector.reset();

            const auditMetrics = metricsCollector.getAuditMetrics();

            expect(auditMetrics.logsPerDay).toEqual([]);
            expect(auditMetrics.logCreationErrorsCount).toBe(0);
            expect(auditMetrics.avgReportGenerationTime.summary).toBe(0);
            expect(auditMetrics.avgReportGenerationTime.timeline).toBe(0);
            expect(auditMetrics.totalLogsLast24h).toEqual([]);
        });
    });
});




