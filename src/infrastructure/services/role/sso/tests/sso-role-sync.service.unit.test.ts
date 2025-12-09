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

            const result = await service.provisionUser(
                mockSSOProfile,
                mockProviderConfig,
                1,
            );

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

            const result = await service.provisionUser(
                mockSSOProfile,
                mockProviderConfig,
                1,
            );

            expect(result).toBe(mockUser);
            expect(userService.createUser).toHaveBeenCalled();
            expect(userService.findAuthenticatedUser).toHaveBeenCalledWith(1);
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

            const result = await service.provisionUser(
                mockSSOProfile,
                mockProviderConfig,
                1,
            );

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
    });
});

