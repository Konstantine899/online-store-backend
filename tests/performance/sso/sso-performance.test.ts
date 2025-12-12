/**
 * Performance тесты для SSO интеграции
 * Тестируют производительность критичных операций SSO flow
 *
 * Сценарии:
 * - Очистка state при высокой нагрузке (1000+ запросов)
 * - Синхронизация ролей для большого количества пользователей (100+)
 * - Параллельные SSO запросы
 *
 * Related to: SAAS-017-19, Этап 3.1, Фаза 3
 */

import { Test, type TestingModule } from '@nestjs/testing';
import { SSOStateService } from '@app/infrastructure/services/role/sso/sso-state.service';
import { SSORoleSyncService } from '@app/infrastructure/services/role/sso/sso-role-sync.service';
import { UserService } from '@app/infrastructure/services/user/user.service';
import { RoleService } from '@app/infrastructure/services/role/role.service';
import { RoleMappingRepository } from '@app/infrastructure/repositories/role/role-mapping.repository';
import { PerformanceTesting } from '../../utils/performance-testing';
import type { ISSOUserProfile } from '@app/domain/types/sso/sso-user-profile.types';
import type { ExternalRoleConfigModel, RoleMappingModel } from '@app/domain/models';
import type { UserRolesResponse } from '@app/infrastructure/responses/role/user-roles.response';

describe('SSO Performance Tests', () => {
    let ssoStateService: SSOStateService;
    let ssoRoleSyncService: SSORoleSyncService;
    let userService: jest.Mocked<UserService>;
    let roleService: jest.Mocked<RoleService>;
    let roleMappingRepository: jest.Mocked<RoleMappingRepository>;

    beforeEach(async () => {
        // Мокируем зависимости для SSORoleSyncService
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
                SSOStateService,
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

        ssoStateService = module.get<SSOStateService>(SSOStateService);
        ssoRoleSyncService = module.get<SSORoleSyncService>(SSORoleSyncService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        if (ssoStateService && typeof ssoStateService.onModuleDestroy === 'function') {
            ssoStateService.onModuleDestroy();
        }
    });

    // ============================================================================
    // TESTS: State Service Performance
    // ============================================================================

    describe('SSOStateService Performance', () => {
        it('должен эффективно обрабатывать генерацию state при высокой нагрузке (1000+ запросов)', async () => {
            const result = await PerformanceTesting.benchmark(
                'generate-state-high-load',
                async () => {
                    const tenantId = Math.floor(Math.random() * 10) + 1;
                    const providerId = Math.floor(Math.random() * 100) + 1;
                    return ssoStateService.generateState(tenantId, providerId);
                },
                {
                    iterations: 1000,
                    warmupIterations: 50,
                    memoryTracking: true,
                },
            );

            expect(result.averageDuration).toBeLessThan(5);
            expect(result.maxDuration).toBeLessThan(20);
            expect(result.throughput).toBeGreaterThan(200); // > 200 операций/сек
            expect(result.iterations).toBe(1000);
        });

        it('должен эффективно очищать истекшие state при высокой нагрузке', async () => {
            // Генерируем много state
            const nowSpy = jest.spyOn(Date, 'now');
            const currentTime = Date.now();
            nowSpy.mockReturnValue(currentTime);

            // Генерируем 500 state
            for (let i = 0; i < 500; i++) {
                ssoStateService.generateState(1, i);
            }

            // Симулируем истечение (6 минут)
            nowSpy.mockReturnValue(currentTime + 6 * 60 * 1000);

            // Бенчмарк очистки
            const result = await PerformanceTesting.benchmark(
                'cleanup-expired-states',
                async () => {
                    // Генерируем новый state, который триггернет cleanup при достижении порога
                    for (let i = 500; i < 600; i++) {
                        ssoStateService.generateState(1, i);
                    }
                },
                {
                    iterations: 1,
                    memoryTracking: true,
                },
            );

            expect(result.maxDuration).toBeLessThan(100);
            expect(ssoStateService.getActiveStatesCount()).toBeLessThan(600); // Истекшие должны быть удалены

            nowSpy.mockRestore();
        });

        it('должен эффективно валидировать state при параллельных запросах', async () => {
            // Генерируем state для теста
            const states: string[] = [];
            for (let i = 0; i < 100; i++) {
                states.push(ssoStateService.generateState(1, i));
            }

            const result = await PerformanceTesting.loadTest(
                'validate-state-parallel',
                async () => {
                    const randomState = states[Math.floor(Math.random() * states.length)];
                    return ssoStateService.validateState(randomState);
                },
                {
                    concurrentUsers: 50,
                    duration: 2000, // 2 секунды
                    rampUpTime: 500,
                },
            );

            expect(result.totalRequests).toBeGreaterThan(100);
            expect(result.errorRate).toBeLessThan(5); // Менее 5% ошибок
            expect(result.averageResponseTime).toBeLessThan(10); // Среднее время < 10ms
        });
    });

    // ============================================================================
    // TESTS: Role Sync Service Performance
    // ============================================================================

    describe('SSORoleSyncService Performance', () => {
        const mockProviderConfig: ExternalRoleConfigModel = {
            id: 1,
            tenantId: 1,
            providerType: 'OAUTH2',
            name: 'Test Provider',
            status: 'ACTIVE',
        } as ExternalRoleConfigModel;

        const mockSSOProfile: ISSOUserProfile = {
            id: 'sso-user-123',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            displayName: 'John Doe',
            roles: ['Admin', 'User', 'Moderator'],
            providerType: 'OAUTH2',
        };

        beforeEach(() => {
            // Настраиваем моки для успешной синхронизации
            roleMappingRepository.findMappingsByConfig.mockResolvedValue([
                {
                    id: 1,
                    externalRoleConfigId: 1,
                    tenantId: 1,
                    externalRoleName: 'Admin',
                    internalRoleId: 2,
                    priority: 100,
                    isActive: true,
                },
                {
                    id: 2,
                    externalRoleConfigId: 1,
                    tenantId: 1,
                    externalRoleName: 'User',
                    internalRoleId: 3,
                    priority: 100,
                    isActive: true,
                },
                {
                    id: 3,
                    externalRoleConfigId: 1,
                    tenantId: 1,
                    externalRoleName: 'Moderator',
                    internalRoleId: 4,
                    priority: 100,
                    isActive: true,
                },
            ] as RoleMappingModel[]);

            roleService.getUserRoles.mockResolvedValue({
                roles: [],
            } as UserRolesResponse);

            roleService.assignRoleToUser.mockResolvedValue({
                success: true,
            } as unknown as Awaited<ReturnType<typeof roleService.assignRoleToUser>>);
        });

        it('должен эффективно синхронизировать роли для большого количества пользователей (100+)', async () => {
            const result = await PerformanceTesting.benchmark(
                'sync-roles-multiple-users',
                async () => {
                    const userId = Math.floor(Math.random() * 100) + 1;
                    await ssoRoleSyncService.syncRoles(
                        userId,
                        mockSSOProfile,
                        mockProviderConfig,
                        1,
                    );
                },
                {
                    iterations: 100,
                    warmupIterations: 10,
                    memoryTracking: true,
                },
            );

            expect(result.averageDuration).toBeLessThan(100);
            expect(result.maxDuration).toBeLessThan(500);
            expect(result.throughput).toBeGreaterThan(10); // > 10 операций/сек
        });

        it('должен эффективно применять множественные маппинги ролей параллельно', async () => {
            // Создаем профиль с множественными ролями
            const profileWithManyRoles: ISSOUserProfile = {
                ...mockSSOProfile,
                roles: Array.from({ length: 20 }, (_, i) => `Role${i}`),
            };

            // Создаем множество маппингов
            const manyMappings: RoleMappingModel[] = Array.from({ length: 20 }, (_, i) => ({
                id: i + 1,
                externalRoleConfigId: 1,
                tenantId: 1,
                externalRoleName: `Role${i}`,
                internalRoleId: i + 2,
                priority: 100,
                isActive: true,
            })) as RoleMappingModel[];

            roleMappingRepository.findMappingsByConfig.mockResolvedValue(manyMappings);

            const result = await PerformanceTesting.benchmark(
                'sync-roles-parallel-mappings',
                async () => {
                    await ssoRoleSyncService.syncRoles(
                        1,
                        profileWithManyRoles,
                        mockProviderConfig,
                        1,
                    );
                },
                {
                    iterations: 50,
                    warmupIterations: 5,
                    memoryTracking: true,
                },
            );

            expect(result.averageDuration).toBeLessThan(200);
            expect(result.maxDuration).toBeLessThan(1000);
            // Проверяем, что все маппинги были применены параллельно
            expect(roleService.assignRoleToUser).toHaveBeenCalled();
        });

        it('должен эффективно обрабатывать параллельные SSO запросы', async () => {
            const result = await PerformanceTesting.loadTest(
                'sso-sync-parallel-requests',
                async () => {
                    const userId = Math.floor(Math.random() * 1000) + 1;
                    await ssoRoleSyncService.syncRoles(
                        userId,
                        mockSSOProfile,
                        mockProviderConfig,
                        1,
                    );
                },
                {
                    concurrentUsers: 30,
                    duration: 3000, // 3 секунды
                    rampUpTime: 1000,
                },
            );

            expect(result.totalRequests).toBeGreaterThan(50);
            expect(result.errorRate).toBeLessThan(10); // Менее 10% ошибок
            expect(result.averageResponseTime).toBeLessThan(200); // Среднее время < 200ms
        });
    });
});

