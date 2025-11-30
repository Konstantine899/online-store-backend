import type { RoleModel, UserModel } from '@app/domain/models';
import {
    UserModel as UserModelType,
    UserRoleModel as UserRoleModelType,
} from '@app/domain/models';
import { MetricsCollector } from '@app/infrastructure/common/services';
import type {
    AssignPermissionDto,
    AssignRoleDto,
    CreateRoleDto,
    RevokePermissionDto,
    RevokeRoleDto,
    UpdateRoleDto,
} from '@app/infrastructure/dto';
import {
    RoleNotFoundException,
    TenantIsolationViolationException,
} from '@app/infrastructure/exceptions';
import {
    OrderRepository,
    RoleRepository,
} from '@app/infrastructure/repositories';
import type {
    CreateRoleResponse,
    GetListRoleResponse,
    GetRoleResponse,
} from '@app/infrastructure/responses';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Test, type TestingModule } from '@nestjs/testing';
import { RoleCacheService } from '../role-cache.service';
import { RoleService } from '../role.service';
import { UserRolesCacheService } from '../user-roles-cache.service';

describe('RoleService (unit)', () => {
    let service: RoleService;
    let roleRepository: jest.Mocked<RoleRepository>;
    let roleCacheService: jest.Mocked<RoleCacheService>;
    let userRolesCacheService: jest.Mocked<UserRolesCacheService>;
    let userModel: jest.Mocked<typeof UserModelType>;

    const mockRole: GetRoleResponse & { getDataValue: jest.Mock } = {
        id: 1,
        role: 'TEST_ROLE',
        description: 'Test role',
        level: 50,
        isSystemRole: false,
        isActive: true,
        tenantId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
        getDataValue: jest.fn((key: string) => {
            if (key === 'isActive') return true;
            return undefined;
        }),
    };

    const mockUser = {
        id: 1,
        userId: 1,
        email: 'test@example.com',
        tenantId: 1,
        isActive: true,
    } as unknown as UserModel;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleService,
                {
                    provide: RoleRepository,
                    useValue: {
                        createRole: jest.fn(),
                        findRole: jest.fn(),
                        findRoleById: jest.fn(),
                        findRoleByName: jest.fn(),
                        findRoleByIdWithoutIsolation: jest.fn(),
                        findListRole: jest.fn(),
                        findAllRolesGrouped: jest.fn(),
                        updateRole: jest.fn(),
                        deleteRole: jest.fn(),
                        createRolePermission: jest.fn(),
                        deleteRolePermission: jest.fn(),
                        findRolePermissions: jest.fn(),
                        assignRoleToUser: jest.fn(),
                        revokeRoleFromUser: jest.fn(),
                        findUserRoles: jest.fn(),
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
            ],
        }).compile();

        service = module.get<RoleService>(RoleService);
        roleRepository = module.get(RoleRepository);
        roleCacheService = module.get(RoleCacheService);
        userRolesCacheService = module.get(UserRolesCacheService);
        userModel = module.get(getModelToken(UserModelType));

        jest.clearAllMocks();
    });

    // ========================================================================
    // CRUD ОПЕРАЦИИ
    // ========================================================================

    describe('createRole', () => {
        it('должен создать роль', async () => {
            const dto: CreateRoleDto = {
                role: 'NEW_ROLE',
                description: 'New role description',
                level: 45,
                isSystemRole: false,
            };

            const expectedResponse: CreateRoleResponse = {
                ...mockRole,
                role: 'NEW_ROLE',
                description: 'New role description',
            };

            roleRepository.createRole.mockResolvedValue(expectedResponse);

            const result = await service.createRole(dto);

            expect(result).toEqual(expectedResponse);
            expect(roleRepository.createRole).toHaveBeenCalledWith(dto);
        });
    });

    describe('getRole', () => {
        it('должен получить роль по названию', async () => {
            roleRepository.findRole.mockResolvedValue(mockRole);

            const result = await service.getRole('TEST_ROLE', 1);

            expect(result).toEqual(mockRole);
            expect(roleRepository.findRole).toHaveBeenCalledWith(
                'TEST_ROLE',
                1,
            );
        });

        it('должен выбросить RoleNotFoundException, если роль не найдена', async () => {
            roleRepository.findRole.mockResolvedValue(
                null as unknown as GetRoleResponse,
            );

            await expect(service.getRole('NONEXISTENT', 1)).rejects.toThrow(
                RoleNotFoundException,
            );
        });
    });

    describe('getListRole', () => {
        it('должен получить список ролей', async () => {
            const mockRoles: GetListRoleResponse[] = [mockRole];
            roleRepository.findListRole.mockResolvedValue(mockRoles);

            const result = await service.getListRole(1);

            expect(result).toEqual(mockRoles);
            expect(roleRepository.findListRole).toHaveBeenCalledWith(1);
        });

        it('должен выбросить ошибку, если роли не найдены', async () => {
            roleRepository.findListRole.mockResolvedValue(
                null as unknown as GetListRoleResponse[],
            );

            await expect(service.getListRole(1)).rejects.toThrow();
        });
    });

    describe('updateRole', () => {
        it('должен обновить роль', async () => {
            const dto: UpdateRoleDto = {
                description: 'Updated description',
            };

            const updatedRole = {
                ...mockRole,
                description: 'Updated description',
            };
            const mockPermissions: Array<{
                id: number;
                resource: string;
                action: string;
                conditions: Record<string, unknown> | null;
            }> = [];

            roleRepository.updateRole.mockResolvedValue(
                updatedRole as unknown as RoleModel,
            );
            roleRepository.findRolePermissions.mockResolvedValue(
                mockPermissions,
            );

            const result = await service.updateRole(1, dto, 1);

            expect(result).toHaveProperty('id', 1);
            expect(result).toHaveProperty('description', 'Updated description');
            expect(roleRepository.updateRole).toHaveBeenCalledWith(1, dto, 1);
            expect(roleRepository.findRolePermissions).toHaveBeenCalledWith(1);
        });
    });

    describe('deleteRole', () => {
        it('должен удалить роль', async () => {
            roleRepository.findRoleById.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );
            roleRepository.deleteRole.mockResolvedValue(true);

            const result = await service.deleteRole(1, 1);

            expect(result).toHaveProperty('message', 'Роль успешно удалена');
            expect(result).toHaveProperty('id', 1);
            expect(result).toHaveProperty('role', 'TEST_ROLE');
            expect(roleRepository.findRoleById).toHaveBeenCalledWith(1, 1);
            expect(roleRepository.deleteRole).toHaveBeenCalledWith(1, 1);
        });

        it('должен выбросить RoleNotFoundException, если роль не найдена', async () => {
            roleRepository.findRoleById.mockResolvedValue(null);

            await expect(service.deleteRole(999, 1)).rejects.toThrow(
                RoleNotFoundException,
            );
        });

        it('должен выбросить RoleNotFoundException, если удаление не удалось', async () => {
            roleRepository.findRoleById.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );
            roleRepository.deleteRole.mockResolvedValue(false);

            await expect(service.deleteRole(1, 1)).rejects.toThrow(
                RoleNotFoundException,
            );
        });
    });

    // ========================================================================
    // УПРАВЛЕНИЕ РАЗРЕШЕНИЯМИ
    // ========================================================================

    describe('assignPermission', () => {
        it('должен назначить разрешение роли', async () => {
            const dto: AssignPermissionDto = {
                roleId: 1,
                resource: 'products',
                action: 'read',
            };

            const mockPermission = {
                id: 1,
                roleId: 1,
                resource: 'products',
                action: 'read',
                conditions: null,
            };

            roleRepository.findRoleById.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );
            roleRepository.createRolePermission.mockResolvedValue(
                mockPermission,
            );

            const result = await service.assignPermission(dto, 1);

            expect(result).toHaveProperty('permissionId', 1);
            expect(result).toHaveProperty('roleId', 1);
            expect(result).toHaveProperty('resource', 'products');
            expect(result).toHaveProperty('action', 'read');
            expect(roleRepository.findRoleById).toHaveBeenCalledWith(1, 1);
            expect(roleRepository.createRolePermission).toHaveBeenCalledWith(
                1,
                'products',
                'read',
                undefined,
            );
        });

        it('должен выбросить ошибку, если роль не найдена', async () => {
            const dto: AssignPermissionDto = {
                roleId: 999,
                resource: 'products',
                action: 'read',
            };

            roleRepository.findRoleById.mockResolvedValue(null);

            await expect(service.assignPermission(dto, 1)).rejects.toThrow();
        });
    });

    describe('revokePermission', () => {
        it('должен отозвать разрешение у роли', async () => {
            const dto: RevokePermissionDto = {
                roleId: 1,
                resource: 'products',
                action: 'read',
            };

            roleRepository.findRoleById.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );
            roleRepository.deleteRolePermission.mockResolvedValue(true);

            const result = await service.revokePermission(dto, 1);

            expect(result).toHaveProperty('message');
            expect(roleRepository.findRoleById).toHaveBeenCalledWith(1, 1);
            expect(roleRepository.deleteRolePermission).toHaveBeenCalledWith(
                1,
                'products',
                'read',
            );
        });

        it('должен выбросить ошибку, если роль не найдена', async () => {
            const dto: RevokePermissionDto = {
                roleId: 999,
                resource: 'products',
                action: 'read',
            };

            roleRepository.findRoleById.mockResolvedValue(null);

            await expect(service.revokePermission(dto, 1)).rejects.toThrow();
        });
    });

    describe('getRolePermissions', () => {
        it('должен получить разрешения роли', async () => {
            const mockPermissions = [
                {
                    id: 1,
                    roleId: 1,
                    resource: 'products',
                    action: 'read',
                    conditions: null,
                },
            ];

            roleRepository.findRoleById.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );
            roleRepository.findRolePermissions.mockResolvedValue(
                mockPermissions,
            );

            const result = await service.getRolePermissions(1, 1);

            expect(result).toHaveProperty('roleId', 1);
            expect(result).toHaveProperty('roleName', 'TEST_ROLE');
            expect(result).toHaveProperty('permissions');
            expect(result.permissions).toHaveLength(1);
            expect(roleRepository.findRoleById).toHaveBeenCalledWith(1, 1);
            expect(roleRepository.findRolePermissions).toHaveBeenCalledWith(1);
        });

        it('должен выбросить RoleNotFoundException, если роль не найдена', async () => {
            roleRepository.findRoleById.mockResolvedValue(null);

            await expect(service.getRolePermissions(999, 1)).rejects.toThrow(
                RoleNotFoundException,
            );
        });
    });

    // ========================================================================
    // НАЗНАЧЕНИЕ РОЛЕЙ ПОЛЬЗОВАТЕЛЯМ
    // ========================================================================

    describe('assignRoleToUser', () => {
        it('должен назначить роль пользователю', async () => {
            const dto: AssignRoleDto = {
                userId: 1,
                roleId: 1,
            };

            const mockUserRole = {
                id: 1,
                userId: 1,
                roleId: 1,
                tenantId: 1,
            };

            userModel.findByPk.mockResolvedValue(mockUser);
            roleRepository.findRoleByIdWithoutIsolation.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );
            roleRepository.findRoleById.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );
            roleRepository.assignRoleToUser.mockResolvedValue(
                mockUserRole as unknown as UserRoleModelType,
            );

            const result = await service.assignRoleToUser(dto, 1, ['MANAGER']);

            expect(result).toHaveProperty('userId', 1);
            expect(result).toHaveProperty('roleId', 1);
            expect(userModel.findByPk).toHaveBeenCalledWith(1);
            expect(roleRepository.findRoleById).toHaveBeenCalledWith(1, 1);
            expect(roleRepository.assignRoleToUser).toHaveBeenCalled();
        });

        it('должен выбросить ошибку, если пользователь не найден', async () => {
            const dto: AssignRoleDto = {
                userId: 999,
                roleId: 1,
            };

            userModel.findByPk.mockResolvedValue(null);

            await expect(
                service.assignRoleToUser(dto, 1, ['MANAGER']),
            ).rejects.toThrow();
        });

        it('должен выбросить TenantIsolationViolationException при нарушении tenant isolation', async () => {
            const dto: AssignRoleDto = {
                userId: 1,
                roleId: 1,
            };

            const userFromDifferentTenant = {
                ...mockUser,
                tenantId: 2,
            };

            userModel.findByPk.mockResolvedValue(
                userFromDifferentTenant as unknown as UserModel,
            );

            await expect(
                service.assignRoleToUser(dto, 1, ['MANAGER']),
            ).rejects.toThrow(TenantIsolationViolationException);
        });

        it('должен выбросить BadRequestException, если роль неактивна', async () => {
            const dto: AssignRoleDto = {
                userId: 1,
                roleId: 1,
            };

            const inactiveRole = {
                ...mockRole,
                isActive: false,
                getDataValue: jest.fn().mockReturnValue(false),
            };

            userModel.findByPk.mockResolvedValue(mockUser);
            roleRepository.findRoleByIdWithoutIsolation.mockResolvedValue(
                inactiveRole as unknown as RoleModel,
            );
            roleRepository.findRoleById.mockResolvedValue(
                inactiveRole as unknown as RoleModel,
            );

            await expect(
                service.assignRoleToUser(dto, 1, ['MANAGER']),
            ).rejects.toThrow(BadRequestException);
        });

        it('должен выбросить BadRequestException, если дата истечения в прошлом', async () => {
            const dto: AssignRoleDto = {
                userId: 1,
                roleId: 1,
                expiresAt: new Date('2020-01-01').toISOString(),
            };

            userModel.findByPk.mockResolvedValue(mockUser);
            roleRepository.findRoleByIdWithoutIsolation.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );
            roleRepository.findRoleById.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );

            await expect(
                service.assignRoleToUser(dto, 1, ['MANAGER']),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('revokeRoleFromUser', () => {
        it('должен отозвать роль у пользователя', async () => {
            const dto: RevokeRoleDto = {
                userId: 1,
                roleId: 1,
            };

            userModel.findByPk.mockResolvedValue(mockUser);
            roleRepository.findRoleByIdWithoutIsolation.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );
            roleRepository.findRoleById.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );
            roleRepository.revokeRoleFromUser.mockResolvedValue(true);

            const result = await service.revokeRoleFromUser(dto, 1, [
                'MANAGER',
            ]);

            expect(result).toHaveProperty('message');
            expect(userModel.findByPk).toHaveBeenCalledWith(1);
            expect(roleRepository.revokeRoleFromUser).toHaveBeenCalled();
        });

        it('должен выбросить ошибку, если роль не найдена', async () => {
            const dto: RevokeRoleDto = {
                userId: 1,
                roleId: 999,
            };

            userModel.findByPk.mockResolvedValue(mockUser);
            roleRepository.findRoleByIdWithoutIsolation.mockResolvedValue(null);

            await expect(
                service.revokeRoleFromUser(dto, 1, ['MANAGER']),
            ).rejects.toThrow(RoleNotFoundException);
        });
    });

    describe('getUserRoles', () => {
        it('должен получить роли пользователя', async () => {
            const mockUserRoles = [
                {
                    id: 1,
                    userId: 1,
                    roleId: 1,
                    role: mockRole,
                },
            ];

            userModel.findByPk.mockResolvedValue(mockUser);
            userRolesCacheService.getUserRoles.mockResolvedValue(null);
            roleRepository.findUserRoles.mockResolvedValue(
                mockUserRoles as unknown as Array<{
                    id: number;
                    roleId: number;
                    roleName: string;
                    roleDescription: string;
                    roleLevel: number;
                    tenantId: number;
                    grantedAt: Date;
                    expiresAt: Date | null;
                    isActive: boolean;
                    metadata?: Record<string, unknown>;
                }>,
            );

            const result = await service.getUserRoles(1, 1);

            expect(result).toHaveProperty('userId', 1);
            expect(result).toHaveProperty('roles');
            expect(userModel.findByPk).toHaveBeenCalledWith(1);
            expect(roleRepository.findUserRoles).toHaveBeenCalledWith(1, 1);
        });
    });

    // ========================================================================
    // ИЕРАРХИЯ РОЛЕЙ
    // ========================================================================

    describe('getRoleHierarchy', () => {
        it('должен получить иерархию ролей', async () => {
            const mockAllRoles = [
                { ...mockRole, role: 'SUPER_ADMIN' },
                { ...mockRole, role: 'TENANT_ADMIN' },
                { ...mockRole, role: 'CUSTOMER' },
            ];

            roleRepository.findAllRolesGrouped.mockResolvedValue(
                mockAllRoles as unknown as RoleModel[],
            );

            const result = await service.getRoleHierarchy();

            expect(result).toHaveProperty('systemRoles');
            expect(result).toHaveProperty('tenantRoles');
            expect(result).toHaveProperty('customerRoles');
            expect(result).toHaveProperty('totalCount', 3);
            expect(roleRepository.findAllRolesGrouped).toHaveBeenCalled();
        });
    });

    describe('getRoleLevel', () => {
        it('должен получить уровень роли', async () => {
            // Используем реальное название роли, которое есть в константах
            const roleName = 'TENANT_ADMIN';
            const roleWithRealName = { ...mockRole, role: roleName };

            roleCacheService.getCachedRole.mockResolvedValue(
                roleWithRealName as unknown as RoleModel,
            );

            const result = await service.getRoleLevel(roleName);

            expect(result).toHaveProperty('role', roleName);
            expect(result).toHaveProperty('level');
            expect(result.level).toBeGreaterThan(0); // Уровень должен быть > 0 для реальной роли
            expect(result).toHaveProperty('category');
            expect(result).toHaveProperty('manageableRoles');
            expect(roleCacheService.getCachedRole).toHaveBeenCalledWith(
                roleName,
            );
        });

        it('должен выбросить ошибку, если роль не найдена', async () => {
            roleCacheService.getCachedRole.mockResolvedValue(null);

            await expect(service.getRoleLevel('NONEXISTENT')).rejects.toThrow();
        });
    });
});
