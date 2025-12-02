import type { UserModel } from '@app/domain/models';
import { AuditAction, AuditLogModel } from '@app/domain/models';
import { getModelToken } from '@nestjs/sequelize';
import { Test, type TestingModule } from '@nestjs/testing';
import { Op } from 'sequelize';
import { AuditService, type IAuditFilters } from '../audit.service';
import { RoleAuditCacheService } from '../role-audit-cache.service';

interface MockSequelizeInstance {
    query: jest.Mock;
}

describe('AuditService (unit)', () => {
    let service: AuditService;
    let auditLogModel: jest.Mocked<typeof AuditLogModel>;
    let auditCacheService: jest.Mocked<RoleAuditCacheService>;
    let module: TestingModule;

    const mockAuditLog = {
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
        user: null,
    } as unknown as AuditLogModel;

    const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
    } as unknown as UserModel;

    const createMockAuditLog = (
        overrides: Partial<typeof mockAuditLog> = {},
    ): AuditLogModel =>
        ({
            ...mockAuditLog,
            ...overrides,
        }) as AuditLogModel;

    beforeEach(async () => {
        jest.clearAllMocks();

        const mockAuditCacheService = {
            getSummaryReport: jest.fn(),
            setSummaryReport: jest.fn(),
            getTimelineReport: jest.fn(),
            setTimelineReport: jest.fn(),
            invalidateByTenant: jest.fn(),
            invalidateTimelineReport: jest.fn(),
            getCacheStats: jest.fn(),
            resetStats: jest.fn(),
        };

        module = await Test.createTestingModule({
            providers: [
                AuditService,
                {
                    provide: getModelToken(AuditLogModel),
                    useValue: {
                        create: jest.fn(),
                        findAll: jest.fn(),
                        findAndCountAll: jest.fn(),
                        findByPk: jest.fn(),
                        count: jest.fn(),
                        destroy: jest.fn(),
                    },
                },
                {
                    provide: RoleAuditCacheService,
                    useValue: mockAuditCacheService,
                },
            ],
        }).compile();

        service = module.get<AuditService>(AuditService);
        auditLogModel = module.get(getModelToken(AuditLogModel));
        auditCacheService = module.get(RoleAuditCacheService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    describe('createLog', () => {
        it('should create audit log successfully', async () => {
            const data = {
                entityType: 'role',
                entityId: 1,
                action: AuditAction.CREATE,
                userId: 1,
                tenantId: 1,
                newValues: { role: 'TEST_ROLE' },
            };

            (auditLogModel.create as jest.Mock).mockResolvedValue(
                createMockAuditLog(data),
            );

            const result = await service.createLog(data);

            expect(auditLogModel.create).toHaveBeenCalledWith(data);
            expect(result).toEqual(expect.objectContaining(data));
        });

        it('should throw error when creation fails', async () => {
            const data = {
                entityType: 'role',
                entityId: 1,
                action: AuditAction.CREATE,
                userId: 1,
            };

            const error = new Error('Database error');
            (auditLogModel.create as jest.Mock).mockRejectedValue(error);

            await expect(service.createLog(data)).rejects.toThrow(error);
            expect(auditLogModel.create).toHaveBeenCalledWith(data);
            // Инвалидация кэша не должна вызываться при ошибке
            expect(auditCacheService.invalidateByTenant).not.toHaveBeenCalled();
        });

        it('should invalidate cache after creating log with tenantId', async () => {
            const data = {
                entityType: 'role',
                entityId: 1,
                action: AuditAction.CREATE,
                userId: 1,
                tenantId: 1,
            };

            auditCacheService.invalidateByTenant.mockResolvedValue(2);

            (auditLogModel.create as jest.Mock).mockResolvedValue(
                createMockAuditLog(data),
            );

            await service.createLog(data);

            expect(auditCacheService.invalidateByTenant).toHaveBeenCalledWith(
                1,
            );
        });

        it('should invalidate all audit cache when tenantId is null', async () => {
            const data = {
                entityType: 'role',
                entityId: 1,
                action: AuditAction.CREATE,
                userId: 1,
                tenantId: null,
            };

            auditCacheService.invalidateByTenant.mockResolvedValue(5);

            (auditLogModel.create as jest.Mock).mockResolvedValue(
                createMockAuditLog(data),
            );

            await service.createLog(data);

            expect(auditCacheService.invalidateByTenant).toHaveBeenCalledWith(
                null,
            );
        });

        it('should invalidate all audit cache when tenantId is undefined', async () => {
            const data = {
                entityType: 'role',
                entityId: 1,
                action: AuditAction.CREATE,
                userId: 1,
            };

            auditCacheService.invalidateByTenant.mockResolvedValue(3);

            (auditLogModel.create as jest.Mock).mockResolvedValue(
                createMockAuditLog(data),
            );

            await service.createLog(data);

            expect(auditCacheService.invalidateByTenant).toHaveBeenCalledWith(
                undefined,
            );
        });

        it('should handle cache invalidation errors gracefully', async () => {
            const data = {
                entityType: 'role',
                entityId: 1,
                action: AuditAction.CREATE,
                userId: 1,
                tenantId: 1,
            };

            // RoleAuditCacheService.invalidateByTenant обрабатывает ошибки внутри и возвращает 0
            // Проверяем, что лог создаётся даже если инвалидация возвращает 0 (ошибка обработана)
            auditCacheService.invalidateByTenant.mockResolvedValue(0);

            (auditLogModel.create as jest.Mock).mockResolvedValue(
                createMockAuditLog(data),
            );

            // Лог должен быть создан успешно
            const result = await service.createLog(data);

            expect(result).toEqual(expect.objectContaining(data));
            expect(auditCacheService.invalidateByTenant).toHaveBeenCalledWith(
                1,
            );
        });
    });

    describe('findAll', () => {
        it('should return paginated audit logs without filters', async () => {
            const mockResult = {
                rows: [createMockAuditLog(), createMockAuditLog({ id: 2 })],
                count: 2,
            };

            (auditLogModel.findAndCountAll as jest.Mock).mockResolvedValue(
                mockResult,
            );

            const result = await service.findAll(1, 20);

            expect(auditLogModel.findAndCountAll).toHaveBeenCalledWith({
                where: {},
                limit: 20,
                offset: 0,
                order: [['created_at', 'DESC']],
                include: [
                    {
                        association: 'user',
                        attributes: ['id', 'firstName', 'lastName', 'email'],
                    },
                ],
            });

            expect(result).toEqual({
                data: mockResult.rows,
                totalCount: 2,
                currentPage: 1,
                lastPage: 1,
                limit: 20,
            });
        });

        it('should apply filters correctly', async () => {
            const filters: IAuditFilters = {
                action: AuditAction.UPDATE,
                entityType: 'role',
                entityId: 1,
                userId: 1,
                tenantId: 1,
                requestId: 'req-123',
            };

            const mockResult = {
                rows: [createMockAuditLog()],
                count: 1,
            };

            (auditLogModel.findAndCountAll as jest.Mock).mockResolvedValue(
                mockResult,
            );

            await service.findAll(1, 20, filters);

            expect(auditLogModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        action: AuditAction.UPDATE,
                        entityType: 'role',
                        entityId: 1,
                        userId: 1,
                        tenantId: 1,
                        requestId: 'req-123',
                    },
                }),
            );
        });

        it('should apply date range filters', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const filters: IAuditFilters = {
                startDate,
                endDate,
            };

            const mockResult = {
                rows: [],
                count: 0,
            };

            (auditLogModel.findAndCountAll as jest.Mock).mockResolvedValue(
                mockResult,
            );

            await service.findAll(1, 20, filters);

            expect(auditLogModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        createdAt: {
                            [Op.gte]: startDate,
                            [Op.lte]: endDate,
                        },
                    },
                }),
            );
        });

        it('should calculate pagination correctly', async () => {
            const mockResult = {
                rows: [],
                count: 100,
            };

            (auditLogModel.findAndCountAll as jest.Mock).mockResolvedValue(
                mockResult,
            );

            const result = await service.findAll(3, 20);

            expect(auditLogModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 20,
                    offset: 40, // (3 - 1) * 20
                }),
            );

            expect(result.lastPage).toBe(5); // Math.ceil(100 / 20)
        });

        it('should include user association', async () => {
            const mockResult = {
                rows: [createMockAuditLog({ user: mockUser })],
                count: 1,
            };

            (auditLogModel.findAndCountAll as jest.Mock).mockResolvedValue(
                mockResult,
            );

            await service.findAll();

            expect(auditLogModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: [
                        {
                            association: 'user',
                            attributes: [
                                'id',
                                'firstName',
                                'lastName',
                                'email',
                            ],
                        },
                    ],
                }),
            );
        });
    });

    describe('findById', () => {
        it('should return audit log when found', async () => {
            (auditLogModel.findByPk as jest.Mock).mockResolvedValue(
                createMockAuditLog(),
            );

            const result = await service.findById(1);

            expect(auditLogModel.findByPk).toHaveBeenCalledWith(1, {
                include: [
                    {
                        association: 'user',
                        attributes: ['id', 'firstName', 'lastName', 'email'],
                    },
                ],
            });

            expect(result).toEqual(createMockAuditLog());
        });

        it('should return null when not found', async () => {
            (auditLogModel.findByPk as jest.Mock).mockResolvedValue(null);

            const result = await service.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('findByEntity', () => {
        it('should delegate to findAll with entity filters', async () => {
            const mockResult = {
                rows: [createMockAuditLog()],
                count: 1,
            };

            (auditLogModel.findAndCountAll as jest.Mock).mockResolvedValue(
                mockResult,
            );

            const result = await service.findByEntity('role', 1, 2, 10);

            expect(auditLogModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        entityType: 'role',
                        entityId: 1,
                    },
                    limit: 10,
                    offset: 10, // (2 - 1) * 10
                }),
            );

            expect(result.data).toEqual(mockResult.rows);
        });
    });

    describe('findByUser', () => {
        it('should delegate to findAll with user filter', async () => {
            const mockResult = {
                rows: [createMockAuditLog()],
                count: 1,
            };

            (auditLogModel.findAndCountAll as jest.Mock).mockResolvedValue(
                mockResult,
            );

            const result = await service.findByUser(1, 1, 20, {
                action: AuditAction.CREATE,
            });

            expect(auditLogModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        userId: 1,
                        action: AuditAction.CREATE,
                    },
                }),
            );

            expect(result.data).toEqual(mockResult.rows);
        });
    });

    describe('findByAction', () => {
        it('should delegate to findAll with action filter', async () => {
            const mockResult = {
                rows: [createMockAuditLog()],
                count: 1,
            };

            (auditLogModel.findAndCountAll as jest.Mock).mockResolvedValue(
                mockResult,
            );

            const result = await service.findByAction(
                AuditAction.DELETE,
                1,
                20,
                { tenantId: 1 },
            );

            expect(auditLogModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        action: AuditAction.DELETE,
                        tenantId: 1,
                    },
                }),
            );

            expect(result.data).toEqual(mockResult.rows);
        });
    });

    describe('findByDateRange', () => {
        it('should delegate to findAll with date range filters', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const mockResult = {
                rows: [createMockAuditLog()],
                count: 1,
            };

            (auditLogModel.findAndCountAll as jest.Mock).mockResolvedValue(
                mockResult,
            );

            const result = await service.findByDateRange(
                startDate,
                endDate,
                1,
                20,
                { entityType: 'role' },
            );

            expect(auditLogModel.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        entityType: 'role',
                        createdAt: {
                            [Op.gte]: startDate,
                            [Op.lte]: endDate,
                        },
                    },
                }),
            );

            expect(result.data).toEqual(mockResult.rows);
        });
    });

    describe('count', () => {
        it('should return count without filters', async () => {
            (auditLogModel.count as jest.Mock).mockResolvedValue(42);

            const result = await service.count();

            expect(auditLogModel.count).toHaveBeenCalledWith({ where: {} });
            expect(result).toBe(42);
        });

        it('should return count with filters', async () => {
            const filters: IAuditFilters = {
                action: AuditAction.UPDATE,
                tenantId: 1,
            };

            (auditLogModel.count as jest.Mock).mockResolvedValue(10);

            const result = await service.count(filters);

            expect(auditLogModel.count).toHaveBeenCalledWith({
                where: {
                    action: AuditAction.UPDATE,
                    tenantId: 1,
                },
            });

            expect(result).toBe(10);
        });
    });

    describe('getAggregatedByAction', () => {
        it('should return aggregated operations by action', async () => {
            const filters: IAuditFilters = {
                tenantId: 1,
            };

            const mockResults = [
                { action: AuditAction.CREATE, count: '10' },
                { action: AuditAction.UPDATE, count: '5' },
            ];

            (auditLogModel.findAll as jest.Mock).mockResolvedValue(mockResults);

            const result = await service.getAggregatedByAction(filters);

            expect(auditLogModel.findAll).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    tenantId: 1,
                }),
                attributes: ['action', expect.any(Array)],
                group: ['action'],
                raw: true,
            });

            expect(result[AuditAction.CREATE]).toBe(10);
            expect(result[AuditAction.UPDATE]).toBe(5);
            // Все остальные действия должны быть 0
            expect(result[AuditAction.DELETE]).toBe(0);
            expect(result[AuditAction.ASSIGN]).toBe(0);
            expect(result[AuditAction.REVOKE]).toBe(0);
        });

        it('should return empty results when no logs found', async () => {
            (auditLogModel.findAll as jest.Mock).mockResolvedValue([]);

            const result = await service.getAggregatedByAction();

            expect(auditLogModel.findAll).toHaveBeenCalledWith({
                where: {},
                attributes: ['action', expect.any(Array)],
                group: ['action'],
                raw: true,
            });

            // Все действия должны быть 0
            Object.values(AuditAction).forEach((action) => {
                expect(result[action]).toBe(0);
            });
        });

        it('should handle date range filters', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');
            const filters: IAuditFilters = {
                startDate,
                endDate,
            };

            (auditLogModel.findAll as jest.Mock).mockResolvedValue([
                { action: AuditAction.CREATE, count: '3' },
            ]);

            await service.getAggregatedByAction(filters);

            expect(auditLogModel.findAll).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    createdAt: {
                        [Op.gte]: startDate,
                        [Op.lte]: endDate,
                    },
                }),
                attributes: ['action', expect.any(Array)],
                group: ['action'],
                raw: true,
            });
        });
    });

    describe('getAggregatedByEntityType', () => {
        it('should return aggregated operations by entity type', async () => {
            const filters: IAuditFilters = {
                tenantId: 1,
            };

            const mockResults = [
                { entityType: 'role', count: '15' },
                { entityType: 'user_role', count: '8' },
            ];

            (auditLogModel.findAll as jest.Mock).mockResolvedValue(mockResults);

            const result = await service.getAggregatedByEntityType(filters);

            expect(auditLogModel.findAll).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    tenantId: 1,
                }),
                attributes: ['entityType', expect.any(Array)],
                group: ['entityType'],
                raw: true,
            });

            expect(result['role']).toBe(15);
            expect(result['user_role']).toBe(8);
        });

        it('should return empty results when no logs found', async () => {
            (auditLogModel.findAll as jest.Mock).mockResolvedValue([]);

            const result = await service.getAggregatedByEntityType();

            expect(auditLogModel.findAll).toHaveBeenCalledWith({
                where: {},
                attributes: ['entityType', expect.any(Array)],
                group: ['entityType'],
                raw: true,
            });

            expect(result).toEqual({});
        });

        it('should handle date range filters', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');
            const filters: IAuditFilters = {
                startDate,
                endDate,
                entityType: 'role',
            };

            (auditLogModel.findAll as jest.Mock).mockResolvedValue([
                { entityType: 'role', count: '5' },
            ]);

            await service.getAggregatedByEntityType(filters);

            expect(auditLogModel.findAll).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    entityType: 'role',
                    createdAt: {
                        [Op.gte]: startDate,
                        [Op.lte]: endDate,
                    },
                }),
                attributes: ['entityType', expect.any(Array)],
                group: ['entityType'],
                raw: true,
            });
        });
    });

    describe('getTopUsersByOperations', () => {
        it('should return top users by operations count', async () => {
            const filters: IAuditFilters = {
                tenantId: 1,
            };

            const mockResults = [
                { userId: 1, count: '25' },
                { userId: 2, count: '15' },
                { userId: 3, count: '10' },
            ];

            (auditLogModel.findAll as jest.Mock).mockResolvedValue(mockResults);

            const result = await service.getTopUsersByOperations(filters, 10);

            expect(auditLogModel.findAll).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    tenantId: 1,
                    userId: { [Op.ne]: null },
                }),
                attributes: ['userId', expect.any(Array)],
                group: ['userId'],
                order: expect.any(Array),
                limit: 10,
                raw: true,
            });

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({ userId: 1, operationsCount: 25 });
            expect(result[1]).toEqual({ userId: 2, operationsCount: 15 });
            expect(result[2]).toEqual({ userId: 3, operationsCount: 10 });
        });

        it('should respect limit parameter', async () => {
            // Мок должен вернуть только первые 3 элемента (как бы БД вернула)
            const mockResults = Array.from({ length: 3 }, (_, i) => ({
                userId: i + 1,
                count: String(20 - i),
            }));

            (auditLogModel.findAll as jest.Mock).mockResolvedValue(mockResults);

            const result = await service.getTopUsersByOperations(undefined, 3);

            expect(auditLogModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 3,
                }),
            );

            expect(result).toHaveLength(3);
            expect(result[0].operationsCount).toBe(20);
            expect(result[1].operationsCount).toBe(19);
            expect(result[2].operationsCount).toBe(18);
        });

        it('should return empty array when no users found', async () => {
            (auditLogModel.findAll as jest.Mock).mockResolvedValue([]);

            const result = await service.getTopUsersByOperations();

            expect(result).toEqual([]);
        });

        it('should exclude userId from filters for aggregation', async () => {
            const filters: IAuditFilters = {
                userId: 999, // Должен быть исключён из where
                tenantId: 1,
            };

            (auditLogModel.findAll as jest.Mock).mockResolvedValue([]);

            await service.getTopUsersByOperations(filters, 10);

            expect(auditLogModel.findAll).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    tenantId: 1,
                    userId: { [Op.ne]: null },
                    // userId: 999 не должен быть в where
                }),
                attributes: ['userId', expect.any(Array)],
                group: ['userId'],
                order: expect.any(Array),
                limit: 10,
                raw: true,
            });

            // Проверяем, что userId: 999 не в where
            const whereCall = (auditLogModel.findAll as jest.Mock).mock
                .calls[0][0].where;
            expect(whereCall.userId).not.toBe(999);
        });

        it('should use default limit of 10 when not specified', async () => {
            (auditLogModel.findAll as jest.Mock).mockResolvedValue([]);

            await service.getTopUsersByOperations();

            expect(auditLogModel.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 10,
                }),
            );
        });
    });

    describe('deleteOldLogs', () => {
        it('should delete logs older than specified date', async () => {
            const beforeDate = new Date('2023-01-01');
            (auditLogModel.destroy as jest.Mock).mockResolvedValue(5);

            const result = await service.deleteOldLogs(beforeDate);

            expect(auditLogModel.destroy).toHaveBeenCalledWith({
                where: {
                    createdAt: {
                        [Op.lt]: beforeDate,
                    },
                },
            });

            expect(result).toBe(5);
        });

        it('should return 0 when no logs to delete', async () => {
            const beforeDate = new Date('2023-01-01');
            (auditLogModel.destroy as jest.Mock).mockResolvedValue(0);

            const result = await service.deleteOldLogs(beforeDate);

            expect(result).toBe(0);
        });
    });

    describe('deleteOldLogsBatch', () => {
        beforeEach(() => {
            // Мокируем sequelize instance и query метод
            const mockSequelize: MockSequelizeInstance = {
                query: jest.fn(),
            };
            (
                auditLogModel as unknown as { sequelize: MockSequelizeInstance }
            ).sequelize = mockSequelize;
        });

        it('should delete logs in batches', async () => {
            const beforeDate = new Date('2023-01-01');
            const mockSequelize = (
                auditLogModel as unknown as { sequelize: MockSequelizeInstance }
            ).sequelize;

            // Первый батч удаляет 1000 записей (полный батч)
            // Второй батч удаляет 500 записей (меньше батча - конец)
            mockSequelize.query
                .mockResolvedValueOnce({ affectedRows: 1000 })
                .mockResolvedValueOnce({ affectedRows: 500 });

            // Мокируем setTimeout для паузы между батчами
            jest.useFakeTimers();

            const resultPromise = service.deleteOldLogsBatch(beforeDate, 1000);

            // Продвигаем таймер для обработки паузы между батчами
            await jest.advanceTimersByTimeAsync(100);

            const result = await resultPromise;

            expect(mockSequelize.query).toHaveBeenCalledTimes(2);
            expect(mockSequelize.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM audit_logs'),
                expect.objectContaining({
                    replacements: {
                        beforeDate,
                        batchSize: 1000,
                    },
                    type: 'DELETE', // QueryTypes.DELETE возвращает строку
                }),
            );

            expect(result).toBe(1500); // 1000 + 500

            jest.useRealTimers();
        });

        it('should handle single batch deletion', async () => {
            const beforeDate = new Date('2023-01-01');
            const mockSequelize = (
                auditLogModel as unknown as { sequelize: MockSequelizeInstance }
            ).sequelize;

            // Один батч удаляет 100 записей (меньше батча - конец)
            mockSequelize.query.mockResolvedValueOnce({
                affectedRows: 100,
            });

            jest.useFakeTimers();

            const resultPromise = service.deleteOldLogsBatch(beforeDate, 1000);

            await jest.advanceTimersByTimeAsync(100);

            const result = await resultPromise;

            expect(mockSequelize.query).toHaveBeenCalledTimes(1);
            expect(result).toBe(100);

            jest.useRealTimers();
        });

        it('should return 0 when no logs to delete', async () => {
            const beforeDate = new Date('2023-01-01');
            const mockSequelize = (
                auditLogModel as unknown as { sequelize: MockSequelizeInstance }
            ).sequelize;

            // Батч возвращает 0 удалённых записей
            mockSequelize.query.mockResolvedValueOnce({
                affectedRows: 0,
            });

            const result = await service.deleteOldLogsBatch(beforeDate, 1000);

            expect(mockSequelize.query).toHaveBeenCalledTimes(1);
            expect(result).toBe(0);
        });

        it('should handle number result type (MySQL)', async () => {
            const beforeDate = new Date('2023-01-01');
            const mockSequelize = (
                auditLogModel as unknown as { sequelize: MockSequelizeInstance }
            ).sequelize;

            // Некоторые БД возвращают число напрямую
            mockSequelize.query
                .mockResolvedValueOnce(1000)
                .mockResolvedValueOnce(500);

            jest.useFakeTimers();

            const resultPromise = service.deleteOldLogsBatch(beforeDate, 1000);

            await jest.advanceTimersByTimeAsync(100);

            const result = await resultPromise;

            expect(result).toBe(1500);

            jest.useRealTimers();
        });

        it('should throw error when sequelize instance not available', async () => {
            const beforeDate = new Date('2023-01-01');
            (
                auditLogModel as unknown as {
                    sequelize: MockSequelizeInstance | null;
                }
            ).sequelize = null;

            await expect(
                service.deleteOldLogsBatch(beforeDate, 1000),
            ).rejects.toThrow('Sequelize instance not available');
        });
    });
});
