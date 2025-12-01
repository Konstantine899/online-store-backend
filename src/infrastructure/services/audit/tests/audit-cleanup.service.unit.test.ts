import { getConfig } from '@app/infrastructure/config';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuditCleanupService } from '../audit-cleanup.service';
import { AuditService } from '../audit.service';

// Мокируем getConfig
jest.mock('@app/infrastructure/config', () => ({
    getConfig: jest.fn(),
}));

describe('AuditCleanupService (unit)', () => {
    let service: AuditCleanupService;
    let auditService: jest.Mocked<AuditService>;
    let metricsCollector: jest.Mocked<MetricsCollector>;
    let module: TestingModule;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Мокируем getConfig для возврата retention days
        (getConfig as jest.Mock).mockReturnValue({
            AUDIT_LOG_RETENTION_DAYS: 365,
        });

        const mockAuditService = {
            deleteOldLogsBatch: jest.fn(),
        };

        const mockMetricsCollector = {
            recordBulkOperation: jest.fn(),
            recordError: jest.fn(),
        };

        module = await Test.createTestingModule({
            providers: [
                AuditCleanupService,
                {
                    provide: AuditService,
                    useValue: mockAuditService,
                },
                {
                    provide: MetricsCollector,
                    useValue: mockMetricsCollector,
                },
            ],
        }).compile();

        service = module.get<AuditCleanupService>(AuditCleanupService);
        auditService = module.get(AuditService);
        metricsCollector = module.get(MetricsCollector);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    describe('cleanupOldAuditLogs', () => {
        it('должен удалить логи старше retention days', async () => {
            const retentionDays = 365;
            const deletedCount = 1500;

            (getConfig as jest.Mock).mockReturnValue({
                AUDIT_LOG_RETENTION_DAYS: retentionDays,
            });

            auditService.deleteOldLogsBatch.mockResolvedValue(deletedCount);

            await service.cleanupOldAuditLogs();

            // Проверяем, что был вызван deleteOldLogsBatch
            expect(auditService.deleteOldLogsBatch).toHaveBeenCalledTimes(1);

            // Проверяем, что cutoffDate вычислен правильно (365 дней назад)
            const callArgs = auditService.deleteOldLogsBatch.mock.calls[0][0];
            expect(callArgs).toBeInstanceOf(Date);

            const expectedCutoff = new Date(
                Date.now() - retentionDays * 24 * 60 * 60 * 1000,
            );
            // Допускаем погрешность в 1 секунду для сравнения дат
            expect(
                Math.abs(callArgs.getTime() - expectedCutoff.getTime()),
            ).toBeLessThan(1000);

            // Проверяем, что метрики записаны
            expect(metricsCollector.recordBulkOperation).toHaveBeenCalledWith(
                'cleanupAuditLogs',
                expect.any(Number), // duration
                deletedCount,
            );
        });

        it('должен использовать кастомный retention days из конфига', async () => {
            const retentionDays = 90; // 90 дней вместо default 365
            const deletedCount = 500;

            (getConfig as jest.Mock).mockReturnValue({
                AUDIT_LOG_RETENTION_DAYS: retentionDays,
            });

            auditService.deleteOldLogsBatch.mockResolvedValue(deletedCount);

            await service.cleanupOldAuditLogs();

            const callArgs = auditService.deleteOldLogsBatch.mock.calls[0][0];
            const expectedCutoff = new Date(
                Date.now() - retentionDays * 24 * 60 * 60 * 1000,
            );

            expect(
                Math.abs(callArgs.getTime() - expectedCutoff.getTime()),
            ).toBeLessThan(1000);
        });

        it('должен обработать ошибку gracefully без выбрасывания исключения', async () => {
            const error = new Error('Database connection failed');

            auditService.deleteOldLogsBatch.mockRejectedValue(error);

            // Не должно выбросить исключение
            await expect(service.cleanupOldAuditLogs()).resolves.not.toThrow();

            // Проверяем, что ошибка залогирована в метрики
            expect(metricsCollector.recordError).toHaveBeenCalledWith(
                'AuditCleanupService',
                'Database connection failed',
            );
        });

        it('должен записать метрики даже при ошибке', async () => {
            const error = new Error('Database error');

            auditService.deleteOldLogsBatch.mockRejectedValue(error);

            await service.cleanupOldAuditLogs();

            expect(metricsCollector.recordError).toHaveBeenCalled();
            // При ошибке recordBulkOperation не должен вызываться
            expect(metricsCollector.recordBulkOperation).not.toHaveBeenCalled();
        });

        it('должен обработать 0 удалённых записей корректно', async () => {
            auditService.deleteOldLogsBatch.mockResolvedValue(0);

            await service.cleanupOldAuditLogs();

            expect(auditService.deleteOldLogsBatch).toHaveBeenCalled();
            expect(metricsCollector.recordBulkOperation).toHaveBeenCalledWith(
                'cleanupAuditLogs',
                expect.any(Number),
                0,
            );
        });
    });

    describe('runManualCleanup', () => {
        it('должен удалить логи и вернуть количество', async () => {
            const deletedCount = 2000;

            auditService.deleteOldLogsBatch.mockResolvedValue(deletedCount);

            const result = await service.runManualCleanup();

            expect(result).toBe(deletedCount);
            expect(auditService.deleteOldLogsBatch).toHaveBeenCalledTimes(1);
            expect(metricsCollector.recordBulkOperation).toHaveBeenCalledWith(
                'cleanupAuditLogs',
                expect.any(Number),
                deletedCount,
            );
        });

        it('должен выбросить исключение при ошибке (в отличие от cron)', async () => {
            const error = new Error('Manual cleanup failed');

            auditService.deleteOldLogsBatch.mockRejectedValue(error);

            await expect(service.runManualCleanup()).rejects.toThrow(
                'Manual cleanup failed',
            );

            expect(metricsCollector.recordError).toHaveBeenCalled();
        });

        it('должен использовать retention days из конфига', async () => {
            const retentionDays = 180;

            (getConfig as jest.Mock).mockReturnValue({
                AUDIT_LOG_RETENTION_DAYS: retentionDays,
            });

            auditService.deleteOldLogsBatch.mockResolvedValue(0);

            await service.runManualCleanup();

            const callArgs = auditService.deleteOldLogsBatch.mock.calls[0][0];
            const expectedCutoff = new Date(
                Date.now() - retentionDays * 24 * 60 * 60 * 1000,
            );

            expect(
                Math.abs(callArgs.getTime() - expectedCutoff.getTime()),
            ).toBeLessThan(1000);
        });
    });
});

