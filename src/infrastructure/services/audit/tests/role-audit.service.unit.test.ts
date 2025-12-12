import type { AuditLogModel } from '@app/domain/models';
import { AuditAction, UserModel } from '@app/domain/models';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { getConfig } from '@app/infrastructure/config';
import { getModelToken } from '@nestjs/sequelize';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuditService, type IPaginatedAuditLogs } from '../audit.service';
import { RoleAuditCacheService } from '../role-audit-cache.service';
import { RoleAuditService } from '../role-audit.service';

// Мокируем getConfig
jest.mock('@app/infrastructure/config', () => ({
    getConfig: jest.fn(),
}));

describe('RoleAuditService (unit)', () => {
    let service: RoleAuditService;
    let auditService: jest.Mocked<AuditService>;
    let auditCacheService: jest.Mocked<RoleAuditCacheService>;
    let metricsCollector: jest.Mocked<MetricsCollector>;
    let module: TestingModule;

    const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
    } as unknown as UserModel;

    const createMockAuditLog = (
        overrides: Partial<AuditLogModel> = {},
    ): AuditLogModel => {
        const merged = {
            id: 1,
            entityType: 'role',
            entityId: 1,
            action: AuditAction.CREATE,
            userId: 1,
            oldValues: null,
            newValues: { role: 'TEST_ROLE', description: 'Test role' },
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            requestId: 'req-123',
            tenantId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: mockUser,
            ...overrides,
        };

        // Добавляем геттеры после merge, чтобы они использовали актуальные значения
        const mockLog = Object.create(
            Object.getPrototypeOf({}),
            Object.getOwnPropertyDescriptors(merged),
        ) as AuditLogModel;

        Object.defineProperty(mockLog, 'isCreateAction', {
            get() {
                return this.action === AuditAction.CREATE;
            },
        });

        Object.defineProperty(mockLog, 'isUpdateAction', {
            get() {
                return this.action === AuditAction.UPDATE;
            },
        });

        Object.defineProperty(mockLog, 'isDeleteAction', {
            get() {
                return this.action === AuditAction.DELETE;
            },
        });

        Object.defineProperty(mockLog, 'hasChanges', {
            get() {
                return this.oldValues !== null && this.newValues !== null;
            },
        });

        return mockLog;
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        // Мокируем getConfig для возврата AUDIT_CACHE_TTL_SECONDS
        (getConfig as jest.Mock).mockReturnValue({
            AUDIT_CACHE_TTL_SECONDS: 600,
        });

        const mockAuditCacheService = {
            getSummaryReport: jest.fn(),
            setSummaryReport: jest.fn(),
            getTimelineReport: jest.fn(),
            setTimelineReport: jest.fn(),
            invalidateByTenant: jest.fn(),
            invalidateTimelineReport: jest.fn(),
            getCacheStats: jest.fn().mockReturnValue({
                summary: { hits: 0, misses: 0, hitRate: 0 },
                timeline: { hits: 0, misses: 0, hitRate: 0 },
            }),
            resetStats: jest.fn(),
        };

        const mockMetricsCollector = {
            recordAuditLogCreation: jest.fn(),
            recordAuditLogCreationError: jest.fn(),
            recordAuditReportGeneration: jest.fn(),
            getAuditMetrics: jest.fn(),
        };

        module = await Test.createTestingModule({
            providers: [
                RoleAuditService,
                {
                    provide: AuditService,
                    useValue: {
                        findAll: jest.fn(),
                        findByDateRange: jest.fn(),
                        count: jest.fn(),
                        getAggregatedByAction: jest.fn(),
                        getAggregatedByEntityType: jest.fn(),
                        getTopUsersByOperations: jest.fn(),
                    },
                },
                {
                    provide: RoleAuditCacheService,
                    useValue: mockAuditCacheService,
                },
                {
                    provide: MetricsCollector,
                    useValue: mockMetricsCollector,
                },
                {
                    provide: getModelToken(UserModel),
                    useValue: {
                        findAll: jest.fn(),
                        findByPk: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<RoleAuditService>(RoleAuditService);
        auditService = module.get(AuditService);
        auditCacheService = module.get(RoleAuditCacheService);
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

    describe('getRoleAuditHistory', () => {
        it('should delegate to auditService.findAll with role filters', async () => {
            const mockResult: IPaginatedAuditLogs = {
                data: [createMockAuditLog()],
                totalCount: 1,
                currentPage: 1,
                lastPage: 1,
                limit: 20,
            };

            (auditService.findAll as jest.Mock).mockResolvedValue(mockResult);

            const result = await service.getRoleAuditHistory(1, 2, 10, 1);

            expect(auditService.findAll).toHaveBeenCalledWith(2, 10, {
                entityType: 'role',
                entityId: 1,
                tenantId: 1,
            });

            expect(result).toEqual(mockResult);
        });

        it('should handle null tenantId', async () => {
            const mockResult: IPaginatedAuditLogs = {
                data: [],
                totalCount: 0,
                currentPage: 1,
                lastPage: 1,
                limit: 20,
            };

            (auditService.findAll as jest.Mock).mockResolvedValue(mockResult);

            await service.getRoleAuditHistory(1, 1, 20, null);

            expect(auditService.findAll).toHaveBeenCalledWith(1, 20, {
                entityType: 'role',
                entityId: 1,
                tenantId: undefined,
            });
        });
    });

    describe('getUserRoleAuditHistory', () => {
        it('should combine ASSIGN and REVOKE logs and sort by date', async () => {
            const assignLog = createMockAuditLog({
                id: 1,
                action: AuditAction.ASSIGN,
                createdAt: new Date('2024-01-01'),
            });

            const revokeLog = createMockAuditLog({
                id: 2,
                action: AuditAction.REVOKE,
                createdAt: new Date('2024-01-02'),
            });

            const assignResult: IPaginatedAuditLogs = {
                data: [assignLog],
                totalCount: 1,
                currentPage: 1,
                lastPage: 1,
                limit: 20,
            };

            const revokeResult: IPaginatedAuditLogs = {
                data: [revokeLog],
                totalCount: 1,
                currentPage: 1,
                lastPage: 1,
                limit: 20,
            };

            (auditService.findAll as jest.Mock)
                .mockResolvedValueOnce(assignResult)
                .mockResolvedValueOnce(revokeResult);

            const result = await service.getUserRoleAuditHistory(1, 1, 20);

            expect(auditService.findAll).toHaveBeenCalledTimes(2);
            expect(result.totalCount).toBe(2);
            expect(result.data).toHaveLength(2);
            // Должны быть отсортированы по убыванию даты (новые первыми)
            expect(result.data[0].id).toBe(2); // revokeLog более новая
            expect(result.data[1].id).toBe(1); // assignLog более старая
        });

        it('should paginate combined results correctly', async () => {
            const logs = Array.from({ length: 30 }, (_, i) =>
                createMockAuditLog({
                    id: i + 1,
                    action:
                        i % 2 === 0 ? AuditAction.ASSIGN : AuditAction.REVOKE,
                    createdAt: new Date(2024, 0, i + 1),
                }),
            );

            const assignLogs = logs.filter(
                (l) => l.action === AuditAction.ASSIGN,
            );
            const revokeLogs = logs.filter(
                (l) => l.action === AuditAction.REVOKE,
            );

            const assignResult: IPaginatedAuditLogs = {
                data: assignLogs.slice(0, 20),
                totalCount: assignLogs.length,
                currentPage: 1,
                lastPage: 1,
                limit: 20,
            };

            const revokeResult: IPaginatedAuditLogs = {
                data: revokeLogs.slice(0, 20),
                totalCount: revokeLogs.length,
                currentPage: 1,
                lastPage: 1,
                limit: 20,
            };

            (auditService.findAll as jest.Mock)
                .mockResolvedValueOnce(assignResult)
                .mockResolvedValueOnce(revokeResult);

            const result = await service.getUserRoleAuditHistory(1, 2, 10);

            expect(result.currentPage).toBe(2);
            expect(result.limit).toBe(10);
            expect(result.data).toHaveLength(10);
        });
    });

    describe('getAuditByAction', () => {
        it('should delegate to auditService.findAll with action filter', async () => {
            const mockResult: IPaginatedAuditLogs = {
                data: [createMockAuditLog({ action: AuditAction.DELETE })],
                totalCount: 1,
                currentPage: 1,
                lastPage: 1,
                limit: 20,
            };

            (auditService.findAll as jest.Mock).mockResolvedValue(mockResult);

            const result = await service.getAuditByAction(
                AuditAction.DELETE,
                1,
                20,
                { tenantId: 1 },
            );

            expect(auditService.findAll).toHaveBeenCalledWith(1, 20, {
                action: AuditAction.DELETE,
                tenantId: 1,
            });

            expect(result).toEqual(mockResult);
        });
    });

    describe('getAuditByDateRange', () => {
        it('should delegate to auditService.findByDateRange', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const mockResult: IPaginatedAuditLogs = {
                data: [createMockAuditLog()],
                totalCount: 1,
                currentPage: 1,
                lastPage: 1,
                limit: 20,
            };

            (auditService.findByDateRange as jest.Mock).mockResolvedValue(
                mockResult,
            );

            const result = await service.getAuditByDateRange(
                startDate,
                endDate,
                1,
                20,
                { entityType: 'role' },
            );

            expect(auditService.findByDateRange).toHaveBeenCalledWith(
                startDate,
                endDate,
                1,
                20,
                { entityType: 'role' },
            );

            expect(result).toEqual(mockResult);
        });
    });

    describe('getDiff', () => {
        it('should compute diff for CREATE action', () => {
            const log = createMockAuditLog({
                action: AuditAction.CREATE,
                oldValues: null,
                newValues: {
                    role: 'TEST_ROLE',
                    description: 'Test role',
                    level: 50,
                },
            });

            const diff = service.getDiff(log);

            expect(diff.auditLogId).toBe(log.id);
            expect(diff.action).toBe(AuditAction.CREATE);
            expect(diff.hasChanges).toBe(true);
            expect(diff.diffs).toHaveLength(3);
            expect(diff.diffs[0]).toEqual({
                field: 'role',
                oldValue: null,
                newValue: 'TEST_ROLE',
                changed: true,
            });
        });

        it('should compute diff for DELETE action', () => {
            const log = createMockAuditLog({
                action: AuditAction.DELETE,
                oldValues: {
                    role: 'TEST_ROLE',
                    description: 'Test role',
                },
                newValues: null,
            });

            const diff = service.getDiff(log);

            expect(diff.action).toBe(AuditAction.DELETE);
            expect(diff.hasChanges).toBe(true);
            expect(diff.diffs).toHaveLength(2);
            expect(diff.diffs[0]).toEqual({
                field: 'role',
                oldValue: 'TEST_ROLE',
                newValue: null,
                changed: true,
            });
        });

        it('should compute diff for UPDATE action', () => {
            const log = createMockAuditLog({
                action: AuditAction.UPDATE,
                oldValues: {
                    role: 'OLD_ROLE',
                    description: 'Old description',
                    level: 50,
                },
                newValues: {
                    role: 'NEW_ROLE',
                    description: 'New description',
                    level: 50,
                },
            });

            const diff = service.getDiff(log);

            expect(diff.action).toBe(AuditAction.UPDATE);
            expect(diff.hasChanges).toBe(true);
            // Только изменённые поля должны быть в diff
            expect(diff.diffs.length).toBeGreaterThan(0);
            const roleDiff = diff.diffs.find((d) => d.field === 'role');
            expect(roleDiff).toEqual({
                field: 'role',
                oldValue: 'OLD_ROLE',
                newValue: 'NEW_ROLE',
                changed: true,
            });
        });

        it('should filter out unchanged fields', () => {
            const log = createMockAuditLog({
                action: AuditAction.UPDATE,
                oldValues: {
                    role: 'TEST_ROLE',
                    description: 'Test',
                    level: 50,
                },
                newValues: {
                    role: 'TEST_ROLE',
                    description: 'Test',
                    level: 50,
                },
            });

            const diff = service.getDiff(log);

            // Все поля одинаковые, diff должен быть пустым или только с changed: false
            const changedDiffs = diff.diffs.filter((d) => d.changed);
            expect(changedDiffs).toHaveLength(0);
            expect(diff.hasChanges).toBe(false);
        });

        it('should handle nested objects in diff', () => {
            const log = createMockAuditLog({
                action: AuditAction.UPDATE,
                oldValues: {
                    role: 'TEST_ROLE',
                    metadata: { key: 'old' },
                },
                newValues: {
                    role: 'TEST_ROLE',
                    metadata: { key: 'new' },
                },
            });

            const diff = service.getDiff(log);

            expect(diff.hasChanges).toBe(true);
            const metadataDiff = diff.diffs.find((d) => d.field === 'metadata');
            expect(metadataDiff?.changed).toBe(true);
        });
    });

    describe('getDiffForMultiple', () => {
        it('should compute diff for multiple logs', () => {
            const logs = [
                createMockAuditLog({
                    id: 1,
                    action: AuditAction.CREATE,
                    newValues: { role: 'ROLE1' },
                }),
                createMockAuditLog({
                    id: 2,
                    action: AuditAction.UPDATE,
                    oldValues: { role: 'ROLE1' },
                    newValues: { role: 'ROLE2' },
                }),
            ];

            const diffs = service.getDiffForMultiple(logs);

            expect(diffs).toHaveLength(2);
            expect(diffs[0].auditLogId).toBe(1);
            expect(diffs[1].auditLogId).toBe(2);
        });
    });

    describe('generateSummaryReport', () => {
        it('should generate summary report with statistics', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            // Мокируем агрегированные методы
            auditService.count.mockResolvedValue(3);
            auditService.getAggregatedByAction.mockResolvedValue({
                [AuditAction.CREATE]: 2,
                [AuditAction.UPDATE]: 1,
            });
            auditService.getAggregatedByEntityType.mockResolvedValue({
                role: 2,
                user_role: 1,
            });
            auditService.getTopUsersByOperations.mockResolvedValue([
                { userId: 1, operationsCount: 2 },
                { userId: 2, operationsCount: 1 },
            ]);

            // Мокируем UserModel для получения информации о пользователях
            const userModel = module.get(getModelToken(UserModel));
            (userModel.findAll as jest.Mock).mockResolvedValue([
                {
                    id: 1,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                },
                {
                    id: 2,
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'jane@example.com',
                },
            ]);

            const report = await service.generateSummaryReport(
                startDate,
                endDate,
                1,
            );

            expect(report.totalOperations).toBe(3);
            expect(report.operationsByAction[AuditAction.CREATE]).toBe(2);
            expect(report.operationsByAction[AuditAction.UPDATE]).toBe(1);
            expect(report.operationsByEntityType['role']).toBe(2);
            expect(report.operationsByEntityType['user_role']).toBe(1);
            expect(report.topUsers).toHaveLength(2);
            expect(report.topUsers[0].userId).toBe(1);
            expect(report.topUsers[0].operationsCount).toBe(2);
            // Проверяем, что PII замаскировано
            expect(report.topUsers[0].userName).toBe('Jo***oe');
            expect(report.topUsers[0].userEmail).toBe('j***@example.com');
            expect(report.dateRange.start).toBe(startDate.toISOString());
            expect(report.dateRange.end).toBe(endDate.toISOString());
            expect(report.tenantId).toBe(1);
            // Проверяем, что записана метрика времени генерации отчёта
            expect(
                metricsCollector.recordAuditReportGeneration,
            ).toHaveBeenCalledWith('summary', expect.any(Number), 1);
        });

        it('should handle multiple pages in report generation', async () => {
            // Мокируем агрегированные методы
            auditService.count.mockResolvedValue(150);
            auditService.getAggregatedByAction.mockResolvedValue({
                [AuditAction.CREATE]: 100,
                [AuditAction.UPDATE]: 50,
            });
            auditService.getAggregatedByEntityType.mockResolvedValue({
                role: 150,
            });
            auditService.getTopUsersByOperations.mockResolvedValue([]);

            // Мокируем UserModel
            const userModel = module.get(getModelToken(UserModel));
            (userModel.findAll as jest.Mock).mockResolvedValue([]);

            const report = await service.generateSummaryReport(
                new Date(),
                new Date(),
            );

            expect(report.totalOperations).toBe(150);
            expect(auditService.count).toHaveBeenCalled();
            expect(auditService.getAggregatedByAction).toHaveBeenCalled();
            expect(auditService.getAggregatedByEntityType).toHaveBeenCalled();
            expect(auditService.getTopUsersByOperations).toHaveBeenCalled();
            // Проверяем, что записана метрика времени генерации отчёта
            expect(
                metricsCollector.recordAuditReportGeneration,
            ).toHaveBeenCalledWith('summary', expect.any(Number), undefined);
        });
    });

    describe('generateTimelineReport', () => {
        it('should generate timeline report for role', async () => {
            const logs = [
                createMockAuditLog({
                    id: 1,
                    action: AuditAction.CREATE,
                    newValues: { role: 'TEST_ROLE' },
                }),
                createMockAuditLog({
                    id: 2,
                    action: AuditAction.UPDATE,
                    oldValues: { role: 'TEST_ROLE' },
                    newValues: { role: 'TEST_ROLE', description: 'Updated' },
                }),
            ];

            (auditService.findAll as jest.Mock).mockResolvedValueOnce({
                data: logs,
                totalCount: logs.length,
                currentPage: 1,
                lastPage: 1,
                limit: 100,
            });

            const timeline = await service.generateTimelineReport(1, 1);

            expect(timeline.roleId).toBe(1);
            expect(timeline.roleName).toBe('TEST_ROLE');
            expect(timeline.events).toHaveLength(2);
            expect(timeline.events[0]).toMatchObject({
                id: 1,
                action: AuditAction.CREATE,
                performedBy: {
                    userId: 1,
                    userName: 'Jo***oe', // PII замаскировано
                    userEmail: 'j***@example.com', // PII замаскировано
                },
            });
            expect(timeline.events[0].changes).toBeDefined();
            // Проверяем, что записана метрика времени генерации отчёта
            expect(
                metricsCollector.recordAuditReportGeneration,
            ).toHaveBeenCalledWith('timeline', expect.any(Number), 1);
        });

        it('should use oldValues.role if newValues.role is not available', async () => {
            const logs = [
                createMockAuditLog({
                    id: 1,
                    action: AuditAction.DELETE,
                    oldValues: { role: 'DELETED_ROLE' },
                    newValues: null,
                }),
            ];

            (auditService.findAll as jest.Mock).mockResolvedValueOnce({
                data: logs,
                totalCount: 1,
                currentPage: 1,
                lastPage: 1,
                limit: 100,
            });

            const timeline = await service.generateTimelineReport(1);

            expect(timeline.roleName).toBe('DELETED_ROLE');
        });
    });

    describe('generateUserActivityReport', () => {
        it('should generate user activity report', async () => {
            const logs = [
                createMockAuditLog({
                    id: 1,
                    action: AuditAction.ASSIGN,
                    entityType: 'user_role',
                    newValues: { roleId: 1, roleName: 'ROLE1' },
                }),
                createMockAuditLog({
                    id: 2,
                    action: AuditAction.UPDATE,
                    entityType: 'role',
                    entityId: 2,
                    newValues: { role: 'ROLE2' },
                }),
            ];

            // Мокируем count и getAggregatedByAction
            auditService.count.mockResolvedValue(2);
            auditService.getAggregatedByAction.mockResolvedValue({
                [AuditAction.ASSIGN]: 1,
                [AuditAction.UPDATE]: 1,
            });

            // Мокируем findAll для загрузки логов
            (auditService.findAll as jest.Mock).mockResolvedValueOnce({
                data: logs,
                totalCount: logs.length,
                currentPage: 1,
                lastPage: 1,
                limit: 100,
            });

            // Мокируем UserModel для получения информации о пользователе
            const userModel = module.get(getModelToken(UserModel));
            (userModel.findByPk as jest.Mock).mockResolvedValue({
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
            });

            const report = await service.generateUserActivityReport(1);

            expect(report.userId).toBe(1);
            // PII замаскировано
            expect(report.userName).toBe('Jo***oe');
            expect(report.userEmail).toBe('j***@example.com');
            expect(report.totalOperations).toBe(2);
            expect(report.operationsByAction[AuditAction.ASSIGN]).toBe(1);
            expect(report.operationsByAction[AuditAction.UPDATE]).toBe(1);
            expect(report.rolesModified).toHaveLength(2);
        });

        it('should calculate date range from logs if not provided', async () => {
            // Логи приходят отсортированными по created_at DESC (новые первыми)
            const logs = [
                createMockAuditLog({
                    id: 2,
                    createdAt: new Date('2024-12-31'),
                }),
                createMockAuditLog({
                    id: 1,
                    createdAt: new Date('2024-01-01'),
                }),
            ];

            (auditService.findAll as jest.Mock).mockResolvedValueOnce({
                data: logs,
                totalCount: logs.length,
                currentPage: 1,
                lastPage: 1,
                limit: 100,
            });

            const report = await service.generateUserActivityReport(1);

            // allLogs[0] - самый новый (end), allLogs[allLogs.length - 1] - самый старый (start)
            expect(report.dateRange.start).toBe('2024-01-01T00:00:00.000Z');
            expect(report.dateRange.end).toBe('2024-12-31T00:00:00.000Z');
        });
    });

    describe('Caching for generateSummaryReport', () => {
        it('should return cached result when cache HIT', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');
            const tenantId = 1;

            const cachedReport = {
                totalOperations: 100,
                operationsByAction: { CREATE: 50, UPDATE: 50 },
                operationsByEntityType: { role: 100 },
                topUsers: [],
                dateRange: {
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                },
                tenantId,
            };

            auditCacheService.getSummaryReport.mockResolvedValue(cachedReport);

            const result = await service.generateSummaryReport(
                startDate,
                endDate,
                tenantId,
            );

            expect(auditCacheService.getSummaryReport).toHaveBeenCalledWith(
                startDate,
                endDate,
                tenantId,
            );
            expect(result).toEqual(cachedReport);
            expect(auditService.count).not.toHaveBeenCalled();
            expect(auditService.getAggregatedByAction).not.toHaveBeenCalled();

            auditCacheService.getCacheStats.mockReturnValue({
                summary: { hits: 1, misses: 0, hitRate: 1 },
                timeline: { hits: 0, misses: 0, hitRate: 0 },
            });
            const stats = service.getCacheStats();
            expect(stats.summary.hits).toBe(1);
            expect(stats.summary.misses).toBe(0);
        });

        it('should generate and cache report when cache MISS', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-31');
            const tenantId = 1;

            auditCacheService.getSummaryReport.mockResolvedValue(null);
            auditService.count.mockResolvedValue(100);
            auditService.getAggregatedByAction.mockResolvedValue({
                CREATE: 50,
                UPDATE: 50,
            });
            auditService.getAggregatedByEntityType.mockResolvedValue({
                role: 100,
            });
            auditService.getTopUsersByOperations.mockResolvedValue([]);

            const userModel = module.get(getModelToken(UserModel));
            (userModel.findAll as jest.Mock).mockResolvedValue([]);

            const result = await service.generateSummaryReport(
                startDate,
                endDate,
                tenantId,
            );

            expect(auditCacheService.getSummaryReport).toHaveBeenCalledWith(
                startDate,
                endDate,
                tenantId,
            );
            expect(auditService.count).toHaveBeenCalled();
            expect(auditCacheService.setSummaryReport).toHaveBeenCalledWith(
                startDate,
                endDate,
                expect.any(Object),
                tenantId,
            );
            expect(result.totalOperations).toBe(100);
            // Проверяем, что записана метрика времени генерации отчёта
            expect(
                metricsCollector.recordAuditReportGeneration,
            ).toHaveBeenCalledWith('summary', expect.any(Number), tenantId);

            auditCacheService.getCacheStats.mockReturnValue({
                summary: { hits: 0, misses: 1, hitRate: 0 },
                timeline: { hits: 0, misses: 0, hitRate: 0 },
            });
            const stats = service.getCacheStats();
            expect(stats.summary.hits).toBe(0);
            expect(stats.summary.misses).toBe(1);
        });
    });

    describe('Caching for generateTimelineReport', () => {
        it('should return cached result when cache HIT', async () => {
            const roleId = 1;
            const tenantId = 1;

            const cachedReport = {
                roleId,
                roleName: 'TEST_ROLE',
                events: [],
            };

            auditCacheService.getTimelineReport.mockResolvedValue(cachedReport);

            const result = await service.generateTimelineReport(
                roleId,
                tenantId,
            );

            expect(auditCacheService.getTimelineReport).toHaveBeenCalledWith(
                roleId,
                tenantId,
            );
            expect(result).toEqual(cachedReport);
            expect(auditService.findAll).not.toHaveBeenCalled();

            auditCacheService.getCacheStats.mockReturnValue({
                summary: { hits: 0, misses: 0, hitRate: 0 },
                timeline: { hits: 1, misses: 0, hitRate: 1 },
            });
            const stats = service.getCacheStats();
            expect(stats.timeline.hits).toBe(1);
            expect(stats.timeline.misses).toBe(0);
        });

        it('should generate and cache report when cache MISS', async () => {
            const roleId = 1;
            const tenantId = 1;

            auditCacheService.getTimelineReport.mockResolvedValue(null);

            const mockLog = createMockAuditLog({
                id: 1,
                entityId: roleId,
                tenantId,
                newValues: { role: 'TEST_ROLE' },
            });

            auditService.findAll.mockResolvedValue({
                data: [mockLog],
                totalCount: 1,
                currentPage: 1,
                lastPage: 1,
                limit: 100,
            });

            const result = await service.generateTimelineReport(
                roleId,
                tenantId,
            );

            expect(auditCacheService.getTimelineReport).toHaveBeenCalledWith(
                roleId,
                tenantId,
            );
            expect(auditCacheService.setTimelineReport).toHaveBeenCalledWith(
                roleId,
                expect.objectContaining({
                    roleId,
                    roleName: 'TEST_ROLE',
                    events: expect.any(Array),
                }),
                tenantId,
            );
            expect(result.roleId).toBe(roleId);
            expect(result.roleName).toBe('TEST_ROLE');
            // Проверяем, что записана метрика времени генерации отчёта
            expect(
                metricsCollector.recordAuditReportGeneration,
            ).toHaveBeenCalledWith('timeline', expect.any(Number), tenantId);

            auditCacheService.getCacheStats.mockReturnValue({
                summary: { hits: 0, misses: 0, hitRate: 0 },
                timeline: { hits: 0, misses: 1, hitRate: 0 },
            });
            const stats = service.getCacheStats();
            expect(stats.timeline.hits).toBe(0);
            expect(stats.timeline.misses).toBe(1);
        });
    });

    describe('getCacheStats', () => {
        it('should return cache statistics from RoleAuditCacheService', () => {
            const mockStats = {
                summary: { hits: 10, misses: 5, hitRate: 0.67 },
                timeline: { hits: 8, misses: 2, hitRate: 0.8 },
            };

            auditCacheService.getCacheStats.mockReturnValue(mockStats);

            const stats = service.getCacheStats();

            expect(auditCacheService.getCacheStats).toHaveBeenCalled();
            expect(stats).toEqual(mockStats);
            expect(stats.summary.hits).toBe(10);
            expect(stats.summary.misses).toBe(5);
            expect(stats.summary.hitRate).toBe(0.67);
            expect(stats.timeline.hits).toBe(8);
            expect(stats.timeline.misses).toBe(2);
            expect(stats.timeline.hitRate).toBe(0.8);
        });
    });
});
