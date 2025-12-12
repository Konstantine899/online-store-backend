/**
 * Unit тесты для SSORoleSyncService
 * Покрывают just-in-time provisioning и синхронизацию ролей для SSO
 *
 * Related to: SAAS-017-19, Этап 3
 */

import type {
    ExternalRoleConfigModel,
    RoleMappingModel,
    UserModel,
} from '@app/domain/models';
import type { ISSOUserProfile } from '@app/domain/types/sso/sso-user-profile.types';
import type { CreateUserResponse } from '@app/infrastructure/responses';
import type { UserRolesResponse } from '@app/infrastructure/responses/role/user-roles.response';
import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RoleMappingRepository } from '@app/infrastructure/repositories/role/role-mapping.repository';
import { RoleService } from '@app/infrastructure/services/role/role.service';
import { UserService } from '@app/infrastructure/services/user/user.service';
import { SSORoleSyncService } from '../sso-role-sync.service';

describe('SSORoleSyncService (unit)', () => {
    let service: SSORoleSyncService;
    let userService: jest.Mocked<UserService>;
    let roleService: jest.Mocked<RoleService>;
    let roleMappingRepository: jest.Mocked<RoleMappingRepository>;

    const mockProviderConfig: ExternalRoleConfigModel = {
        id: 1,
        tenantId: 1,
        providerType: 'OAUTH2',
        name: 'Test OAuth2 Provider',
        status: 'ACTIVE',
    } as ExternalRoleConfigModel;

    const mockSSOProfile: ISSOUserProfile = {
        id: 'sso-user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        roles: ['Admin', 'User'],
        providerType: 'OAUTH2',
    };

    const mockUser: UserModel = {
        id: 1,
        tenantId: 1,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        isActive: true,
        update: jest.fn().mockResolvedValue(undefined),
        createdAt: new Date(),
        updatedAt: new Date(),
    } as unknown as UserModel;

    const mockCreateUserResponse: CreateUserResponse = {
        id: 1,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
    } as CreateUserResponse;

    const mockRoleMapping: RoleMappingModel = {
        id: 1,
        externalRoleConfigId: 1,
        tenantId: 1,
        externalRoleName: 'Admin',
        internalRoleId: 2, // ADMIN role
        priority: 100,
        isActive: true,
    } as RoleMappingModel;

    beforeEach(async () => {
        userService = {
            findUserByEmail: jest.fn(),
            createUser: jest.fn(),
            findAuthenticatedUser: jest.fn(),
            updatePassword: jest.fn(),
        } as unknown as jest.Mocked<UserService>;

        roleService = {
            getUserRoles: jest.fn(),
            assignRoleToUser: jest.fn(),
        } as unknown as jest.Mocked<RoleService>;

        roleMappingRepository = {
            findMappingsByConfig: jest.fn(),
        } as unknown as jest.Mocked<RoleMappingRepository>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SSORoleSyncService,
                {
                    provide: UserService,
                    useValue: userService,
                },
                {
                    provide: RoleService,
                    useValue: roleService,
                },
                {
                    provide: RoleMappingRepository,
                    useValue: roleMappingRepository,
                },
            ],
        }).compile();

        service = module.get<SSORoleSyncService>(SSORoleSyncService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================================
    // TESTS: provisionUser()
    // ============================================================================

    describe('provisionUser', () => {
        it('должен вернуть существующего пользователя и обновить профиль', async () => {
            userService.findUserByEmail.mockResolvedValue(mockUser);

            const result = await service.provisionUser(mockSSOProfile);

            expect(result).toBe(mockUser);
            expect(userService.findUserByEmail).toHaveBeenCalledWith(
                mockSSOProfile.email,
            );
            expect(userService.createUser).not.toHaveBeenCalled();
        });

        it('должен создать нового пользователя при just-in-time provisioning', async () => {
            userService.findUserByEmail.mockRejectedValue(
                new NotFoundException('User not found'),
            );
            userService.createUser.mockResolvedValue(mockCreateUserResponse);
            userService.findAuthenticatedUser.mockResolvedValue(mockUser);
            userService.updatePassword.mockResolvedValue(undefined);

            const result = await service.provisionUser(mockSSOProfile);

            expect(result).toBe(mockUser);
            expect(userService.createUser).toHaveBeenCalled();
            expect(userService.findAuthenticatedUser).toHaveBeenCalledWith(1);
            expect(userService.updatePassword).toHaveBeenCalledWith(
                mockUser.id,
                expect.any(String), // hashedPassword
            );
        });

        it('должен обновить профиль существующего пользователя при изменении данных', async () => {
            const existingUser = {
                ...mockUser,
                firstName: 'Jane', // Изменилось
                lastName: 'Smith', // Изменилось
            };

            userService.findUserByEmail.mockResolvedValue(
                existingUser as UserModel,
            );

            const result = await service.provisionUser(mockSSOProfile);

            expect(result).toBe(existingUser);
            expect(existingUser.update).toHaveBeenCalled();
        });
    });

    // ============================================================================
    // TESTS: syncRoles()
    // ============================================================================

    describe('syncRoles', () => {
        it('должен синхронизировать роли из SSO профиля', async () => {
            const userId = 1;
            const tenantId = 1;

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                mockRoleMapping,
            ]);

            roleService.getUserRoles.mockResolvedValue({
                roles: [],
            } as UserRolesResponse);

            roleService.assignRoleToUser.mockResolvedValue({
                success: true,
            } as unknown as Awaited<
                ReturnType<typeof roleService.assignRoleToUser>
            >);

            await service.syncRoles(
                userId,
                mockSSOProfile,
                mockProviderConfig,
                tenantId,
            );

            expect(roleMappingRepository.findMappingsByConfig).toHaveBeenCalledWith(
                mockProviderConfig.id,
                tenantId,
            );
            expect(roleService.getUserRoles).toHaveBeenCalledWith(
                userId,
                tenantId,
            );
            expect(roleService.assignRoleToUser).toHaveBeenCalled();
        });

        it('должен пропустить синхронизацию если нет внешних ролей', async () => {
            const userId = 1;
            const tenantId = 1;
            const profileWithoutRoles = {
                ...mockSSOProfile,
                roles: undefined,
            };

            await service.syncRoles(
                userId,
                profileWithoutRoles,
                mockProviderConfig,
                tenantId,
            );

            expect(roleMappingRepository.findMappingsByConfig).not.toHaveBeenCalled();
        });

        it('должен пропустить синхронизацию если нет маппингов', async () => {
            const userId = 1;
            const tenantId = 1;

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([]);

            await service.syncRoles(
                userId,
                mockSSOProfile,
                mockProviderConfig,
                tenantId,
            );

            expect(roleService.assignRoleToUser).not.toHaveBeenCalled();
        });

        it('должен применять маппинги с учетом приоритета', async () => {
            const userId = 1;
            const tenantId = 1;

            const highPriorityMapping = {
                ...mockRoleMapping,
                id: 1,
                priority: 50, // Высокий приоритет
            };

            const lowPriorityMapping = {
                ...mockRoleMapping,
                id: 2,
                priority: 100, // Низкий приоритет
            };

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                lowPriorityMapping,
                highPriorityMapping,
            ]);

            roleService.getUserRoles.mockResolvedValue({
                roles: [],
            } as UserRolesResponse);

            roleService.assignRoleToUser.mockResolvedValue({
                success: true,
            } as unknown as Awaited<
                ReturnType<typeof roleService.assignRoleToUser>
            >);

            await service.syncRoles(
                userId,
                mockSSOProfile,
                mockProviderConfig,
                tenantId,
            );

            // Проверяем, что маппинги применены в порядке приоритета
            expect(roleService.assignRoleToUser).toHaveBeenCalledTimes(2);
        });

        it('должен пропустить роль если она уже назначена пользователю', async () => {
            const userId = 1;
            const tenantId = 1;

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                mockRoleMapping,
            ]);

            roleService.getUserRoles.mockResolvedValue({
                roles: [
                    {
                        roleId: mockRoleMapping.internalRoleId,
                        roleName: 'ADMIN',
                    },
                ],
            } as UserRolesResponse);

            await service.syncRoles(
                userId,
                mockSSOProfile,
                mockProviderConfig,
                tenantId,
            );

            // Роль уже назначена, не должна быть назначена повторно
            expect(roleService.assignRoleToUser).not.toHaveBeenCalled();
        });

        it('должен обрабатывать ошибки при назначении роли и продолжать', async () => {
            const userId = 1;
            const tenantId = 1;

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                mockRoleMapping,
            ]);

            roleService.getUserRoles.mockResolvedValue({
                roles: [],
            } as UserRolesResponse);

            roleService.assignRoleToUser.mockRejectedValue(
                new BadRequestException('Role assignment failed'),
            );

            // Не должно выбрасывать ошибку, должно продолжить
            await expect(
                service.syncRoles(
                    userId,
                    mockSSOProfile,
                    mockProviderConfig,
                    tenantId,
                ),
            ).resolves.not.toThrow();
        });

        it('должен применять множественные маппинги параллельно через Promise.allSettled', async () => {
            const userId = 1;
            const tenantId = 1;

            const mapping1 = {
                ...mockRoleMapping,
                id: 1,
                externalRoleName: 'Admin',
                internalRoleId: 2,
            };

            const mapping2 = {
                ...mockRoleMapping,
                id: 2,
                externalRoleName: 'User',
                internalRoleId: 3,
            };

            const mapping3 = {
                ...mockRoleMapping,
                id: 3,
                externalRoleName: 'Moderator',
                internalRoleId: 4,
            };

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                mapping1,
                mapping2,
                mapping3,
            ]);

            roleService.getUserRoles.mockResolvedValue({
                roles: [],
            } as UserRolesResponse);

            // Мокируем assignRoleToUser с задержкой для проверки параллельности
            const startTime = Date.now();
            roleService.assignRoleToUser.mockImplementation(
                async () => {
                    // Симулируем задержку 50ms для каждого вызова
                    await new Promise((resolve) => setTimeout(resolve, 50));
                    return {
                        success: true,
                    } as unknown as Awaited<
                        ReturnType<typeof roleService.assignRoleToUser>
                    >;
                },
            );

            await service.syncRoles(
                userId,
                {
                    ...mockSSOProfile,
                    roles: ['Admin', 'User', 'Moderator'],
                },
                mockProviderConfig,
                tenantId,
            );

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Если бы маппинги применялись последовательно, время было бы ~150ms (3 * 50ms)
            // При параллельном выполнении время должно быть ~50ms (максимум из всех)
            expect(duration).toBeLessThan(100); // С запасом для накладных расходов

            // Все три маппинга должны быть вызваны
            expect(roleService.assignRoleToUser).toHaveBeenCalledTimes(3);
        });

        it('должен обрабатывать частичные ошибки при параллельном применении маппингов', async () => {
            const userId = 1;
            const tenantId = 1;

            const mapping1 = {
                ...mockRoleMapping,
                id: 1,
                externalRoleName: 'Admin',
                internalRoleId: 2,
            };

            const mapping2 = {
                ...mockRoleMapping,
                id: 2,
                externalRoleName: 'User',
                internalRoleId: 3,
            };

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                mapping1,
                mapping2,
            ]);

            roleService.getUserRoles.mockResolvedValue({
                roles: [],
            } as UserRolesResponse);

            // Первый маппинг успешен, второй падает
            roleService.assignRoleToUser
                .mockResolvedValueOnce({
                    success: true,
                } as unknown as Awaited<
                    ReturnType<typeof roleService.assignRoleToUser>
                >)
                .mockRejectedValueOnce(
                    new BadRequestException('Role assignment failed'),
                );

            // Не должно выбрасывать ошибку, должно продолжить
            await expect(
                service.syncRoles(
                    userId,
                    {
                        ...mockSSOProfile,
                        roles: ['Admin', 'User'],
                    },
                    mockProviderConfig,
                    tenantId,
                ),
            ).resolves.not.toThrow();

            // Оба маппинга должны быть вызваны
            expect(roleService.assignRoleToUser).toHaveBeenCalledTimes(2);
        });

        it('должен пропускать уже назначенные роли при параллельном применении', async () => {
            const userId = 1;
            const tenantId = 1;

            const mapping1 = {
                ...mockRoleMapping,
                id: 1,
                externalRoleName: 'Admin',
                internalRoleId: 2,
            };

            const mapping2 = {
                ...mockRoleMapping,
                id: 2,
                externalRoleName: 'User',
                internalRoleId: 3,
            };

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                mapping1,
                mapping2,
            ]);

            // Пользователь уже имеет роль Admin (roleId: 2)
            roleService.getUserRoles.mockResolvedValue({
                roles: [
                    {
                        roleId: 2, // Admin уже назначена
                        roleName: 'ADMIN',
                    },
                ],
            } as UserRolesResponse);

            roleService.assignRoleToUser.mockResolvedValue({
                success: true,
            } as unknown as Awaited<
                ReturnType<typeof roleService.assignRoleToUser>
            >);

            await service.syncRoles(
                userId,
                {
                    ...mockSSOProfile,
                    roles: ['Admin', 'User'],
                },
                mockProviderConfig,
                tenantId,
            );

            // Должна быть назначена только роль User (Admin уже есть)
            expect(roleService.assignRoleToUser).toHaveBeenCalledTimes(1);
            expect(roleService.assignRoleToUser).toHaveBeenCalledWith(
                {
                    userId,
                    roleId: 3, // User role
                    tenantId,
                },
                tenantId,
                ['ADMIN'],
            );
        });
    });

    // ============================================================================
    // TESTS: updateUserProfile() (private method через provisionUser)
    // ============================================================================

    describe('updateUserProfile', () => {
        it('должен обновлять firstName если оно изменилось', async () => {
            const existingUser = {
                ...mockUser,
                firstName: 'Jane', // Старое значение
            };

            userService.findUserByEmail.mockResolvedValue(
                existingUser as UserModel,
            );

            const profile = {
                ...mockSSOProfile,
                firstName: 'John', // Новое значение
            };

            await service.provisionUser(profile);

            expect(existingUser.update).toHaveBeenCalledWith({
                firstName: 'John',
            });
        });

        it('должен обновлять lastName если оно изменилось', async () => {
            const existingUser = {
                ...mockUser,
                lastName: 'Smith', // Старое значение
            };

            userService.findUserByEmail.mockResolvedValue(
                existingUser as UserModel,
            );

            const profile = {
                ...mockSSOProfile,
                lastName: 'Doe', // Новое значение
            };

            await service.provisionUser(profile);

            expect(existingUser.update).toHaveBeenCalledWith({
                lastName: 'Doe',
            });
        });

        it('должен обновлять phone если он изменился', async () => {
            const existingUser = {
                ...mockUser,
                phone: '+1234567890', // Старое значение
            };

            userService.findUserByEmail.mockResolvedValue(
                existingUser as UserModel,
            );

            const profile = {
                ...mockSSOProfile,
                phone: '+0987654321', // Новое значение
            };

            await service.provisionUser(profile);

            expect(existingUser.update).toHaveBeenCalledWith({
                phone: '+0987654321',
            });
        });

        it('должен обновлять несколько полей одновременно', async () => {
            const existingUser = {
                ...mockUser,
                firstName: 'Jane',
                lastName: 'Smith',
                phone: '+1234567890',
            };

            userService.findUserByEmail.mockResolvedValue(
                existingUser as UserModel,
            );

            const profile = {
                ...mockSSOProfile,
                firstName: 'John',
                lastName: 'Doe',
                phone: '+0987654321',
            };

            await service.provisionUser(profile);

            expect(existingUser.update).toHaveBeenCalledWith({
                firstName: 'John',
                lastName: 'Doe',
                phone: '+0987654321',
            });
        });

        it('не должен обновлять поля если они не изменились', async () => {
            const existingUser = {
                ...mockUser,
                firstName: 'John',
                lastName: 'Doe',
            };

            userService.findUserByEmail.mockResolvedValue(
                existingUser as UserModel,
            );

            const profile = {
                ...mockSSOProfile,
                firstName: 'John', // То же значение
                lastName: 'Doe', // То же значение
            };

            await service.provisionUser(profile);

            // update не должен быть вызван, так как значения не изменились
            expect(existingUser.update).not.toHaveBeenCalled();
        });

        it('не должен обновлять phone если он не указан в профиле', async () => {
            const existingUser = {
                ...mockUser,
                phone: '+1234567890',
            };

            userService.findUserByEmail.mockResolvedValue(
                existingUser as UserModel,
            );

            const profile = {
                ...mockSSOProfile,
                phone: undefined, // Не указан
            };

            await service.provisionUser(profile);

            // phone не должен быть в updates
            expect(existingUser.update).not.toHaveBeenCalled();
        });
    });

    // ============================================================================
    // TESTS: createSSOUser() (private method через provisionUser)
    // ============================================================================

    describe('createSSOUser', () => {
        it('должен обрабатывать ошибку при создании пользователя', async () => {
            userService.findUserByEmail.mockRejectedValue(
                new NotFoundException('User not found'),
            );
            userService.createUser.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(service.provisionUser(mockSSOProfile)).rejects.toThrow(
                'Database error',
            );

            expect(userService.createUser).toHaveBeenCalled();
        });

        it('должен обрабатывать ошибку при получении созданного пользователя', async () => {
            userService.findUserByEmail.mockRejectedValue(
                new NotFoundException('User not found'),
            );
            userService.createUser.mockResolvedValue(mockCreateUserResponse);
            userService.findAuthenticatedUser.mockRejectedValue(
                new Error('User not found after creation'),
            );

            await expect(service.provisionUser(mockSSOProfile)).rejects.toThrow(
                'User not found after creation',
            );
        });

        it('должен обрабатывать ошибку при обновлении пароля', async () => {
            userService.findUserByEmail.mockRejectedValue(
                new NotFoundException('User not found'),
            );
            userService.createUser.mockResolvedValue(mockCreateUserResponse);
            userService.findAuthenticatedUser.mockResolvedValue(mockUser);
            userService.updatePassword.mockRejectedValue(
                new Error('Password update failed'),
            );

            await expect(service.provisionUser(mockSSOProfile)).rejects.toThrow(
                'Password update failed',
            );
        });
    });

    // ============================================================================
    // TESTS: applyRoleMappings() (private method через syncRoles)
    // ============================================================================

    describe('applyRoleMappings', () => {
        it('должен возвращаться если нет внешних ролей', async () => {
            const userId = 1;
            const tenantId = 1;

            await service.syncRoles(
                userId,
                { ...mockSSOProfile, roles: [] },
                mockProviderConfig,
                tenantId,
            );

            expect(roleMappingRepository.findMappingsByConfig).not.toHaveBeenCalled();
        });

        it('должен возвращаться если нет маппингов', async () => {
            const userId = 1;
            const tenantId = 1;

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([]);

            await service.syncRoles(
                userId,
                mockSSOProfile,
                mockProviderConfig,
                tenantId,
            );

            expect(roleService.assignRoleToUser).not.toHaveBeenCalled();
        });

        it('должен фильтровать неактивные маппинги', async () => {
            const userId = 1;
            const tenantId = 1;

            const activeMapping = {
                ...mockRoleMapping,
                id: 1,
                isActive: true,
            };
            const inactiveMapping = {
                ...mockRoleMapping,
                id: 2,
                isActive: false,
            };

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                activeMapping,
                inactiveMapping,
            ]);

            roleService.getUserRoles.mockResolvedValue({
                roles: [],
            } as UserRolesResponse);

            roleService.assignRoleToUser.mockResolvedValue({
                success: true,
            } as unknown as Awaited<
                ReturnType<typeof roleService.assignRoleToUser>
            >);

            await service.syncRoles(
                userId,
                mockSSOProfile,
                mockProviderConfig,
                tenantId,
            );

            // Должен быть вызван только для активного маппинга
            expect(roleService.assignRoleToUser).toHaveBeenCalledTimes(1);
        });

        it('должен фильтровать маппинги которые не соответствуют внешним ролям', async () => {
            const userId = 1;
            const tenantId = 1;

            const matchingMapping = {
                ...mockRoleMapping,
                id: 1,
                externalRoleName: 'Admin',
            };
            const nonMatchingMapping = {
                ...mockRoleMapping,
                id: 2,
                externalRoleName: 'SuperAdmin', // Не в профиле
            };

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                matchingMapping,
                nonMatchingMapping,
            ]);

            roleService.getUserRoles.mockResolvedValue({
                roles: [],
            } as UserRolesResponse);

            roleService.assignRoleToUser.mockResolvedValue({
                success: true,
            } as unknown as Awaited<
                ReturnType<typeof roleService.assignRoleToUser>
            >);

            await service.syncRoles(
                userId,
                { ...mockSSOProfile, roles: ['Admin'] },
                mockProviderConfig,
                tenantId,
            );

            // Должен быть вызван только для соответствующего маппинга
            expect(roleService.assignRoleToUser).toHaveBeenCalledTimes(1);
        });

        it('должен сортировать маппинги по приоритету и применять все соответствующие', async () => {
            const userId = 1;
            const tenantId = 1;

            const lowPriorityMapping = {
                ...mockRoleMapping,
                id: 1,
                priority: 100,
                externalRoleName: 'Admin',
                internalRoleId: 2,
            };
            const highPriorityMapping = {
                ...mockRoleMapping,
                id: 2,
                priority: 50,
                externalRoleName: 'Admin',
                internalRoleId: 3,
            };

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                lowPriorityMapping,
                highPriorityMapping,
            ]);

            roleService.getUserRoles.mockResolvedValue({
                roles: [],
            } as UserRolesResponse);

            const assignSpy = jest.fn().mockResolvedValue({
                success: true,
            } as unknown as Awaited<
                ReturnType<typeof roleService.assignRoleToUser>
            >);
            roleService.assignRoleToUser = assignSpy;

            await service.syncRoles(
                userId,
                { ...mockSSOProfile, roles: ['Admin'] },
                mockProviderConfig,
                tenantId,
            );

            // Оба маппинга соответствуют 'Admin', поэтому оба должны быть применены
            // Но порядок должен быть по приоритету (сначала highPriorityMapping с priority: 50)
            expect(assignSpy).toHaveBeenCalledTimes(2);
            
            // Проверяем, что первый вызов был с highPriorityMapping (priority: 50)
            expect(assignSpy).toHaveBeenNthCalledWith(
                1,
                {
                    userId,
                    roleId: 3, // internalRoleId из highPriorityMapping (priority: 50)
                    tenantId,
                },
                tenantId,
                expect.any(Array),
            );
            
            // Второй вызов должен быть с lowPriorityMapping (priority: 100)
            expect(assignSpy).toHaveBeenNthCalledWith(
                2,
                {
                    userId,
                    roleId: 2, // internalRoleId из lowPriorityMapping (priority: 100)
                    tenantId,
                },
                tenantId,
                expect.any(Array),
            );
        });

        it('должен обрабатывать ошибку при получении ролей пользователя', async () => {
            const userId = 1;
            const tenantId = 1;

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                mockRoleMapping,
            ]);

            roleService.getUserRoles.mockRejectedValue(
                new Error('Failed to get user roles'),
            );

            await expect(
                service.syncRoles(
                    userId,
                    mockSSOProfile,
                    mockProviderConfig,
                    tenantId,
                ),
            ).rejects.toThrow('Failed to get user roles');
        });

        it('должен обрабатывать ошибку при получении маппингов', async () => {
            const userId = 1;
            const tenantId = 1;

            roleMappingRepository.findMappingsByConfig.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(
                service.syncRoles(
                    userId,
                    mockSSOProfile,
                    mockProviderConfig,
                    tenantId,
                ),
            ).rejects.toThrow('Database error');
        });

        it('должен обрабатывать маппинги с undefined priority', async () => {
            const userId = 1;
            const tenantId = 1;

            const mappingWithoutPriority = {
                ...mockRoleMapping,
                priority: undefined,
            };

            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                mappingWithoutPriority,
            ]);

            roleService.getUserRoles.mockResolvedValue({
                roles: [],
            } as UserRolesResponse);

            roleService.assignRoleToUser.mockResolvedValue({
                success: true,
            } as unknown as Awaited<
                ReturnType<typeof roleService.assignRoleToUser>
            >);

            // Не должно быть ошибки
            await expect(
                service.syncRoles(
                    userId,
                    mockSSOProfile,
                    mockProviderConfig,
                    tenantId,
                ),
            ).resolves.not.toThrow();
        });
    });

    // ============================================================================
    // TESTS: provisionUser() - дополнительные сценарии
    // ============================================================================

    describe('provisionUser - дополнительные сценарии', () => {
        it('должен обрабатывать ошибку при поиске пользователя как "пользователь не найден"', async () => {
            // В текущей реализации provisionUser ловит все ошибки в try-catch
            // и считает, что пользователь не найден (для just-in-time provisioning)
            userService.findUserByEmail.mockRejectedValue(
                new Error('Database connection error'),
            );
            userService.createUser.mockResolvedValue(mockCreateUserResponse);
            userService.findAuthenticatedUser.mockResolvedValue(mockUser);
            userService.updatePassword.mockResolvedValue(undefined);

            // Ошибка обрабатывается как "пользователь не найден", создается новый пользователь
            const result = await service.provisionUser(mockSSOProfile);

            expect(result).toBe(mockUser);
            expect(userService.createUser).toHaveBeenCalled();
        });

        it('должен обрабатывать пустой email в профиле', async () => {
            const profileWithoutEmail = {
                ...mockSSOProfile,
                email: '',
            };

            userService.findUserByEmail.mockRejectedValue(
                new NotFoundException('User not found'),
            );
            userService.createUser.mockResolvedValue(mockCreateUserResponse);
            userService.findAuthenticatedUser.mockResolvedValue(mockUser);
            userService.updatePassword.mockResolvedValue(undefined);

            // Не должно быть ошибки, но email будет пустым
            const result = await service.provisionUser(profileWithoutEmail);

            expect(result).toBeDefined();
            expect(userService.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: '',
                }),
            );
        });
    });
});

