import type { AuditLogModel, UserModel } from '@app/domain/models';
import { AuditAction } from '@app/domain/models';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuditService, type IPaginatedAuditLogs } from '../audit.service';
import { RoleAuditService } from '../role-audit.service';

describe('RoleAuditService (unit)', () => {
    let service: RoleAuditService;
    let auditService: jest.Mocked<AuditService>;
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

        module = await Test.createTestingModule({
            providers: [
                RoleAuditService,
                {
                    provide: AuditService,
                    useValue: {
                        findAll: jest.fn(),
                        findByDateRange: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<RoleAuditService>(RoleAuditService);
        auditService = module.get(AuditService);
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
            const logs = [
                createMockAuditLog({
                    id: 1,
                    action: AuditAction.CREATE,
                    entityType: 'role',
                    userId: 1,
                }),
                createMockAuditLog({
                    id: 2,
                    action: AuditAction.UPDATE,
                    entityType: 'role',
                    userId: 1,
                }),
                createMockAuditLog({
                    id: 3,
                    action: AuditAction.CREATE,
                    entityType: 'user_role',
                    userId: 2,
                }),
            ];

            // Мокируем несколько вызовов findAll для пагинации
            (auditService.findAll as jest.Mock).mockResolvedValueOnce({
                data: logs,
                totalCount: logs.length,
                currentPage: 1,
                lastPage: 1,
                limit: 100,
            });

            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

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
            expect(report.dateRange.start).toBe(startDate.toISOString());
            expect(report.dateRange.end).toBe(endDate.toISOString());
            expect(report.tenantId).toBe(1);
        });

        it('should handle multiple pages in report generation', async () => {
            const page1Logs = Array.from({ length: 100 }, (_, i) =>
                createMockAuditLog({
                    id: i + 1,
                    action: AuditAction.CREATE,
                }),
            );

            const page2Logs = Array.from({ length: 50 }, (_, i) =>
                createMockAuditLog({
                    id: i + 101,
                    action: AuditAction.UPDATE,
                }),
            );

            (auditService.findAll as jest.Mock)
                .mockResolvedValueOnce({
                    data: page1Logs,
                    totalCount: 150,
                    currentPage: 1,
                    lastPage: 2,
                    limit: 100,
                })
                .mockResolvedValueOnce({
                    data: page2Logs,
                    totalCount: 150,
                    currentPage: 2,
                    lastPage: 2,
                    limit: 100,
                });

            const report = await service.generateSummaryReport(
                new Date(),
                new Date(),
            );

            expect(report.totalOperations).toBe(150);
            expect(auditService.findAll).toHaveBeenCalledTimes(2);
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
                    userName: 'John Doe',
                    userEmail: 'john@example.com',
                },
            });
            expect(timeline.events[0].changes).toBeDefined();
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

            (auditService.findAll as jest.Mock).mockResolvedValueOnce({
                data: logs,
                totalCount: logs.length,
                currentPage: 1,
                lastPage: 1,
                limit: 100,
            });

            const report = await service.generateUserActivityReport(1);

            expect(report.userId).toBe(1);
            expect(report.userName).toBe('John Doe');
            expect(report.userEmail).toBe('john@example.com');
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
});
