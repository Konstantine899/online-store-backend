/**
 * Unit тесты для RoleAnalyticsRepository
 * Покрывает SQL агрегацию для аналитики ролей и разрешений
 *
 * Related to: SAAS-017-18
 */

import {
    AuditLogModel,
    RoleAutoRenewalConfigModel,
    RoleModel,
    UserRoleModel,
} from '@app/domain/models';
import { TenantContext } from '@app/infrastructure/common/context';
import { getModelToken } from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { RoleAnalyticsRepository } from '../role-analytics.repository';

describe('RoleAnalyticsRepository (unit)', () => {
    let repository: RoleAnalyticsRepository;
    let mockRoleModel: jest.Mocked<typeof RoleModel>;
    let mockUserRoleModel: jest.Mocked<typeof UserRoleModel>;
    let mockAuditLogModel: jest.Mocked<typeof AuditLogModel>;
    let mockRoleAutoRenewalConfigModel: jest.Mocked<
        typeof RoleAutoRenewalConfigModel
    >;
    let mockSequelize: {
        query: jest.Mock;
    };
    let mockTenantContext: jest.Mocked<TenantContext>;

    beforeEach(async () => {
        // Мок Sequelize для SQL запросов
        mockSequelize = {
            query: jest.fn(),
        };

        // Мок RoleModel
        mockRoleModel = {
            sequelize: mockSequelize as never,
            findOne: jest.fn(),
        } as unknown as jest.Mocked<typeof RoleModel>;

        // Мок UserRoleModel
        mockUserRoleModel = {
            sequelize: mockSequelize as never,
        } as unknown as jest.Mocked<typeof UserRoleModel>;

        // Мок AuditLogModel
        mockAuditLogModel = {
            sequelize: mockSequelize as never,
        } as unknown as jest.Mocked<typeof AuditLogModel>;

        // Мок RoleAutoRenewalConfigModel
        mockRoleAutoRenewalConfigModel = {
            sequelize: mockSequelize as never,
        } as unknown as jest.Mocked<typeof RoleAutoRenewalConfigModel>;

        // Мок TenantContext
        mockTenantContext = {
            getTenantIdOrNull: jest.fn().mockReturnValue(1),
            getTenantId: jest.fn().mockReturnValue(1),
        } as unknown as jest.Mocked<TenantContext>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleAnalyticsRepository,
                {
                    provide: getModelToken(RoleModel),
                    useValue: mockRoleModel,
                },
                {
                    provide: getModelToken(UserRoleModel),
                    useValue: mockUserRoleModel,
                },
                {
                    provide: getModelToken(AuditLogModel),
                    useValue: mockAuditLogModel,
                },
                {
                    provide: getModelToken(RoleAutoRenewalConfigModel),
                    useValue: mockRoleAutoRenewalConfigModel,
                },
                {
                    provide: TenantContext,
                    useValue: mockTenantContext,
                },
            ],
        }).compile();

        repository = module.get<RoleAnalyticsRepository>(
            RoleAnalyticsRepository,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getRoleUsageMetrics', () => {
        it('должен вернуть метрики использования ролей', async () => {
            // Arrange
            const tenantId = 1;

            const mockRoleStats = {
                totalRoles: 25,
                activeRoles: 20,
                inactiveRoles: 5,
                systemRoles: 10,
                tenantRoles: 15,
            };

            const mockExpirationStats = {
                rolesWithExpiration: 8,
            };

            const mockRolesByLevel = [
                { level: 0, count: 5 },
                { level: 50, count: 10 },
                { level: 100, count: 10 },
            ];

            const mockTotalUsers = { totalUsers: 100 };

            const mockTopUsedRoles = [
                {
                    roleId: 1,
                    roleName: 'TENANT_ADMIN',
                    userCount: 50,
                },
                {
                    roleId: 2,
                    roleName: 'USER',
                    userCount: 30,
                },
            ];

            mockSequelize.query
                .mockResolvedValueOnce([mockRoleStats]) // role stats
                .mockResolvedValueOnce([mockExpirationStats]) // expiration stats
                .mockResolvedValueOnce(mockRolesByLevel) // roles by level
                .mockResolvedValueOnce([mockTotalUsers]) // total users
                .mockResolvedValueOnce(mockTopUsedRoles); // top used roles

            // Act
            const result = await repository.getRoleUsageMetrics(tenantId);

            // Assert
            expect(result.totalRoles).toBe(25);
            expect(result.activeRoles).toBe(20);
            expect(result.inactiveRoles).toBe(5);
            expect(result.systemRoles).toBe(10);
            expect(result.tenantRoles).toBe(15);
            expect(result.rolesWithExpiration).toBe(8);
            expect(result.rolesByLevel).toHaveLength(3);
            expect(result.topUsedRoles).toHaveLength(2);
            expect(result.topUsedRoles[0]).toEqual({
                roleId: 1,
                roleName: 'TENANT_ADMIN',
                userCount: 50,
                percentage: 50.0,
            });
        });

        it('должен использовать fallback tenantId = 1 в test режиме для null', async () => {
            // Arrange
            const tenantId = null;
            // В репозитории используется getTenantIdSafe(), который в test режиме
            // возвращает fallback 1, если tenantId null из контекста.
            // Но если явно передать null, то используется именно null
            mockTenantContext.getTenantIdOrNull.mockReturnValue(null);
            mockSequelize.query.mockResolvedValue([
                {
                    totalRoles: 10,
                    activeRoles: 8,
                    inactiveRoles: 2,
                    systemRoles: 10,
                    tenantRoles: 0,
                },
            ]);

            // Act
            await repository.getRoleUsageMetrics(tenantId);

            // Assert - когда передаём null явно, он используется как есть
            // (в коде: tenantId ?? this.getTenantIdSafe(), если tenantId null, то используется getTenantIdSafe)
            // Но в getTenantIdSafe в test режиме возвращается fallback 1
            // Поэтому проверяем, что используется 1 (fallback значение)
            expect(mockSequelize.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE (? IS NULL'),
                expect.objectContaining({
                    replacements: [1, 1],
                }),
            );
        });
    });

    describe('getRoleUsageMetricsById', () => {
        it('должен вернуть метрики для конкретной роли', async () => {
            // Arrange
            const roleId = 1;
            const tenantId = 1;

            const mockRole = {
                id: 1,
                role: 'TENANT_ADMIN',
                description: 'Admin role',
                level: 60,
                isSystemRole: false,
                isActive: true,
                tenantId: 1,
            };

            mockRoleModel.findOne.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );

            const mockUserStats = {
                userCount: 50,
                totalUsers: 100,
            };

            const mockDurationStats = {
                averageDurationDays: 30.5,
            };

            const mockAutoAssignments = {
                autoAssignmentsCount: 10,
            };

            mockSequelize.query
                .mockResolvedValueOnce([mockUserStats])
                .mockResolvedValueOnce([mockDurationStats])
                .mockResolvedValueOnce([mockAutoAssignments]);

            // Act
            const result = await repository.getRoleUsageMetricsById(
                roleId,
                tenantId,
            );

            // Assert
            expect(result).not.toBeNull();
            expect(result?.roleId).toBe(roleId);
            expect(result?.roleName).toBe('TENANT_ADMIN');
            expect(result?.userCount).toBe(50);
            expect(result?.totalUsers).toBe(100);
            expect(result?.percentage).toBe(50.0);
            expect(result?.autoAssignmentsCount).toBe(10);
            expect(result?.manualAssignmentsCount).toBe(40);
        });

        it('должен вернуть null если роль не найдена', async () => {
            // Arrange
            const roleId = 999;
            const tenantId = 1;

            mockRoleModel.findOne.mockResolvedValue(null);

            // Act
            const result = await repository.getRoleUsageMetricsById(
                roleId,
                tenantId,
            );

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('getPermissionUsageMetrics', () => {
        it('должен вернуть метрики использования разрешений', async () => {
            // Arrange
            const tenantId = 1;

            const mockTotalResult = {
                totalUniquePermissions: 50,
                totalRoles: 25,
            };

            const mockTopPermissions = [
                {
                    resource: 'products',
                    action: 'create',
                    roleCount: 10,
                },
                {
                    resource: 'users',
                    action: 'read',
                    roleCount: 8,
                },
            ];

            const mockByResource = [
                { resource: 'products', count: 15 },
                { resource: 'users', count: 10 },
            ];

            const mockByAction = [
                { action: 'create', count: 20 },
                { action: 'read', count: 15 },
            ];

            mockSequelize.query
                .mockResolvedValueOnce([mockTotalResult])
                .mockResolvedValueOnce(mockTopPermissions)
                .mockResolvedValueOnce(mockByResource)
                .mockResolvedValueOnce(mockByAction);

            // Act
            const result = await repository.getPermissionUsageMetrics(tenantId);

            // Assert
            expect(result.totalUniquePermissions).toBe(50);
            expect(result.topUsedPermissions).toHaveLength(2);
            expect(result.topUsedPermissions[0]).toEqual({
                resource: 'products',
                action: 'create',
                roleCount: 10,
                percentage: 40.0,
            });
            expect(result.permissionsByResource).toHaveLength(2);
            expect(result.permissionsByAction).toHaveLength(2);
        });
    });

    describe('getRoleOperationsMetrics', () => {
        it('должен вернуть метрики операций назначения/отзыва', async () => {
            // Arrange
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');
            const tenantId = 1;

            const mockOperationStats = {
                totalAssignments: 100,
                totalRevocations: 50,
            };

            const mockTopAssigned = [
                {
                    roleId: 1,
                    roleName: 'TENANT_ADMIN',
                    count: 30,
                },
            ];

            const mockTopRevoked = [
                {
                    roleId: 1,
                    roleName: 'TENANT_ADMIN',
                    count: 15,
                },
            ];

            const mockOperationsByDay = [
                {
                    date: '2024-01-01',
                    assignments: 5,
                    revocations: 2,
                },
            ];

            mockSequelize.query
                .mockResolvedValueOnce([mockOperationStats])
                .mockResolvedValueOnce(mockTopAssigned)
                .mockResolvedValueOnce(mockTopRevoked)
                .mockResolvedValueOnce(mockOperationsByDay);

            // Act
            const result = await repository.getRoleOperationsMetrics(
                startDate,
                endDate,
                tenantId,
            );

            // Assert
            expect(result.totalAssignments).toBe(100);
            expect(result.totalRevocations).toBe(50);
            expect(result.assignmentToRevocationRatio).toBe(2.0);
            expect(result.topAssignedRoles).toHaveLength(1);
            expect(result.topRevokedRoles).toHaveLength(1);
            expect(result.operationsByDay).toHaveLength(1);
        });
    });

    describe('getAutoAssignmentMetrics', () => {
        it('должен вернуть метрики автоматических назначений', async () => {
            // Arrange
            const tenantId = 1;

            const mockTotal = { totalAutoAssignments: 50 };

            const mockByType = [
                { reason: 'total_spent', count: 30 },
                { reason: 'order_count', count: 20 },
            ];

            const mockFailureReasons: Array<{
                errorReason: string;
                count: number;
            }> = [];

            mockSequelize.query
                .mockResolvedValueOnce([mockTotal])
                .mockResolvedValueOnce(mockByType)
                .mockResolvedValueOnce(mockFailureReasons);

            // Act
            const result = await repository.getAutoAssignmentMetrics(tenantId);

            // Assert
            expect(result.totalAutoAssignments).toBe(50);
            expect(result.successfulAutoAssignments).toBe(50);
            expect(result.failedAutoAssignments).toBe(0);
            expect(result.successRate).toBe(100.0);
            expect(result.autoAssignmentsByType).toHaveLength(2);
            expect(result.autoAssignmentsByType[0]).toEqual({
                type: 'VIP',
                count: 30,
                successCount: 30,
                failureCount: 0,
            });
        });
    });

    describe('getExpirationMetrics', () => {
        it('должен вернуть метрики истечения ролей', async () => {
            // Arrange
            const tenantId = 1;

            const mockActiveExpiration = {
                activeRolesWithExpiration: 20,
            };

            const mockExpired = {
                expiredRolesCount: 5,
            };

            const mockDuration = {
                averageDurationDays: 30.5,
            };

            const mockRenewal = {
                totalRenewals: 10,
                averageRenewalDurationDays: 15.2,
                rolesReachedLimit: 2,
            };

            mockSequelize.query
                .mockResolvedValueOnce([mockActiveExpiration])
                .mockResolvedValueOnce([mockExpired])
                .mockResolvedValueOnce([mockDuration])
                .mockResolvedValueOnce([mockRenewal]);

            // Act
            const result = await repository.getExpirationMetrics(tenantId);

            // Assert
            expect(result.activeRolesWithExpiration).toBe(20);
            expect(result.expiredRolesCount).toBe(5);
            expect(result.averageDurationBeforeExpiration).toBe(30.5);
            expect(result.renewalStats.totalRenewals).toBe(10);
            expect(result.renewalStats.averageRenewalDuration).toBe(15.2);
            expect(result.renewalStats.rolesReachedLimit).toBe(2);
        });
    });

    describe('getHierarchyMetrics', () => {
        it('должен вернуть метрики иерархии ролей', async () => {
            // Arrange
            const tenantId = 1;

            const mockRolesByLevel = [
                {
                    level: 0,
                    count: 5,
                    averagePermissions: 3.5,
                },
                {
                    level: 50,
                    count: 10,
                    averagePermissions: 5.2,
                },
            ];

            const mockEmptyRoles = [
                {
                    roleId: 3,
                    roleName: 'EMPTY_ROLE',
                    level: 25,
                },
            ];

            const mockLevelStats = {
                maxLevel: 100,
                minLevel: 0,
            };

            mockSequelize.query
                .mockResolvedValueOnce(mockRolesByLevel)
                .mockResolvedValueOnce(mockEmptyRoles)
                .mockResolvedValueOnce([mockLevelStats]);

            // Act
            const result = await repository.getHierarchyMetrics(tenantId);

            // Assert
            expect(result.rolesByLevel).toHaveLength(2);
            expect(result.rolesByLevel[0]).toEqual({
                level: 0,
                count: 5,
                averagePermissions: 3.5,
            });
            expect(result.emptyRoles).toHaveLength(1);
            expect(result.maxLevel).toBe(100);
            expect(result.minLevel).toBe(0);
        });
    });

    describe('getDistributionByTenant', () => {
        it('должен вернуть распределение ролей по тенантам', async () => {
            // Arrange
            const mockTenantStats = [
                { tenantId: 1, totalRoles: 25, activeRoles: 20 },
                { tenantId: 2, totalRoles: 15, activeRoles: 12 },
            ];

            const mockTopRolesTenant1 = [
                { roleName: 'TENANT_ADMIN', userCount: 50 },
            ];

            const mockTopRolesTenant2 = [{ roleName: 'USER', userCount: 30 }];

            mockSequelize.query
                .mockResolvedValueOnce(mockTenantStats)
                .mockResolvedValueOnce(mockTopRolesTenant1)
                .mockResolvedValueOnce(mockTopRolesTenant2);

            // Act
            const result = await repository.getDistributionByTenant();

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                tenantId: 1,
                totalRoles: 25,
                activeRoles: 20,
                topRoles: [
                    {
                        roleName: 'TENANT_ADMIN',
                        userCount: 50,
                    },
                ],
            });
        });
    });

    describe('Обработка ошибок', () => {
        it('должен пробросить ошибку при проблеме с Sequelize', async () => {
            // Arrange
            const tenantId = 1;
            const error = new Error('Database connection failed');

            mockSequelize.query.mockRejectedValue(error);

            // Act & Assert
            await expect(
                repository.getRoleUsageMetrics(tenantId),
            ).rejects.toThrow('Database connection failed');
        });

        it('должен обработать ошибку при отсутствии sequelize instance', async () => {
            // Arrange
            const tenantId = 1;
            // Используем мок с null sequelize
            const mockModelWithoutSequelize = {
                findOne: jest.fn(),
                sequelize: null,
            };

            const moduleRef = await Test.createTestingModule({
                providers: [
                    RoleAnalyticsRepository,
                    {
                        provide: getModelToken(RoleModel),
                        useValue: mockModelWithoutSequelize,
                    },
                    {
                        provide: getModelToken(UserRoleModel),
                        useValue: mockUserRoleModel,
                    },
                    {
                        provide: getModelToken(AuditLogModel),
                        useValue: mockAuditLogModel,
                    },
                    {
                        provide: getModelToken(RoleAutoRenewalConfigModel),
                        useValue: mockRoleAutoRenewalConfigModel,
                    },
                    {
                        provide: TenantContext,
                        useValue: mockTenantContext,
                    },
                ],
            }).compile();

            const repoWithoutSequelize = moduleRef.get<RoleAnalyticsRepository>(
                RoleAnalyticsRepository,
            );

            // Act & Assert
            await expect(
                repoWithoutSequelize.getRoleUsageMetrics(tenantId),
            ).rejects.toThrow('Sequelize instance not available');
        });
    });
});
