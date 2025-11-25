import type { UserModel } from '@app/domain/models';
import { OrderRepository, RoleRepository } from '@app/infrastructure/repositories';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { RoleService } from '../role.service';
import { getVipRoleThreshold, getWholesaleRoleThreshold } from '@app/infrastructure/controllers/role/role-constants';
import { Test, type TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { UserModel as UserModelType } from '@app/domain/models';

describe('RoleService - Auto Role Assignment', () => {
    let service: RoleService;
    let roleRepository: jest.Mocked<RoleRepository>;
    let orderRepository: jest.Mocked<OrderRepository>;
    let userModel: jest.Mocked<typeof UserModelType>;
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
    };

    const mockWholesaleRole = {
        id: 11,
        role: 'WHOLESALE',
        isActive: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleService,
                {
                    provide: RoleRepository,
                    useValue: {
                        findRoleByName: jest.fn(),
                        findUserRoles: jest.fn(),
                        assignRoleToUser: jest.fn(),
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
                    provide: getModelToken(UserModelType),
                    useValue: {
                        findByPk: jest.fn(),
                    },
                },
                {
                    provide: MetricsCollector,
                    useValue: {
                        recordRoleAutoAssignment: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<RoleService>(RoleService);
        roleRepository = module.get(RoleRepository);
        orderRepository = module.get(OrderRepository);
        userModel = module.get(getModelToken(UserModelType));
        metricsCollector = module.get(MetricsCollector);

        jest.clearAllMocks();
    });

    describe('autoAssignVipRole', () => {
        it('должен назначить VIP роль, если сумма покупок превышает порог', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold + 10000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(totalSpent);
            (roleRepository.findRoleByName as jest.Mock).mockResolvedValue(mockVipRole);
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
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
                'assigned',
                true,
            );
        });

        it('не должен назначать VIP роль, если сумма покупок меньше порога', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold - 1000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(totalSpent);

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
                'threshold_not_met',
                false,
            );
        });

        it('не должен назначать VIP роль, если роль уже назначена', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold + 10000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(totalSpent);
            (roleRepository.findRoleByName as jest.Mock).mockResolvedValue(mockVipRole);
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([
                { roleId: 10 } as never,
            ]);

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(result.roleId).toBe(10);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
                'already_assigned',
                false,
            );
        });

        it('не должен назначать VIP роль, если пользователь не найден', async () => {
            (userModel.findByPk as jest.Mock).mockResolvedValue(null);

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
                'user_not_found_or_wrong_tenant',
                false,
            );
        });

        it('не должен назначать VIP роль, если пользователь принадлежит другому тенанту', async () => {
            const wrongTenantUser = { ...mockUser, tenantId: 2 } as UserModel;

            (userModel.findByPk as jest.Mock).mockResolvedValue(wrongTenantUser);

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
                'user_not_found_or_wrong_tenant',
                false,
            );
        });

        it('не должен назначать VIP роль, если роль не найдена или неактивна', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold + 10000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(totalSpent);
            (roleRepository.findRoleByName as jest.Mock).mockResolvedValue(null);

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
                'role_not_found_or_inactive',
                false,
            );
        });

        it('должен обработать ошибку при назначении VIP роли', async () => {
            const vipThreshold = getVipRoleThreshold();
            const totalSpent = vipThreshold + 10000;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserTotalSpent as jest.Mock).mockResolvedValue(totalSpent);
            (roleRepository.findRoleByName as jest.Mock).mockResolvedValue(mockVipRole);
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([]);
            (roleRepository.assignRoleToUser as jest.Mock).mockRejectedValue(
                new Error('Database error'),
            );

            const result = await service.autoAssignVipRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
                'error',
                false,
            );
        });
    });

    describe('autoAssignWholesaleRole', () => {
        it('должен назначить WHOLESALE роль, если количество заказов превышает порог', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold + 5;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(orderCount);
            (roleRepository.findRoleByName as jest.Mock).mockResolvedValue(mockWholesaleRole);
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
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'WHOLESALE',
                'assigned',
                true,
            );
        });

        it('не должен назначать WHOLESALE роль, если количество заказов меньше порога', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold - 1;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(orderCount);

            const result = await service.autoAssignWholesaleRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'WHOLESALE',
                'threshold_not_met',
                false,
            );
        });

        it('не должен назначать WHOLESALE роль, если роль уже назначена', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold + 5;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(orderCount);
            (roleRepository.findRoleByName as jest.Mock).mockResolvedValue(mockWholesaleRole);
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([
                { roleId: 11 } as never,
            ]);

            const result = await service.autoAssignWholesaleRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(result.roleId).toBe(11);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'WHOLESALE',
                'already_assigned',
                false,
            );
        });

        it('не должен назначать WHOLESALE роль, если пользователь не найден', async () => {
            (userModel.findByPk as jest.Mock).mockResolvedValue(null);

            const result = await service.autoAssignWholesaleRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'WHOLESALE',
                'user_not_found_or_wrong_tenant',
                false,
            );
        });

        it('не должен назначать WHOLESALE роль, если роль не найдена или неактивна', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold + 5;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(orderCount);
            (roleRepository.findRoleByName as jest.Mock).mockResolvedValue(null);

            const result = await service.autoAssignWholesaleRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'WHOLESALE',
                'role_not_found_or_inactive',
                false,
            );
        });

        it('должен обработать ошибку при назначении WHOLESALE роли', async () => {
            const wholesaleThreshold = getWholesaleRoleThreshold();
            const orderCount = wholesaleThreshold + 5;

            (userModel.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (orderRepository.getUserOrderCount as jest.Mock).mockResolvedValue(orderCount);
            (roleRepository.findRoleByName as jest.Mock).mockResolvedValue(mockWholesaleRole);
            (roleRepository.findUserRoles as jest.Mock).mockResolvedValue([]);
            (roleRepository.assignRoleToUser as jest.Mock).mockRejectedValue(
                new Error('Database error'),
            );

            const result = await service.autoAssignWholesaleRole(1, 1);

            expect(result.assigned).toBe(false);
            expect(metricsCollector.recordRoleAutoAssignment).toHaveBeenCalledWith(
                'WHOLESALE',
                'error',
                false,
            );
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
            (roleRepository.findRoleByName as jest.Mock)
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
            (roleRepository.findRoleByName as jest.Mock).mockResolvedValue(mockVipRole);
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
});

