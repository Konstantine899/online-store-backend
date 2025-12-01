import type { UserModel } from '@app/domain/models';
import {
    UserModel as UserModelType,
    UserRoleModel as UserRoleModelType,
} from '@app/domain/models';
import { MetricsCollector } from '@app/infrastructure/common/services';
import {
    getVipRoleThreshold,
    getWholesaleRoleThreshold,
} from '@app/infrastructure/controllers/role/role-constants';
import { AuditService } from '@app/infrastructure/services/audit/audit.service';
import {
    OrderRepository,
    RoleRepository,
} from '@app/infrastructure/repositories';
import { getModelToken } from '@nestjs/sequelize';
import { Test, type TestingModule } from '@nestjs/testing';
import { RoleCacheService } from '../role-cache.service';
import { RoleService } from '../role.service';
import { UserRolesCacheService } from '../user-roles-cache.service';

describe('RoleService - Auto Role Assignment', () => {
    let service: RoleService;
    let roleRepository: jest.Mocked<RoleRepository>;
    let orderRepository: jest.Mocked<OrderRepository>;
    let roleCacheService: jest.Mocked<RoleCacheService>;
    let userModel: jest.Mocked<typeof UserModelType>;
    let userRoleModel: jest.Mocked<typeof UserRoleModelType>;
    let metricsCollector: jest.Mocked<MetricsCollector>;

    const mockUser = {
        id: 1,
        userId: 1,
        email: 'test@example.com',
        tenantId: 1,
        isActive: true,
    } as unknown as UserModel;

    const mockVipRole = {
        id: 10,
        role: 'VIP_CUSTOMER',
        isActive: true,
        tenantId: 1,
        level: 30,
        getDataValue: jest.fn((key: string) => {
            if (key === 'isActive') return true;
            return undefined;
        }),
    };

    const mockWholesaleRole = {
        id: 11,
        role: 'WHOLESALE',
        isActive: true,
        tenantId: 1,
        level: 30,
        getDataValue: jest.fn((key: string) => {
            if (key === 'isActive') return true;
            return undefined;
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleService,
                {
                    provide: RoleRepository,
                    useValue: {
                        findRoleByName: jest.fn(),
                        findRoleById: jest.fn(),
                        findRoleByIdWithoutIsolation: jest.fn(),
                        findUserRoles: jest.fn(),
                        assignRoleToUser: jest.fn(),
                        revokeRoleFromUser: jest.fn(),
                    },
                },
                {
                    provide: OrderRepository,
                    useValue: {
                        getUserTotalSpent: jest.fn(),
                        getUserOrderCount: jest.fn(),
                    },
                },
                {
                    provide: RoleCacheService,
                    useValue: {
                        getCachedRole: jest.fn(),
                        invalidate: jest.fn(),
                        invalidateAll: jest.fn(),
                        getStats: jest.fn(),
                        resetStats: jest.fn(),
                        warmUp: jest.fn(),
                    },
                },
                {
                    provide: UserRolesCacheService,
                    useValue: {
                        getUserRoles: jest.fn(),
                        setUserRoles: jest.fn(),
                        invalidateUserRoles: jest.fn(),
                        invalidateAllUserRoles: jest.fn(),
                        invalidateByRoleId: jest.fn(),
                        getStats: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(UserModelType),
                    useValue: {
                        findByPk: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(UserRoleModelType),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: MetricsCollector,
                    useValue: {
                        recordRoleAutoAssignment: jest.fn(),
                    },
                },
                {
                    provide: AuditService,
                    useValue: {
                        createLog: jest.fn().mockResolvedValue(undefined),
                    },
                },
            ],
        }).compile();

        service = module.get<RoleService>(RoleService);
        roleRepository = module.get(RoleRepository);
        orderRepository = module.get(OrderRepository);
        roleCacheService = module.get(RoleCacheService);
        userModel = module.get(getModelToken(UserModelType));
        userRoleModel = module.get(getModelToken(UserRoleModelType));
        metricsCollector = module.get(MetricsCollector);

        jest.clearAllMocks();
    });

    describe('autoAssignVipRole', () => {
        it('должен назначить VIP роль, если сумма покупок превышает порог', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold + 10000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(
                totalSpent,
            );
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockVipRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([]);
            (roleRepository.assignRoleToUser as jest.Mock).mockResolvedValue({
                id: 1,
                userId: 1,
                roleId: 10,
                tenantId: 1,
            } as never);

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(true);
            expect(result.roleId).toBe(10);
            expect(roleRepository.assignRoleToUser).toHaveBeenCalledWith(
                1,
                10,
                1,
                null,
                null,
                expect.objectContaining({
                    auto_assigned: true,
                    total_spent: totalSpent,
                    threshold: vipThreshold,
                }),
            );
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith('VIP_CUSTOMER', 'assigned', true);
        });

        it('не должен назначать VIP роль, если сумма покупок меньше порога', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold - 1000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(
                totalSpent,
            );

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith('VIP_CUSTOMER', 'threshold_not_met', false);
        });

        it('не должен назначать VIP роль, если роль уже назначена', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold + 10000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(
                totalSpent,
            );
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockVipRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([
                { roleId: 10 } as never,
            ]);

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(result.roleId).toBe(10);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith('VIP_CUSTOMER', 'already_assigned', false);
        });

        it('не должен назначать VIP роль, если пользователь не найден', async () => {
            (userModel.findByPk as jest.Mock).mockResolvedValue(null);

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
                'user_not_found_or_wrong_tenant',
                false,
            );
        });

        it('не должен назначать VIP роль, если пользователь принадлежит другому тенанту', async () => {
            const wrongTenantUser = { ...mockUser, tenantId: 2 } as UserModel;

            (userModel.findByPk as jest.Mock).mockResolvedValue(
                wrongTenantUser,
            );

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
                'user_not_found_or_wrong_tenant',
                false,
            );
        });

        it('не должен назначать VIP роль, если роль не найдена или неактивна', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold + 10000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(
                totalSpent,
            );
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                null,
            );

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
                'role_not_found_or_inactive',
                false,
            );
        });

        it('должен обработать ошибку при назначении VIP роли', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold + 10000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(
                totalSpent,
            );
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockVipRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([]);
            (roleRepository.assignRoleToUser as jest.Mock).mockRejectedValue(
                new Error('Database error'),
            );

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith('VIP_CUSTOMER', 'error', false);
        });
    });

    describe('autoAssignWholesaleRole', () => {
        it('должен назначить WHOLESALE роль, если количество заказов превышает порог', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold + 5;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(
                orderCount,
            );
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockWholesaleRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([]);
            (roleRepository.assignRoleToUser as jest.Mock).mockResolvedValue({
                id: 1,
                userId: 1,
                roleId: 11,
                tenantId: 1,
            });

            const result = await service.autoAssignWholesaleRole(1, 1);

            expect(result.assigned).toBe(true);
            expect(result.roleId).toBe(11);
            expect(roleRepository.assignRoleToUser).toHaveBeenCalledWith(
                1,
                11,
                1,
                null,
                null,
                expect.objectContaining({
                    auto_assigned: true,
                    order_count: orderCount,
                    threshold: wholesaleThreshold,
                }),
            );
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith('WHOLESALE', 'assigned', true);
        });

        it('не должен назначать WHOLESALE роль, если количество заказов меньше порога', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold - 1;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(
                orderCount,
            );

            const result = await service.autoAssignWholesaleRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith('WHOLESALE', 'threshold_not_met', false);
        });

        it('не должен назначать WHOLESALE роль, если роль уже назначена', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold + 5;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(
                orderCount,
            );
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockWholesaleRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([
                { roleId: 11 } as never,
            ]);

            const result = await service.autoAssignWholesaleRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(result.roleId).toBe(11);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith('WHOLESALE', 'already_assigned', false);
        });

        it('не должен назначать WHOLESALE роль, если пользователь не найден', async () => {
            (userModel.findByPk as jest.Mock).mockResolvedValue(null);

            const result = await service.autoAssignWholesaleRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith(
                'WHOLESALE',
                'user_not_found_or_wrong_tenant',
                false,
            );
        });

        it('не должен назначать WHOLESALE роль, если роль не найдена или неактивна', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold + 5;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(
                orderCount,
            );
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                null,
            );

            const result = await service.autoAssignWholesaleRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith(
                'WHOLESALE',
                'role_not_found_or_inactive',
                false,
            );
        });

        it('должен обработать ошибку при назначении WHOLESALE роли', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold + 5;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(
                orderCount,
            );
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockWholesaleRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([]);
            (roleRepository.assignRoleToUser as jest.Mock).mockRejectedValue(
                new Error('Database error'),
            );

            const result = await service.autoAssignWholesaleRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith('WHOLESALE', 'error', false);
        });
    });

    describe('evaluateAndUpdateCustomerRoles', () => {
        it('должен вызвать оба метода назначения ролей параллельно', async () => {
            const vipThreshold = getVipRoleThreshold();
            const wholesaleThreshold = getWholesaleRoleThreshold();

            (userModel.findByPk as jest.Mock)
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(
                vipThreshold + 10000,
            );
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(
                wholesaleThreshold + 5,
            );
            (roleCacheService.getCachedRole as jest.Mock)
                .mockResolvedValueOnce(mockVipRole)
                .mockResolvedValueOnce(mockWholesaleRole);
            (roleRepository.findUserRoles as jest.Mock)
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);
            (roleRepository.assignRoleToUser as jest.Mock)
                .mockResolvedValueOnce({
                    id: 1,
                    userId: 1,
                    roleId: 10,
                    tenantId: 1,
                })
                .mockResolvedValueOnce({
                    id: 2,
                    userId: 1,
                    roleId: 11,
                    tenantId: 1,
                });

            const result = await service.evaluateAndUpdateCustomerRoles(1, 1);

            expect(result.vipAssigned).toBe(true);
            expect(result.wholesaleAssigned).toBe(true);
        });

        it('должен вернуть false для обеих ролей, если пороги не достигнуты', async () => {
            const vipThreshold = getVipRoleThreshold();
            const wholesaleThreshold = getWholesaleRoleThreshold();

            (userModel.findByPk as jest.Mock)
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(
                vipThreshold - 1000,
            );
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(
                wholesaleThreshold - 1,
            );

            const result = await service.evaluateAndUpdateCustomerRoles(1, 1);

            expect(result.vipAssigned).toBe(false);
            expect(result.wholesaleAssigned).toBe(false);
            expect(result.vipRevoked).toBe(false);
            expect(result.wholesaleRevoked).toBe(false);
        });

        it('должен вернуть true только для VIP, если только VIP порог достигнут', async () => {
            const vipThreshold = getVipRoleThreshold();
            const wholesaleThreshold = getWholesaleRoleThreshold();

            (userModel.findByPk as jest.Mock)
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(
                vipThreshold + 10000,
            );
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(
                wholesaleThreshold - 1,
            );
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockVipRole,
            );
            (roleRepository.findUserRoles as jest.Mock)
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);
            (roleRepository.assignRoleToUser as jest.Mock).mockResolvedValue({
                id: 1,
                userId: 1,
                roleId: 10,
                tenantId: 1,
            } as never);

            const result = await service.evaluateAndUpdateCustomerRoles(1, 1);

            expect(result.vipAssigned).toBe(true);
            expect(result.wholesaleAssigned).toBe(false);
        });
    });

    describe('autoRevokeVipRole', () => {
        it('должен понизить VIP роль, если сумма покупок ниже порога и роль была автоматически назначена', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold - 1000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockVipRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([
                { roleId: 10 } as never,
            ]);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(
                totalSpent,
            );
            (roleRepository.revokeRoleFromUser as jest.Mock).mockResolvedValue(
                true,
            );

            (userRoleModel.findOne as jest.Mock).mockResolvedValue({
                metadata: { auto_assigned: true },
            });

            const result = await service.autoRevokeVipRole(1, 1);

            expect(result.revoked).toBe(true);
            expect(result.roleId).toBe(10);
            expect(roleRepository.revokeRoleFromUser).toHaveBeenCalledWith(
                1,
                10,
                1,
            );
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith('VIP_CUSTOMER', 'revoked', true);
        });

        it('не должен понижать VIP роль, если сумма покупок все еще >= порога', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold + 1000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockVipRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([
                { roleId: 10 } as never,
            ]);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(
                totalSpent,
            );

            (userRoleModel.findOne as jest.Mock).mockResolvedValue({
                metadata: { auto_assigned: true },
            });

            const result = await service.autoRevokeVipRole(1, 1);

            expect(result.revoked).toBe(false);
            expect(result.roleId).toBe(10);
            expect(roleRepository.revokeRoleFromUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
                'revoke_threshold_still_met',
                false,
            );
        });

        it('не должен понижать VIP роль, если она была назначена вручную администратором', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold - 1000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockVipRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([
                { roleId: 10 } as never,
            ]);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(
                totalSpent,
            );

            (userRoleModel.findOne as jest.Mock).mockResolvedValue({
                metadata: { auto_assigned: false },
            });

            const result = await service.autoRevokeVipRole(1, 1);

            expect(result.revoked).toBe(false);
            expect(result.roleId).toBe(10);
            expect(roleRepository.revokeRoleFromUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
                'revoke_skipped_manual_assignment',
                false,
            );
        });

        it('не должен понижать VIP роль, если роль не назначена', async () => {
            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockVipRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([]);

            const result = await service.autoRevokeVipRole(1, 1);

            expect(result.revoked).toBe(false);
            expect(roleRepository.revokeRoleFromUser).not.toHaveBeenCalled();
        });
    });

    describe('autoRevokeWholesaleRole', () => {
        it('должен понизить WHOLESALE роль, если количество заказов ниже порога и роль была автоматически назначена', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold - 1;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockWholesaleRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([
                { roleId: 11 } as never,
            ]);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(
                orderCount,
            );
            (roleRepository.revokeRoleFromUser as jest.Mock).mockResolvedValue(
                true,
            );

            (userRoleModel.findOne as jest.Mock).mockResolvedValue({
                metadata: { auto_assigned: true },
            });

            const result = await service.autoRevokeWholesaleRole(1, 1);

            expect(result.revoked).toBe(true);
            expect(result.roleId).toBe(11);
            expect(roleRepository.revokeRoleFromUser).toHaveBeenCalledWith(
                1,
                11,
                1,
            );
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith('WHOLESALE', 'revoked', true);
        });

        it('не должен понижать WHOLESALE роль, если количество заказов все еще >= порога', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold + 5;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockWholesaleRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([
                { roleId: 11 } as never,
            ]);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(
                orderCount,
            );

            (userRoleModel.findOne as jest.Mock).mockResolvedValue({
                metadata: { auto_assigned: true },
            });

            const result = await service.autoRevokeWholesaleRole(1, 1);

            expect(result.revoked).toBe(false);
            expect(result.roleId).toBe(11);
            expect(roleRepository.revokeRoleFromUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith(
                'WHOLESALE',
                'revoke_threshold_still_met',
                false,
            );
        });

        it('не должен понижать WHOLESALE роль, если она была назначена вручную администратором', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold - 1;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (roleCacheService.getCachedRole as jest.Mock).mockResolvedValue(
                mockWholesaleRole,
            );
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([
                { roleId: 11 } as never,
            ]);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(
                orderCount,
            );

            (userRoleModel.findOne as jest.Mock).mockResolvedValue({
                metadata: { auto_assigned: false },
            });

            const result = await service.autoRevokeWholesaleRole(1, 1);

            expect(result.revoked).toBe(false);
            expect(result.roleId).toBe(11);
            expect(roleRepository.revokeRoleFromUser).not.toHaveBeenCalled();
            expect(
                metricsCollector.recordRoleAutoAssignment,
            ).toHaveBeenCalledWith(
                'WHOLESALE',
                'revoke_skipped_manual_assignment',
                false,
            );
        });
    });

    describe('evaluateAndUpdateCustomerRoles with revocation', () => {
        it('должен проверить назначение и понижение ролей параллельно', async () => {
            // Спаим методы autoAssign/autoRevoke напрямую, чтобы избежать вызова реальной логики
            jest.spyOn(service, 'autoAssignVipRole').mockResolvedValue({
                assigned: true,
                roleId: 10,
            });

            jest.spyOn(service, 'autoAssignWholesaleRole').mockResolvedValue({
                assigned: false,
            });

            jest.spyOn(service, 'autoRevokeVipRole').mockResolvedValue({
                revoked: false,
            });

            jest.spyOn(service, 'autoRevokeWholesaleRole').mockResolvedValue({
                revoked: false,
            });

            const result = await service.evaluateAndUpdateCustomerRoles(1, 1);

            expect(result.vipAssigned).toBe(true);
            expect(result.wholesaleAssigned).toBe(false);
            expect(result.vipRevoked).toBe(false);
            expect(result.wholesaleRevoked).toBe(false);

            // Проверяем, что методы были вызваны параллельно
            expect(service.autoAssignVipRole).toHaveBeenCalledWith(1, 1);
            expect(service.autoAssignWholesaleRole).toHaveBeenCalledWith(1, 1);
            expect(service.autoRevokeVipRole).toHaveBeenCalledWith(1, 1);
            expect(service.autoRevokeWholesaleRole).toHaveBeenCalledWith(1, 1);
        });
    });
});
