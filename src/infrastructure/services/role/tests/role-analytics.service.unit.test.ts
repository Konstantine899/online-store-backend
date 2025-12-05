/**
 * Unit тесты для RoleAnalyticsService
 * Покрывает бизнес-логику и форматирование данных для аналитики ролей
 *
 * Related to: SAAS-017-18
 */

import { TenantContext } from '@app/infrastructure/common/context';
import { RoleAnalyticsRepository } from '@app/infrastructure/repositories';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { RoleAnalyticsService } from '../role-analytics.service';

describe('RoleAnalyticsService (unit)', () => {
    let service: RoleAnalyticsService;
    let repository: jest.Mocked<RoleAnalyticsRepository>;
    let tenantContext: jest.Mocked<TenantContext>;

    beforeEach(async () => {
        // Мок репозитория
        repository = {
            getRoleUsageMetrics: jest.fn(),
            getRoleUsageMetricsById: jest.fn(),
            getPermissionUsageMetrics: jest.fn(),
            getPermissionUsageMetricsByResourceAndAction: jest.fn(),
            getRoleOperationsMetrics: jest.fn(),
            getAutoAssignmentMetrics: jest.fn(),
            getExpirationMetrics: jest.fn(),
            getHierarchyMetrics: jest.fn(),
            getDistributionByTenant: jest.fn(),
        } as unknown as jest.Mocked<RoleAnalyticsRepository>;

        // Мок TenantContext
        tenantContext = {
            getTenantIdOrNull: jest.fn().mockReturnValue(1),
            getTenantId: jest.fn().mockReturnValue(1),
            getTenantIdOrFail: jest.fn().mockReturnValue(1),
        } as unknown as jest.Mocked<TenantContext>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleAnalyticsService,
                {
                    provide: RoleAnalyticsRepository,
                    useValue: repository,
                },
                {
                    provide: TenantContext,
                    useValue: tenantContext,
                },
            ],
        }).compile();

        service = module.get<RoleAnalyticsService>(RoleAnalyticsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getRoleUsageStats', () => {
        it('должен вернуть статистику использования ролей', async () => {
            // Arrange
            const tenantId = 1;
            const mockMetrics = {
                totalRoles: 25,
                activeRoles: 20,
                inactiveRoles: 5,
                systemRoles: 10,
                tenantRoles: 15,
                rolesWithExpiration: 8,
                rolesByLevel: [
                    { level: 0, count: 5 },
                    { level: 50, count: 10 },
                ],
                topUsedRoles: [
                    {
                        roleId: 1,
                        roleName: 'TENANT_ADMIN',
                        userCount: 50,
                        percentage: 50.0,
                    },
                ],
            };

            repository.getRoleUsageMetrics.mockResolvedValue(mockMetrics);

            // Act
            const result = await service.getRoleUsageStats(tenantId);

            // Assert
            expect(result).toEqual(mockMetrics);
            expect(repository.getRoleUsageMetrics).toHaveBeenCalledWith(
                tenantId,
            );
        });

        it('должен использовать tenantId из контекста если не передан', async () => {
            // Arrange
            const mockMetrics = {
                totalRoles: 10,
                activeRoles: 8,
                inactiveRoles: 2,
                systemRoles: 5,
                tenantRoles: 5,
                rolesWithExpiration: 3,
                rolesByLevel: [],
                topUsedRoles: [],
            };

            repository.getRoleUsageMetrics.mockResolvedValue(mockMetrics);

            // Act
            await service.getRoleUsageStats();

            // Assert
            expect(repository.getRoleUsageMetrics).toHaveBeenCalledWith(1);
        });
    });

    describe('getRoleUsageStatsById', () => {
        it('должен вернуть статистику для конкретной роли', async () => {
            // Arrange
            const roleId = 1;
            const tenantId = 1;
            const mockMetrics = {
                roleId: 1,
                roleName: 'TENANT_ADMIN',
                userCount: 50,
                totalUsers: 100,
                percentage: 50.0,
                averageDuration: 30.5,
                autoAssignmentsCount: 10,
                manualAssignmentsCount: 40,
            };

            repository.getRoleUsageMetricsById.mockResolvedValue(mockMetrics);

            // Act
            const result = await service.getRoleUsageStatsById(roleId, tenantId);

            // Assert
            expect(result).toEqual(mockMetrics);
            expect(
                repository.getRoleUsageMetricsById,
            ).toHaveBeenCalledWith(roleId, tenantId);
        });

        it('должен вернуть null если роль не найдена', async () => {
            // Arrange
            const roleId = 999;
            const tenantId = 1;

            repository.getRoleUsageMetricsById.mockResolvedValue(null);

            // Act
            const result = await service.getRoleUsageStatsById(roleId, tenantId);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('getPermissionUsageStats', () => {
        it('должен вернуть статистику использования разрешений', async () => {
            // Arrange
            const tenantId = 1;
            const mockMetrics = {
                totalUniquePermissions: 50,
                topUsedPermissions: [
                    {
                        resource: 'products',
                        action: 'create',
                        roleCount: 10,
                        percentage: 40.0,
                    },
                ],
                permissionsByResource: [
                    { resource: 'products', count: 15 },
                ],
                permissionsByAction: [{ action: 'create', count: 20 }],
            };

            repository.getPermissionUsageMetrics.mockResolvedValue(mockMetrics);

            // Act
            const result = await service.getPermissionUsageStats(tenantId);

            // Assert
            expect(result).toEqual(mockMetrics);
            expect(
                repository.getPermissionUsageMetrics,
            ).toHaveBeenCalledWith(tenantId);
        });
    });

    describe('getPermissionUsageStatsByResourceAndAction', () => {
        it('должен вернуть статистику для конкретного разрешения', async () => {
            // Arrange
            const resource = 'products';
            const action = 'create';
            const tenantId = 1;
            const mockMetrics = {
                resource: 'products',
                action: 'create',
                roleCount: 10,
                roles: [
                    {
                        roleId: 1,
                        roleName: 'ADMIN',
                    },
                ],
            };

            repository.getPermissionUsageMetricsByResourceAndAction.mockResolvedValue(
                mockMetrics,
            );

            // Act
            const result =
                await service.getPermissionUsageStatsByResourceAndAction(
                    resource,
                    action,
                    tenantId,
                );

            // Assert
            expect(result).toEqual(mockMetrics);
            expect(
                repository.getPermissionUsageMetricsByResourceAndAction,
            ).toHaveBeenCalledWith(resource, action, tenantId);
        });

        it('должен вернуть null если разрешение не найдено', async () => {
            // Arrange
            const resource = 'unknown';
            const action = 'unknown';
            const tenantId = 1;

            repository.getPermissionUsageMetricsByResourceAndAction.mockResolvedValue(
                null,
            );

            // Act
            const result =
                await service.getPermissionUsageStatsByResourceAndAction(
                    resource,
                    action,
                    tenantId,
                );

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('getRoleOperationsStats', () => {
        it('должен вернуть статистику операций назначения/отзыва', async () => {
            // Arrange
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');
            const tenantId = 1;
            const mockMetrics = {
                totalAssignments: 100,
                totalRevocations: 50,
                assignmentToRevocationRatio: 2.0,
                topAssignedRoles: [
                    {
                        roleId: 1,
                        roleName: 'TENANT_ADMIN',
                        count: 30,
                    },
                ],
                topRevokedRoles: [],
                operationsByDay: [],
            };

            repository.getRoleOperationsMetrics.mockResolvedValue(mockMetrics);

            // Act
            const result = await service.getRoleOperationsStats(
                startDate,
                endDate,
                tenantId,
            );

            // Assert
            expect(result).toEqual(mockMetrics);
            expect(
                repository.getRoleOperationsMetrics,
            ).toHaveBeenCalledWith(startDate, endDate, tenantId);
        });
    });

    describe('getAutoAssignmentStats', () => {
        it('должен вернуть статистику автоматических назначений', async () => {
            // Arrange
            const tenantId = 1;
            const mockMetrics = {
                totalAutoAssignments: 50,
                successfulAutoAssignments: 45,
                failedAutoAssignments: 5,
                successRate: 90.0,
                autoAssignmentsByType: [
                    {
                        type: 'VIP',
                        count: 30,
                        successCount: 28,
                        failureCount: 2,
                    },
                ],
                failureReasons: [],
            };

            repository.getAutoAssignmentMetrics.mockResolvedValue(mockMetrics);

            // Act
            const result = await service.getAutoAssignmentStats(tenantId);

            // Assert
            expect(result).toEqual(mockMetrics);
            expect(
                repository.getAutoAssignmentMetrics,
            ).toHaveBeenCalledWith(tenantId);
        });
    });

    describe('getExpirationStats', () => {
        it('должен вернуть статистику истечения ролей', async () => {
            // Arrange
            const tenantId = 1;
            const mockMetrics = {
                activeRolesWithExpiration: 20,
                expiredRolesCount: 5,
                averageDurationBeforeExpiration: 30.5,
                renewalStats: {
                    totalRenewals: 10,
                    averageRenewalDuration: 15.2,
                    rolesReachedLimit: 2,
                },
            };

            repository.getExpirationMetrics.mockResolvedValue(mockMetrics);

            // Act
            const result = await service.getExpirationStats(tenantId);

            // Assert
            expect(result).toEqual(mockMetrics);
            expect(repository.getExpirationMetrics).toHaveBeenCalledWith(
                tenantId,
            );
        });
    });

    describe('getHierarchyStats', () => {
        it('должен вернуть статистику иерархии ролей', async () => {
            // Arrange
            const tenantId = 1;
            const mockMetrics = {
                rolesByLevel: [
                    {
                        level: 0,
                        count: 5,
                        averagePermissions: 3.5,
                    },
                ],
                emptyRoles: [],
                maxLevel: 100,
                minLevel: 0,
            };

            repository.getHierarchyMetrics.mockResolvedValue(mockMetrics);

            // Act
            const result = await service.getHierarchyStats(tenantId);

            // Assert
            expect(result).toEqual(mockMetrics);
            expect(repository.getHierarchyMetrics).toHaveBeenCalledWith(
                tenantId,
            );
        });
    });

    describe('getDistributionByTenant', () => {
        it('должен вернуть распределение ролей по тенантам', async () => {
            // Arrange
            const mockDistribution = [
                {
                    tenantId: 1,
                    totalRoles: 25,
                    activeRoles: 20,
                    topRoles: [],
                },
            ];

            repository.getDistributionByTenant.mockResolvedValue(
                mockDistribution,
            );

            // Act
            const result = await service.getDistributionByTenant();

            // Assert
            expect(result).toEqual(mockDistribution);
            expect(
                repository.getDistributionByTenant,
            ).toHaveBeenCalledWith();
        });
    });

    describe('getDashboardData', () => {
        it('должен вернуть агрегированные данные для дашборда', async () => {
            // Arrange
            const tenantId = 1;
            const mockRoleStats = {
                totalRoles: 25,
                activeRoles: 20,
                systemRoles: 10,
                tenantRoles: 15,
                rolesWithExpiration: 8,
                rolesByLevel: [],
                topUsedRoles: [],
                inactiveRoles: 5,
            };

            const mockPermissionStats = {
                totalUniquePermissions: 50,
                topUsedPermissions: [],
                permissionsByResource: [],
                permissionsByAction: [],
            };

            const mockExpirationStats = {
                activeRolesWithExpiration: 20,
                expiredRolesCount: 5,
                averageDurationBeforeExpiration: 30.5,
                renewalStats: {
                    totalRenewals: 10,
                    averageRenewalDuration: 15.2,
                    rolesReachedLimit: 2,
                },
            };

            const mockHierarchyStats = {
                rolesByLevel: [],
                emptyRoles: [],
                maxLevel: 100,
                minLevel: 0,
            };

            repository.getRoleUsageMetrics.mockResolvedValue(mockRoleStats);
            repository.getPermissionUsageMetrics.mockResolvedValue(
                mockPermissionStats,
            );
            repository.getExpirationMetrics.mockResolvedValue(
                mockExpirationStats,
            );
            repository.getHierarchyMetrics.mockResolvedValue(mockHierarchyStats);

            // Act
            const result = await service.getDashboardData(tenantId);

            // Assert
            expect(result).toHaveProperty('roleStats');
            expect(result).toHaveProperty('permissionStats');
            expect(result).toHaveProperty('expirationStats');
            expect(result).toHaveProperty('hierarchyStats');
            expect(result.roleStats).toEqual({
                totalRoles: mockRoleStats.totalRoles,
                activeRoles: mockRoleStats.activeRoles,
                systemRoles: mockRoleStats.systemRoles,
                tenantRoles: mockRoleStats.tenantRoles,
            });
            expect(result.permissionStats).toEqual({
                totalUniquePermissions:
                    mockPermissionStats.totalUniquePermissions,
                topUsedPermissions: [],
            });
            // В getDashboardData expirationStats содержит только часть полей
            expect(result.expirationStats).toEqual({
                activeRolesWithExpiration:
                    mockExpirationStats.activeRolesWithExpiration,
                expiredRolesCount: mockExpirationStats.expiredRolesCount,
            });
            // В getDashboardData hierarchyStats содержит только часть полей
            expect(result.hierarchyStats).toEqual({
                maxLevel: mockHierarchyStats.maxLevel,
                minLevel: mockHierarchyStats.minLevel,
                emptyRolesCount: mockHierarchyStats.emptyRoles.length,
            });
        });
    });

    describe('Обработка ошибок', () => {
        it('должен пробросить ошибку от репозитория', async () => {
            // Arrange
            const tenantId = 1;
            const error = new Error('Database error');

            repository.getRoleUsageMetrics.mockRejectedValue(error);

            // Act & Assert
            await expect(
                service.getRoleUsageStats(tenantId),
            ).rejects.toThrow('Database error');
        });
    });

    describe('Tenant isolation', () => {
        it('должен использовать fallback tenantId = 1 в test режиме', async () => {
            // Arrange
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'test';
            tenantContext.getTenantIdOrNull.mockReturnValue(null);

            const mockMetrics = {
                totalRoles: 10,
                activeRoles: 8,
                inactiveRoles: 2,
                systemRoles: 5,
                tenantRoles: 5,
                rolesWithExpiration: 3,
                rolesByLevel: [],
                topUsedRoles: [],
            };

            repository.getRoleUsageMetrics.mockResolvedValue(mockMetrics);

            // Act
            await service.getRoleUsageStats();

            // Assert
            expect(repository.getRoleUsageMetrics).toHaveBeenCalledWith(1);

            // Restore
            process.env.NODE_ENV = originalEnv;
        });
    });
});
