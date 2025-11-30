import {
    RoleModel,
    RolePermissionModel,
    UserModel,
    UserRoleModel,
} from '@app/domain/models';
import type { CreateRoleDto } from '@app/infrastructure/dto';
import { ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Op } from 'sequelize';
import { RoleRepository } from '../role.repository';

describe('RoleRepository (unit)', () => {
    let repository: RoleRepository;
    let roleModelMock: jest.Mocked<typeof RoleModel>;
    let rolePermissionModelMock: jest.Mocked<typeof RolePermissionModel>;
    let userRoleModelMock: jest.Mocked<typeof UserRoleModel>;
    let userModelMock: jest.Mocked<typeof UserModel>;

    // Тестовые данные
    const mockRole = {
        id: 1,
        role: 'TEST_ROLE',
        description: 'Test role description',
        level: 50,
        permissions: ['test:read', 'test:write'],
        isSystemRole: false,
        isActive: true,
        tenantId: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        reload: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn().mockResolvedValue(undefined),
    };

    const mockSystemRole = {
        id: 2,
        role: 'SYSTEM_ROLE',
        description: 'System role',
        level: 100,
        permissions: ['*'],
        isSystemRole: true,
        isActive: true,
        tenantId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        reload: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(async () => {
        // Создаём моки для всех моделей
        roleModelMock = {
            create: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            findByPk: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
        } as unknown as jest.Mocked<typeof RoleModel>;

        rolePermissionModelMock = {
            create: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            destroy: jest.fn(),
        } as unknown as jest.Mocked<typeof RolePermissionModel>;

        userRoleModelMock = {
            create: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            destroy: jest.fn(),
        } as unknown as jest.Mocked<typeof UserRoleModel>;

        userModelMock = {
            findByPk: jest.fn(),
        } as unknown as jest.Mocked<typeof UserModel>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleRepository,
                {
                    provide: getModelToken(RoleModel),
                    useValue: roleModelMock,
                },
                {
                    provide: getModelToken(RolePermissionModel),
                    useValue: rolePermissionModelMock,
                },
                {
                    provide: getModelToken(UserRoleModel),
                    useValue: userRoleModelMock,
                },
                {
                    provide: getModelToken(UserModel),
                    useValue: userModelMock,
                },
            ],
        }).compile();

        repository = module.get<RoleRepository>(RoleRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createRole', () => {
        it('должен создать роль успешно', async () => {
            const dto: CreateRoleDto = {
                role: 'TEST_ROLE',
                description: 'Test role description',
                level: 50,
                permissions: ['test:read', 'test:write'],
                isSystemRole: false,
                isActive: true,
                tenantId: 1,
            };

            roleModelMock.create.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );

            const result = await repository.createRole(dto);

            expect(roleModelMock.create).toHaveBeenCalledWith({
                role: dto.role,
                description: dto.description,
                level: dto.level,
                permissions: dto.permissions,
                isSystemRole: dto.isSystemRole,
                isActive: dto.isActive,
                tenantId: dto.tenantId,
            });
            expect(result).toEqual(mockRole);
        });

        it('должен создать системную роль с tenantId = null', async () => {
            const dto: CreateRoleDto = {
                role: 'SYSTEM_ROLE',
                description: 'System role',
                level: 100,
                permissions: ['*'],
                isSystemRole: true,
                isActive: true,
                tenantId: 1, // должен быть проигнорирован для системной роли
            };

            roleModelMock.create.mockResolvedValue(
                mockSystemRole as unknown as RoleModel,
            );

            await repository.createRole(dto);

            expect(roleModelMock.create).toHaveBeenCalledWith({
                role: dto.role,
                description: dto.description,
                level: dto.level,
                permissions: dto.permissions,
                isSystemRole: true,
                isActive: dto.isActive,
                tenantId: null, // Системная роль должна иметь tenantId = null
            });
        });

        it('должен выбросить ConflictException при дублировании роли', async () => {
            const dto: CreateRoleDto = {
                role: 'DUPLICATE_ROLE',
                description: 'Duplicate role',
                level: 50,
                isSystemRole: false,
                tenantId: 1,
            };

            const error = new Error('Unique constraint failed');
            error.name = 'SequelizeUniqueConstraintError';
            roleModelMock.create.mockRejectedValue(error);

            await expect(repository.createRole(dto)).rejects.toThrow(
                ConflictException,
            );
            await expect(repository.createRole(dto)).rejects.toThrow(
                'Роль уже существует',
            );
        });

        it('должен использовать значения по умолчанию', async () => {
            const dto: CreateRoleDto = {
                role: 'MINIMAL_ROLE',
                description: 'Minimal role',
                isSystemRole: false,
                tenantId: 1,
            };

            roleModelMock.create.mockResolvedValue({
                ...mockRole,
                role: dto.role,
                description: dto.description,
                level: 0,
                permissions: [],
                isSystemRole: false,
                isActive: true,
            } as unknown as RoleModel);

            await repository.createRole(dto);

            expect(roleModelMock.create).toHaveBeenCalledWith({
                role: dto.role,
                description: dto.description,
                level: 0,
                permissions: [],
                isSystemRole: false,
                isActive: true,
                tenantId: 1,
            });
        });
    });

    describe('findRole', () => {
        it('должен найти роль тенанта', async () => {
            roleModelMock.findOne.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );

            const result = await repository.findRole('TEST_ROLE', 1);

            expect(roleModelMock.findOne).toHaveBeenCalledWith({
                where: {
                    [Op.or]: [
                        { role: 'TEST_ROLE', tenantId: 1, isSystemRole: false },
                        {
                            role: 'TEST_ROLE',
                            isSystemRole: true,
                            tenantId: null,
                        },
                    ],
                },
            });
            expect(result).toEqual(mockRole);
        });

        it('должен найти системную роль', async () => {
            roleModelMock.findOne.mockResolvedValue(
                mockSystemRole as unknown as RoleModel,
            );

            const result = await repository.findRole('SYSTEM_ROLE', 1);

            expect(result).toEqual(mockSystemRole);
        });

        it('должен вернуть null если роль не найдена', async () => {
            roleModelMock.findOne.mockResolvedValue(null);

            const result = await repository.findRole('NONEXISTENT_ROLE', 1);

            expect(result).toBeNull();
        });

        it('должен искать без tenant isolation когда tenantId undefined', async () => {
            roleModelMock.findOne.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );

            await repository.findRole('TEST_ROLE', undefined);

            expect(roleModelMock.findOne).toHaveBeenCalledWith({
                where: { role: 'TEST_ROLE' },
            });
        });

        it('должен выбросить ошибку если role пустой', async () => {
            await expect(repository.findRole('', 1)).rejects.toThrow(
                'Role parameter is required',
            );
        });
    });

    describe('findListRole', () => {
        it('должен вернуть роли тенанта + системные роли', async () => {
            roleModelMock.findAll.mockResolvedValue([
                mockRole,
                mockSystemRole,
            ] as unknown as RoleModel[]);

            const result = await repository.findListRole(1);

            expect(roleModelMock.findAll).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(result).toContain(mockRole);
            expect(result).toContain(mockSystemRole);
        });

        it('должен вернуть только системные роли для нового тенанта', async () => {
            roleModelMock.findAll.mockResolvedValue([
                mockSystemRole,
            ] as unknown as RoleModel[]);

            const result = await repository.findListRole(999);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockSystemRole);
        });

        it('должен вернуть все роли когда tenantId undefined', async () => {
            roleModelMock.findAll.mockResolvedValue([
                mockRole,
                mockSystemRole,
            ] as unknown as RoleModel[]);

            const result = await repository.findListRole(undefined);

            expect(result).toHaveLength(2);
        });
    });

    describe('findRoleById', () => {
        it('должен найти роль по ID с tenant isolation', async () => {
            roleModelMock.findOne.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );

            const result = await repository.findRoleById(1, 1);

            expect(roleModelMock.findOne).toHaveBeenCalled();
            expect(result).toEqual(mockRole);
        });

        it('должен вернуть null для роли другого тенанта', async () => {
            roleModelMock.findOne.mockResolvedValue(null);

            const result = await repository.findRoleById(1, 999);

            expect(result).toBeNull();
        });

        it('должен найти системную роль для любого тенанта', async () => {
            roleModelMock.findOne.mockResolvedValue(
                mockSystemRole as unknown as RoleModel,
            );

            const result = await repository.findRoleById(2, 999);

            expect(result).toEqual(mockSystemRole);
        });
    });

    describe('findRoleByIdWithoutIsolation', () => {
        it('должен найти роль без tenant isolation', async () => {
            roleModelMock.findOne.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );

            const result = await repository.findRoleByIdWithoutIsolation(1);

            expect(roleModelMock.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(result).toEqual(mockRole);
        });

        it('должен вернуть null если роль не существует', async () => {
            roleModelMock.findOne.mockResolvedValue(null);

            const result = await repository.findRoleByIdWithoutIsolation(999);

            expect(result).toBeNull();
        });
    });

    describe('deleteRole', () => {
        it('должен удалить роль успешно', async () => {
            roleModelMock.findOne.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );

            const result = await repository.deleteRole(1, 1);

            expect(mockRole.destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('должен вернуть false если роль не найдена', async () => {
            roleModelMock.findOne.mockResolvedValue(null);

            const result = await repository.deleteRole(999, 1);

            expect(result).toBe(false);
        });

        it('должен вернуть false для роли другого тенанта', async () => {
            roleModelMock.findOne.mockResolvedValue(null);

            const result = await repository.deleteRole(1, 999);

            expect(result).toBe(false);
        });
    });

    describe('assignRoleToUser', () => {
        const mockUserRole = {
            id: 1,
            userId: 10,
            roleId: 1,
            tenantId: 1,
            grantedBy: 5,
            grantedAt: new Date(),
            expiresAt: null,
            isActive: true,
            metadata: {},
        };

        it('должен назначить роль пользователю', async () => {
            userRoleModelMock.create.mockResolvedValue(
                mockUserRole as unknown as UserRoleModel,
            );

            const result = await repository.assignRoleToUser(
                10,
                1,
                1,
                5,
                null,
                {},
            );

            expect(userRoleModelMock.create).toHaveBeenCalledWith({
                userId: 10,
                roleId: 1,
                tenantId: 1,
                grantedBy: 5,
                grantedAt: expect.any(Date),
                expiresAt: null,
                isActive: true,
                metadata: {},
            });
            expect(result).toEqual({
                id: mockUserRole.id,
                userId: mockUserRole.userId,
                roleId: mockUserRole.roleId,
                tenantId: mockUserRole.tenantId,
            });
        });

        it('должен назначить роль с датой истечения', async () => {
            const expiresAt = new Date('2025-01-01');
            userRoleModelMock.create.mockResolvedValue({
                ...mockUserRole,
                expiresAt,
            } as unknown as UserRoleModel);

            await repository.assignRoleToUser(10, 1, 1, 5, expiresAt, {});

            expect(userRoleModelMock.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    expiresAt,
                }),
            );
        });

        it('должен назначить роль с метаданными', async () => {
            const metadata = { reason: 'Promotion' };
            userRoleModelMock.create.mockResolvedValue({
                ...mockUserRole,
                metadata,
            } as unknown as UserRoleModel);

            await repository.assignRoleToUser(10, 1, 1, 5, null, metadata);

            expect(userRoleModelMock.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    metadata,
                }),
            );
        });
    });

    describe('revokeRoleFromUser', () => {
        it('должен отозвать роль у пользователя', async () => {
            userRoleModelMock.destroy.mockResolvedValue(1);

            const result = await repository.revokeRoleFromUser(10, 1, 1);

            expect(userRoleModelMock.destroy).toHaveBeenCalledWith({
                where: {
                    userId: 10,
                    roleId: 1,
                    tenantId: 1,
                },
            });
            expect(result).toBe(true);
        });

        it('должен вернуть false если назначение не найдено', async () => {
            userRoleModelMock.destroy.mockResolvedValue(0);

            const result = await repository.revokeRoleFromUser(10, 999, 1);

            expect(result).toBe(false);
        });
    });

    describe('findUserRoles', () => {
        const mockUserRoles = [
            {
                id: 1,
                userId: 10,
                roleId: 1,
                tenantId: 1,
                grantedAt: new Date('2024-01-01'),
                expiresAt: null,
                isActive: true,
                role: mockRole,
            },
            {
                id: 2,
                userId: 10,
                roleId: 2,
                tenantId: 1,
                grantedAt: new Date('2024-01-01'),
                expiresAt: null,
                isActive: true,
                role: mockSystemRole,
            },
        ];

        it('должен найти роли пользователя', async () => {
            userRoleModelMock.findAll.mockResolvedValue(
                mockUserRoles as unknown as UserRoleModel[],
            );

            const result = await repository.findUserRoles(10, 1);

            expect(userRoleModelMock.findAll).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('roleName', 'TEST_ROLE');
            expect(result[1]).toHaveProperty('roleName', 'SYSTEM_ROLE');
        });

        it('должен вернуть пустой массив если у пользователя нет ролей', async () => {
            userRoleModelMock.findAll.mockResolvedValue([]);

            const result = await repository.findUserRoles(999, 1);

            expect(result).toHaveLength(0);
        });
    });

    describe('findRoleByName', () => {
        it('должен найти роль по названию', async () => {
            roleModelMock.findOne.mockResolvedValue(
                mockRole as unknown as RoleModel,
            );

            const result = await repository.findRoleByName('TEST_ROLE');

            expect(roleModelMock.findOne).toHaveBeenCalledWith({
                where: { role: 'TEST_ROLE' },
            });
            expect(result).toEqual(mockRole);
        });

        it('должен вернуть null если роль не найдена', async () => {
            roleModelMock.findOne.mockResolvedValue(null);

            const result = await repository.findRoleByName('NONEXISTENT');

            expect(result).toBeNull();
        });
    });

    describe('findAllRolesGrouped', () => {
        it('должен вернуть все роли отсортированные по уровню', async () => {
            const mockRoles = [
                { ...mockSystemRole, level: 100 },
                { ...mockRole, level: 50 },
            ];
            roleModelMock.findAll.mockResolvedValue(
                mockRoles as unknown as RoleModel[],
            );

            const result = await repository.findAllRolesGrouped();

            expect(roleModelMock.findAll).toHaveBeenCalledWith({
                order: [['level', 'DESC']],
            });
            expect(result).toEqual(mockRoles);
            expect(result[0].level).toBeGreaterThan(result[1].level);
        });

        it('должен вернуть пустой массив если ролей нет', async () => {
            roleModelMock.findAll.mockResolvedValue([]);

            const result = await repository.findAllRolesGrouped();

            expect(result).toHaveLength(0);
        });
    });

    describe('updateRole', () => {
        const updateDto = {
            description: 'Updated description',
            isActive: false,
        };

        it('должен обновить роль успешно', async () => {
            const mockRoleWithUpdate = {
                ...mockRole,
                update: jest.fn().mockResolvedValue(mockRole),
            };
            roleModelMock.findOne.mockResolvedValue(
                mockRoleWithUpdate as unknown as RoleModel,
            );
            roleModelMock.unscoped = jest.fn().mockReturnValue({
                findByPk: jest.fn().mockResolvedValue(mockRole),
            });

            const result = await repository.updateRole(1, updateDto, 1);

            expect(roleModelMock.findOne).toHaveBeenCalled();
            expect(mockRoleWithUpdate.update).toHaveBeenCalled();
            expect(result).toEqual(mockRole);
        });

        it('должен выбросить NotFoundException если роль не найдена', async () => {
            roleModelMock.findOne.mockResolvedValue(null);

            await expect(
                repository.updateRole(999, updateDto, 1),
            ).rejects.toThrow('Роль не найдена или недоступна для тенанта');
        });

        it('должен обновить роль без tenant isolation для системных ролей', async () => {
            const mockRoleWithUpdate = {
                ...mockSystemRole,
                update: jest.fn().mockResolvedValue(mockSystemRole),
            };
            roleModelMock.findOne.mockResolvedValue(
                mockRoleWithUpdate as unknown as RoleModel,
            );
            roleModelMock.unscoped = jest.fn().mockReturnValue({
                findByPk: jest.fn().mockResolvedValue(mockSystemRole),
            });

            const result = await repository.updateRole(
                2,
                { isActive: true },
                null,
            );

            expect(mockRoleWithUpdate.update).toHaveBeenCalled();
            expect(result).toEqual(mockSystemRole);
        });
    });

    describe('createRolePermission', () => {
        const mockPermission = {
            id: 1,
            roleId: 1,
            resource: 'users',
            action: 'read',
            conditions: null,
        };

        it('должен создать разрешение успешно', async () => {
            rolePermissionModelMock.create.mockResolvedValue(
                mockPermission as unknown as RolePermissionModel,
            );

            const result = await repository.createRolePermission(
                1,
                'users',
                'read',
            );

            expect(rolePermissionModelMock.create).toHaveBeenCalledWith({
                roleId: 1,
                resource: 'users',
                action: 'read',
                conditions: undefined,
            });
            expect(result).toEqual({
                id: 1,
                roleId: 1,
                resource: 'users',
                action: 'read',
            });
        });

        it('должен создать разрешение с условиями', async () => {
            const conditions = { ownerId: 'userId' };
            const permWithConditions = { ...mockPermission, conditions };

            rolePermissionModelMock.create.mockResolvedValue(
                permWithConditions as unknown as RolePermissionModel,
            );

            const result = await repository.createRolePermission(
                1,
                'users',
                'update',
                conditions,
            );

            expect(rolePermissionModelMock.create).toHaveBeenCalledWith({
                roleId: 1,
                resource: 'users',
                action: 'update',
                conditions,
            });
            expect(result).toHaveProperty('id');
        });

        it('должен выбросить ConflictException при дублировании', async () => {
            const error = new Error('Duplicate entry');
            error.name = 'SequelizeUniqueConstraintError';
            rolePermissionModelMock.create.mockRejectedValue(error);

            await expect(
                repository.createRolePermission(1, 'users', 'read'),
            ).rejects.toThrow('Разрешение уже назначено этой роли');
        });
    });

    describe('deleteRolePermission', () => {
        it('должен удалить разрешение успешно', async () => {
            rolePermissionModelMock.destroy.mockResolvedValue(1);

            const result = await repository.deleteRolePermission(
                1,
                'users',
                'read',
            );

            expect(rolePermissionModelMock.destroy).toHaveBeenCalledWith({
                where: { roleId: 1, resource: 'users', action: 'read' },
            });
            expect(result).toBe(true);
        });

        it('должен вернуть false если разрешение не найдено', async () => {
            rolePermissionModelMock.destroy.mockResolvedValue(0);

            const result = await repository.deleteRolePermission(
                1,
                'nonexistent',
                'read',
            );

            expect(result).toBe(false);
        });
    });

    describe('findRolePermissions', () => {
        const mockPermissions = [
            {
                id: 1,
                roleId: 1,
                resource: 'users',
                action: 'read',
                conditions: null,
            },
            {
                id: 2,
                roleId: 1,
                resource: 'users',
                action: 'write',
                conditions: { ownerId: 'userId' },
            },
        ];

        it('должен найти все разрешения роли', async () => {
            rolePermissionModelMock.findAll.mockResolvedValue(
                mockPermissions as unknown as RolePermissionModel[],
            );

            const result = await repository.findRolePermissions(1);

            expect(rolePermissionModelMock.findAll).toHaveBeenCalledWith({
                where: { roleId: 1 },
            });
            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('resource', 'users');
            expect(result[1]).toHaveProperty('conditions');
        });

        it('должен вернуть пустой массив если у роли нет разрешений', async () => {
            rolePermissionModelMock.findAll.mockResolvedValue([]);

            const result = await repository.findRolePermissions(999);

            expect(result).toHaveLength(0);
        });
    });
});
