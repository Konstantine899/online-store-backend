import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoleRepository } from '../role.repository';
import {
    RoleModel,
    RolePermissionModel,
    UserRoleModel,
    UserModel,
} from '@app/domain/models';
import { CreateRoleDto } from '@app/infrastructure/dto';

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

            roleModelMock.create.mockResolvedValue(mockRole as any);

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
            expect(mockRole.reload).toHaveBeenCalled();
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

            roleModelMock.create.mockResolvedValue(mockSystemRole as any);

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
            } as any);

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
            roleModelMock.findOne.mockResolvedValue(mockRole as any);

            const result = await repository.findRole('TEST_ROLE', 1);

            expect(roleModelMock.findOne).toHaveBeenCalledWith({
                where: {
                    $or: [
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
            roleModelMock.findOne.mockResolvedValue(mockSystemRole as any);

            const result = await repository.findRole('SYSTEM_ROLE', 1);

            expect(result).toEqual(mockSystemRole);
        });

        it('должен вернуть null если роль не найдена', async () => {
            roleModelMock.findOne.mockResolvedValue(null);

            const result = await repository.findRole('NONEXISTENT_ROLE', 1);

            expect(result).toBeNull();
        });

        it('должен искать без tenant isolation когда tenantId undefined', async () => {
            roleModelMock.findOne.mockResolvedValue(mockRole as any);

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
            ] as any);

            const result = await repository.findListRole(1);

            expect(roleModelMock.findAll).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(result).toContain(mockRole);
            expect(result).toContain(mockSystemRole);
        });

        it('должен вернуть только системные роли для нового тенанта', async () => {
            roleModelMock.findAll.mockResolvedValue([mockSystemRole] as any);

            const result = await repository.findListRole(999);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockSystemRole);
        });

        it('должен вернуть все роли когда tenantId undefined', async () => {
            roleModelMock.findAll.mockResolvedValue([
                mockRole,
                mockSystemRole,
            ] as any);

            const result = await repository.findListRole(undefined);

            expect(result).toHaveLength(2);
        });
    });

    describe('findRoleById', () => {
        it('должен найти роль по ID с tenant isolation', async () => {
            roleModelMock.findOne.mockResolvedValue(mockRole as any);

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
            roleModelMock.findOne.mockResolvedValue(mockSystemRole as any);

            const result = await repository.findRoleById(2, 999);

            expect(result).toEqual(mockSystemRole);
        });
    });

    describe('findRoleByIdWithoutIsolation', () => {
        it('должен найти роль без tenant isolation', async () => {
            roleModelMock.findByPk.mockResolvedValue(mockRole as any);

            const result = await repository.findRoleByIdWithoutIsolation(1);

            expect(roleModelMock.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockRole);
        });

        it('должен вернуть null если роль не существует', async () => {
            roleModelMock.findByPk.mockResolvedValue(null);

            const result = await repository.findRoleByIdWithoutIsolation(999);

            expect(result).toBeNull();
        });
    });

    describe('deleteRole', () => {
        it('должен удалить роль успешно', async () => {
            roleModelMock.findOne.mockResolvedValue(mockRole as any);
            roleModelMock.destroy.mockResolvedValue(1);

            const result = await repository.deleteRole(1, 1);

            expect(roleModelMock.destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('должен выбросить NotFoundException если роль не найдена', async () => {
            roleModelMock.findOne.mockResolvedValue(null);

            await expect(repository.deleteRole(999, 1)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('должен запретить удаление роли другого тенанта', async () => {
            roleModelMock.findOne.mockResolvedValue(null);

            await expect(repository.deleteRole(1, 999)).rejects.toThrow(
                NotFoundException,
            );
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
            userRoleModelMock.create.mockResolvedValue(mockUserRole as any);

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
            expect(result).toEqual(mockUserRole);
        });

        it('должен назначить роль с датой истечения', async () => {
            const expiresAt = new Date('2025-01-01');
            userRoleModelMock.create.mockResolvedValue({
                ...mockUserRole,
                expiresAt,
            } as any);

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
            } as any);

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
                role: mockRole,
            },
            {
                id: 2,
                userId: 10,
                roleId: 2,
                role: mockSystemRole,
            },
        ];

        it('должен найти роли пользователя', async () => {
            userRoleModelMock.findAll.mockResolvedValue(mockUserRoles as any);

            const result = await repository.findUserRoles(10, 1);

            expect(userRoleModelMock.findAll).toHaveBeenCalled();
            expect(result).toHaveLength(2);
        });

        it('должен вернуть пустой массив если у пользователя нет ролей', async () => {
            userRoleModelMock.findAll.mockResolvedValue([]);

            const result = await repository.findUserRoles(999, 1);

            expect(result).toHaveLength(0);
        });
    });
});

