/**
 * Unit тесты для RoleMappingService
 * Покрывают применение маппингов ролей, обработку приоритетов и default ролей
 */

import type { RoleMappingModel } from '@app/domain/models';
import type { IRoleMappingRepository } from '@app/domain/repositories';
import type { IRoleService } from '@app/domain/services/role/i-role-service';
import type { GetUserRolesResponse } from '@app/infrastructure/responses';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { MappingRuleEngine } from '../mapping-rule-engine';
import { RoleMappingService } from '../role-mapping.service';

describe('RoleMappingService (unit)', () => {
    let service: RoleMappingService;
    let roleService: jest.Mocked<IRoleService>;
    let roleMappingRepository: jest.Mocked<IRoleMappingRepository>;
    let mappingRuleEngine: jest.Mocked<MappingRuleEngine>;

    const mockMapping: RoleMappingModel = {
        id: 1,
        externalRoleConfigId: 1,
        tenantId: 1,
        externalRoleName: 'Admin',
        internalRoleId: 5,
        priority: 100,
        isActive: true,
        isDefault: false,
        mappedUsersCount: 0,
        lastAppliedAt: null,
    } as RoleMappingModel;

    const mockDefaultMapping: RoleMappingModel = {
        ...mockMapping,
        id: 2,
        externalRoleName: 'Default',
        internalRoleId: 1,
        isDefault: true,
    } as RoleMappingModel;

    const mockUserRolesResponse: GetUserRolesResponse = {
        userId: 1,
        roles: [
            {
                id: 1,
                roleId: 1,
                roleName: 'USER',
                roleDescription: 'Regular user',
                roleLevel: 10,
                grantedAt: '2024-01-01T00:00:00Z',
                isActive: true,
            },
            {
                id: 2,
                roleId: 3,
                roleName: 'MANAGER',
                roleDescription: 'Manager role',
                roleLevel: 50,
                grantedAt: '2024-01-01T00:00:00Z',
                isActive: true,
            },
        ],
        totalCount: 2,
    };

    beforeEach(async () => {
        roleService = {
            getUserRoles: jest.fn(),
            assignRoleToUser: jest.fn(),
            getRole: jest.fn(),
        } as unknown as jest.Mocked<IRoleService>;

        roleMappingRepository = {
            findMappings: jest.fn(),
            updateMappingStats: jest.fn(),
        } as unknown as jest.Mocked<IRoleMappingRepository>;

        mappingRuleEngine = {
            evaluate: jest.fn(),
        } as unknown as jest.Mocked<MappingRuleEngine>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleMappingService,
                {
                    provide: 'IRoleService',
                    useValue: roleService,
                },
                {
                    provide: 'IRoleMappingRepository',
                    useValue: roleMappingRepository,
                },
                {
                    provide: MappingRuleEngine,
                    useValue: mappingRuleEngine,
                },
            ],
        }).compile();

        service = module.get<RoleMappingService>(RoleMappingService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('applyMappings', () => {
        it('should return empty result if no external roles', async () => {
            roleMappingRepository.findMappings.mockResolvedValue([mockMapping]);

            const result = await service.applyMappings(1, [], {}, 1, 1);

            expect(result.applied).toBe(0);
            expect(result.errors).toBe(0);
            expect(result.appliedRoles).toEqual([]);
            // Проверяем, что getUserRoles не вызывается когда нет внешних ролей
            expect(roleService.getUserRoles).not.toHaveBeenCalled();
        });

        it('should return empty result if no active mappings', async () => {
            roleMappingRepository.findMappings.mockResolvedValue([]);
            roleService.getUserRoles.mockResolvedValue(mockUserRolesResponse);

            const result = await service.applyMappings(1, ['Admin'], {}, 1, 1);

            expect(result.applied).toBe(0);
            expect(result.errors).toBe(0);
        });

        it('should apply mapping when external role matches', async () => {
            roleMappingRepository.findMappings.mockResolvedValue([mockMapping]);
            roleService.getUserRoles.mockResolvedValue(mockUserRolesResponse);
            roleService.assignRoleToUser.mockResolvedValue({
                message: 'Роль успешно назначена пользователю',
                userRoleId: 1,
                userId: 1,
                roleId: 5,
                tenantId: 1,
            });
            roleMappingRepository.updateMappingStats.mockResolvedValue();
            mappingRuleEngine.evaluate.mockReturnValue(null);

            const result = await service.applyMappings(1, ['Admin'], {}, 1, 1);

            expect(result.applied).toBe(1);
            expect(result.errors).toBe(0);
            expect(result.appliedRoles).toHaveLength(1);
            expect(result.appliedRoles[0].roleId).toBe(5);
            expect(roleService.assignRoleToUser).toHaveBeenCalledWith(
                {
                    userId: 1,
                    roleId: 5,
                    tenantId: 1,
                },
                1,
                ['USER', 'MANAGER'],
            );
            expect(roleMappingRepository.updateMappingStats).toHaveBeenCalled();
        });

        it('should not apply mapping if role already assigned', async () => {
            roleMappingRepository.findMappings.mockResolvedValue([mockMapping]);
            roleService.getUserRoles.mockResolvedValue({
                userId: 1,
                roles: [
                    {
                        id: 1,
                        roleId: 1,
                        roleName: 'USER',
                        roleDescription: 'Regular user',
                        roleLevel: 10,
                        grantedAt: '2024-01-01T00:00:00Z',
                        isActive: true,
                    },
                    {
                        id: 2,
                        roleId: 5,
                        roleName: 'ADMIN',
                        roleDescription: 'Admin role',
                        roleLevel: 100,
                        grantedAt: '2024-01-01T00:00:00Z',
                        isActive: true,
                    },
                ],
                totalCount: 2,
            });
            mappingRuleEngine.evaluate.mockReturnValue(null);

            const result = await service.applyMappings(1, ['Admin'], {}, 1, 1);

            expect(result.applied).toBe(0);
            expect(result.errors).toBe(0);
            expect(roleService.assignRoleToUser).not.toHaveBeenCalled();
        });

        it('should sort mappings by priority', async () => {
            const lowPriorityMapping = {
                ...mockMapping,
                id: 2,
                priority: 200,
                internalRoleId: 10,
            } as unknown as RoleMappingModel;
            const highPriorityMapping = {
                ...mockMapping,
                id: 3,
                priority: 50,
                internalRoleId: 20,
            } as unknown as RoleMappingModel;

            roleMappingRepository.findMappings.mockResolvedValue([
                lowPriorityMapping,
                highPriorityMapping,
            ]);
            roleService.getUserRoles.mockResolvedValue(mockUserRolesResponse);
            roleService.assignRoleToUser
                .mockResolvedValueOnce({
                    message: 'Роль успешно назначена пользователю',
                    userRoleId: 2,
                    userId: 1,
                    roleId: 20,
                    tenantId: 1,
                })
                .mockResolvedValueOnce({
                    message: 'Роль успешно назначена пользователю',
                    userRoleId: 3,
                    userId: 1,
                    roleId: 10,
                    tenantId: 1,
                });
            roleMappingRepository.updateMappingStats.mockResolvedValue();
            mappingRuleEngine.evaluate.mockReturnValue(null);

            const result = await service.applyMappings(1, ['Admin'], {}, 1, 1);

            expect(result.applied).toBe(2);
            // Маппинги должны применяться в порядке приоритета (50 сначала, затем 200)
            expect(result.appliedRoles[0].roleId).toBe(20); // highPriorityMapping (priority 50)
            expect(result.appliedRoles[1].roleId).toBe(10); // lowPriorityMapping (priority 200)
        });

        it('should apply default role when no mappings match', async () => {
            roleMappingRepository.findMappings.mockResolvedValue([
                {
                    ...mockMapping,
                    externalRoleName: 'Other',
                } as unknown as RoleMappingModel,
                mockDefaultMapping,
            ]);
            // Пользователь не имеет default роли (roleId: 1 отсутствует)
            roleService.getUserRoles.mockResolvedValue({
                userId: 1,
                roles: [
                    {
                        id: 2,
                        roleId: 3,
                        roleName: 'MANAGER',
                        roleDescription: 'Manager role',
                        roleLevel: 50,
                        grantedAt: '2024-01-01T00:00:00Z',
                        isActive: true,
                    },
                ],
                totalCount: 1,
            });
            roleService.assignRoleToUser.mockResolvedValue({
                message: 'Роль успешно назначена пользователю',
                userRoleId: 3,
                userId: 1,
                roleId: 1,
                tenantId: 1,
            });
            roleMappingRepository.updateMappingStats.mockResolvedValue();
            mappingRuleEngine.evaluate.mockReturnValue(null);

            const result = await service.applyMappings(
                1,
                ['Unknown'],
                {},
                1,
                1,
            );

            expect(result.applied).toBe(1);
            expect(result.usedDefault).toBe(true);
            expect(result.appliedRoles[0].roleId).toBe(1);
        });

        it('should use mapping rules from engine when provided', async () => {
            const mappingWithRules = {
                ...mockMapping,
                mappingRules: {
                    conditions: [
                        {
                            if: { department: 'IT' },
                            then: 15,
                        },
                    ],
                },
            } as unknown as RoleMappingModel;

            roleMappingRepository.findMappings.mockResolvedValue([
                mappingWithRules,
            ]);
            roleService.getUserRoles.mockResolvedValue(mockUserRolesResponse);
            roleService.assignRoleToUser.mockResolvedValue({
                message: 'Роль успешно назначена пользователю',
                userRoleId: 4,
                userId: 1,
                roleId: 15,
                tenantId: 1,
            });
            roleMappingRepository.updateMappingStats.mockResolvedValue();
            mappingRuleEngine.evaluate.mockReturnValue({
                matched: true,
                roleId: 15,
                matchedCondition: {
                    if: { department: 'IT' },
                    then: 15,
                },
            });

            const result = await service.applyMappings(
                1,
                ['Admin'],
                { department: 'IT' },
                1,
                1,
            );

            expect(result.applied).toBe(1);
            expect(result.appliedRoles[0].roleId).toBe(15);
            expect(mappingRuleEngine.evaluate).toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            roleMappingRepository.findMappings.mockResolvedValue([mockMapping]);
            roleService.getUserRoles.mockResolvedValue(mockUserRolesResponse);
            roleService.assignRoleToUser.mockRejectedValue(
                new Error('Database error'),
            );
            mappingRuleEngine.evaluate.mockReturnValue(null);

            const result = await service.applyMappings(1, ['Admin'], {}, 1, 1);

            expect(result.applied).toBe(0);
            expect(result.errors).toBe(1);
        });

        it('should apply multiple mappings in parallel', async () => {
            const mapping1 = {
                ...mockMapping,
                id: 1,
                internalRoleId: 5,
            } as unknown as RoleMappingModel;
            const mapping2 = {
                ...mockMapping,
                id: 2,
                internalRoleId: 6,
            } as unknown as RoleMappingModel;

            roleMappingRepository.findMappings.mockResolvedValue([
                mapping1,
                mapping2,
            ]);
            roleService.getUserRoles.mockResolvedValue(mockUserRolesResponse);
            roleService.assignRoleToUser
                .mockResolvedValueOnce({
                    message: 'Роль успешно назначена пользователю',
                    userRoleId: 5,
                    userId: 1,
                    roleId: 5,
                    tenantId: 1,
                })
                .mockResolvedValueOnce({
                    message: 'Роль успешно назначена пользователю',
                    userRoleId: 6,
                    userId: 1,
                    roleId: 6,
                    tenantId: 1,
                });
            roleMappingRepository.updateMappingStats.mockResolvedValue();
            mappingRuleEngine.evaluate.mockReturnValue(null);

            const result = await service.applyMappings(1, ['Admin'], {}, 1, 1);

            expect(result.applied).toBe(2);
            expect(result.errors).toBe(0);
            expect(result.appliedRoles).toHaveLength(2);
            expect(result.appliedRoles[0].roleId).toBe(5);
            expect(result.appliedRoles[1].roleId).toBe(6);
        });

        it('should handle parallel processing of many mappings (100+)', async () => {
            const manyMappings = Array.from({ length: 150 }, (_, i) => ({
                ...mockMapping,
                id: i + 1,
                internalRoleId: 10 + i,
                priority: 100 + i,
            })) as unknown as RoleMappingModel[];

            roleMappingRepository.findMappings.mockResolvedValue(manyMappings);
            roleService.getUserRoles.mockResolvedValue(mockUserRolesResponse);
            roleService.assignRoleToUser.mockResolvedValue({
                message: 'Роль успешно назначена пользователю',
                userRoleId: 1,
                userId: 1,
                roleId: 1,
                tenantId: 1,
            });
            roleMappingRepository.updateMappingStats.mockResolvedValue();
            mappingRuleEngine.evaluate.mockReturnValue(null);

            const result = await service.applyMappings(1, ['Admin'], {}, 1, 1);

            // Все маппинги должны быть обработаны
            expect(result.applied).toBe(150);
            expect(result.errors).toBe(0);
            expect(result.appliedRoles).toHaveLength(150);
            // Проверяем, что все маппинги были вызваны
            expect(roleService.assignRoleToUser).toHaveBeenCalledTimes(150);
        });

        it('should include error details when mappings fail', async () => {
            const mapping1 = {
                ...mockMapping,
                id: 1,
                internalRoleId: 5,
            } as unknown as RoleMappingModel;
            const mapping2 = {
                ...mockMapping,
                id: 2,
                internalRoleId: 6,
            } as unknown as RoleMappingModel;

            roleMappingRepository.findMappings.mockResolvedValue([
                mapping1,
                mapping2,
            ]);
            roleService.getUserRoles.mockResolvedValue(mockUserRolesResponse);
            roleService.assignRoleToUser
                .mockResolvedValueOnce({
                    message: 'Роль успешно назначена пользователю',
                    userRoleId: 5,
                    userId: 1,
                    roleId: 5,
                    tenantId: 1,
                })
                .mockRejectedValueOnce(new Error('Role assignment failed'));
            roleMappingRepository.updateMappingStats.mockResolvedValue();
            mappingRuleEngine.evaluate.mockReturnValue(null);

            const result = await service.applyMappings(1, ['Admin'], {}, 1, 1);

            expect(result.applied).toBe(1);
            expect(result.errors).toBe(1);
            expect(result.errorDetails).toBeDefined();
            expect(result.errorDetails).toHaveLength(1);
            expect(result.errorDetails?.[0].mappingId).toBe(2);
            expect(result.errorDetails?.[0].roleId).toBe(6);
            expect(result.errorDetails?.[0].error).toContain(
                'Role assignment failed',
            );
        });

        it('should resolve role by name when roleName is provided in evaluation result', async () => {
            const mappingWithRuleName = {
                ...mockMapping,
                mappingRules: {
                    conditions: [
                        {
                            if: { department: 'IT' },
                            then: 'ADMIN',
                        },
                    ],
                },
            } as unknown as RoleMappingModel;

            roleMappingRepository.findMappings.mockResolvedValue([
                mappingWithRuleName,
            ]);
            roleService.getUserRoles.mockResolvedValue(mockUserRolesResponse);
            roleService.getRole.mockResolvedValue({
                id: 15,
                role: 'ADMIN',
                description: 'Admin role',
                level: 100,
                permissions: [],
                isSystemRole: false,
                isActive: true,
                tenantId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            roleService.assignRoleToUser.mockResolvedValue({
                message: 'Роль успешно назначена пользователю',
                userRoleId: 4,
                userId: 1,
                roleId: 15,
                tenantId: 1,
            });
            roleMappingRepository.updateMappingStats.mockResolvedValue();
            mappingRuleEngine.evaluate.mockReturnValue({
                matched: true,
                roleName: 'ADMIN',
                roleId: null,
            });

            const result = await service.applyMappings(
                1,
                ['Admin'],
                { department: 'IT' },
                1,
                1,
            );

            expect(result.applied).toBe(1);
            expect(roleService.getRole).toHaveBeenCalledWith('ADMIN', 1);
            expect(roleService.assignRoleToUser).toHaveBeenCalledWith(
                {
                    userId: 1,
                    roleId: 15,
                    tenantId: 1,
                },
                1,
                ['USER', 'MANAGER'],
            );
        });

        it('should fallback to mapping.internalRoleId when role name resolution fails', async () => {
            const mappingWithRuleName = {
                ...mockMapping,
                mappingRules: {
                    conditions: [
                        {
                            if: { department: 'IT' },
                            then: 'NONEXISTENT_ROLE',
                        },
                    ],
                },
            } as unknown as RoleMappingModel;

            roleMappingRepository.findMappings.mockResolvedValue([
                mappingWithRuleName,
            ]);
            roleService.getUserRoles.mockResolvedValue(mockUserRolesResponse);
            roleService.getRole.mockRejectedValue(new Error('Role not found'));
            roleService.assignRoleToUser.mockResolvedValue({
                message: 'Роль успешно назначена пользователю',
                userRoleId: 4,
                userId: 1,
                roleId: 5, // Используется mapping.internalRoleId
                tenantId: 1,
            });
            roleMappingRepository.updateMappingStats.mockResolvedValue();
            mappingRuleEngine.evaluate.mockReturnValue({
                matched: true,
                roleName: 'NONEXISTENT_ROLE',
                roleId: null,
            });

            const result = await service.applyMappings(
                1,
                ['Admin'],
                { department: 'IT' },
                1,
                1,
            );

            expect(result.applied).toBe(1);
            expect(roleService.getRole).toHaveBeenCalledWith(
                'NONEXISTENT_ROLE',
                1,
            );
            // Должен использовать mapping.internalRoleId при ошибке поиска роли
            expect(roleService.assignRoleToUser).toHaveBeenCalledWith(
                {
                    userId: 1,
                    roleId: 5,
                    tenantId: 1,
                },
                1,
                ['USER', 'MANAGER'],
            );
        });

        it('should apply mappings in priority order', async () => {
            const lowPriorityMapping = {
                ...mockMapping,
                id: 2,
                priority: 200,
                internalRoleId: 10,
            } as unknown as RoleMappingModel;
            const highPriorityMapping = {
                ...mockMapping,
                id: 3,
                priority: 50,
                internalRoleId: 20,
            } as unknown as RoleMappingModel;
            const mediumPriorityMapping = {
                ...mockMapping,
                id: 4,
                priority: 100,
                internalRoleId: 30,
            } as unknown as RoleMappingModel;

            roleMappingRepository.findMappings.mockResolvedValue([
                lowPriorityMapping,
                highPriorityMapping,
                mediumPriorityMapping,
            ]);
            roleService.getUserRoles.mockResolvedValue(mockUserRolesResponse);
            roleService.assignRoleToUser.mockResolvedValue({
                message: 'Роль успешно назначена пользователю',
                userRoleId: 1,
                userId: 1,
                roleId: 1,
                tenantId: 1,
            });
            roleMappingRepository.updateMappingStats.mockResolvedValue();
            mappingRuleEngine.evaluate.mockReturnValue(null);

            const result = await service.applyMappings(1, ['Admin'], {}, 1, 1);

            expect(result.applied).toBe(3);
            // Проверяем порядок применения по приоритету (меньше = выше)
            // highPriorityMapping (50) должен быть первым
            expect(result.appliedRoles[0].roleId).toBe(20);
        });

        it('should include userAttributes in evaluation context', async () => {
            const mappingWithRules = {
                ...mockMapping,
                mappingRules: {
                    conditions: [
                        {
                            if: { department: 'IT' },
                            then: 15,
                        },
                    ],
                },
            } as unknown as RoleMappingModel;

            roleMappingRepository.findMappings.mockResolvedValue([
                mappingWithRules,
            ]);
            roleService.getUserRoles.mockResolvedValue(mockUserRolesResponse);
            roleService.assignRoleToUser.mockResolvedValue({
                message: 'Роль успешно назначена пользователю',
                userRoleId: 4,
                userId: 1,
                roleId: 15,
                tenantId: 1,
            });
            roleMappingRepository.updateMappingStats.mockResolvedValue();
            mappingRuleEngine.evaluate.mockReturnValue({
                matched: true,
                roleId: 15,
            });

            const userAttributes = {
                department: 'IT',
                location: 'Moscow',
            };

            await service.applyMappings(1, ['Admin'], userAttributes, 1, 1);

            expect(mappingRuleEngine.evaluate).toHaveBeenCalledWith(
                mappingWithRules.mappingRules,
                {
                    externalRoleName: 'Admin',
                    userAttributes,
                },
            );
        });
    });
});
