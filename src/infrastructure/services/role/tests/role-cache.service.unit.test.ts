import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { RoleModel } from '@app/domain/models';
import { RoleRepository } from '@app/infrastructure/repositories';
import { RoleCacheService } from '../role-cache.service';

describe('RoleCacheService', () => {
    let service: RoleCacheService;
    let roleRepository: jest.Mocked<RoleRepository>;

    beforeEach(async () => {
        // Mock RoleRepository
        const mockRoleRepository = {
            findRoleByName: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleCacheService,
                {
                    provide: RoleRepository,
                    useValue: mockRoleRepository,
                },
            ],
        }).compile();

        service = module.get<RoleCacheService>(RoleCacheService);
        roleRepository = module.get(RoleRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getCachedRole', () => {
        it('должен закэшировать системную роль после первого запроса', async () => {
            // Arrange
            const mockRole = {
                id: 1,
                role: 'VIP_CUSTOMER',
                description: 'VIP клиент',
                isSystemRole: true,
                isActive: true,
            } as RoleModel;

            roleRepository.findRoleByName.mockResolvedValue(mockRole);

            // Act - первый вызов
            const result1 = await service.getCachedRole('VIP_CUSTOMER');

            // Assert - роль возвращена и запрос к БД был
            expect(result1).toEqual(mockRole);
            expect(roleRepository.findRoleByName).toHaveBeenCalledTimes(1);
            expect(roleRepository.findRoleByName).toHaveBeenCalledWith(
                'VIP_CUSTOMER',
            );

            // Act - второй вызов (должен вернуть из кэша)
            const result2 = await service.getCachedRole('VIP_CUSTOMER');

            // Assert - роль возвращена из кэша, запроса к БД не было
            expect(result2).toEqual(mockRole);
            expect(roleRepository.findRoleByName).toHaveBeenCalledTimes(1); // Все еще 1!
        });

        it('НЕ должен кэшировать tenant-specific роли', async () => {
            // Arrange
            const mockRole = {
                id: 2,
                role: 'CUSTOM_ROLE',
                description: 'Кастомная роль',
                isSystemRole: false, // не системная
                isActive: true,
                tenantId: 1,
            } as RoleModel;

            roleRepository.findRoleByName.mockResolvedValue(mockRole);

            // Act - два вызова
            await service.getCachedRole('CUSTOM_ROLE');
            await service.getCachedRole('CUSTOM_ROLE');

            // Assert - оба раза запрос к БД (не кэшируется)
            expect(roleRepository.findRoleByName).toHaveBeenCalledTimes(2);
        });

        it('должен вернуть null если роль не найдена', async () => {
            // Arrange
            roleRepository.findRoleByName.mockResolvedValue(null);

            // Act
            const result = await service.getCachedRole('NON_EXISTENT');

            // Assert
            expect(result).toBeNull();
            expect(roleRepository.findRoleByName).toHaveBeenCalledTimes(1);
        });
    });

    describe('invalidate', () => {
        it('должен удалить роль из кэша', async () => {
            // Arrange
            const mockRole = {
                id: 1,
                role: 'VIP_CUSTOMER',
                isSystemRole: true,
                isActive: true,
            } as RoleModel;

            roleRepository.findRoleByName.mockResolvedValue(mockRole);

            // Закэшировать роль
            await service.getCachedRole('VIP_CUSTOMER');
            expect(roleRepository.findRoleByName).toHaveBeenCalledTimes(1);

            // Act - инвалидировать кэш
            service.invalidate('VIP_CUSTOMER');

            // Assert - следующий запрос снова идет в БД
            await service.getCachedRole('VIP_CUSTOMER');
            expect(roleRepository.findRoleByName).toHaveBeenCalledTimes(2);
        });
    });

    describe('getStats', () => {
        it('должен корректно отслеживать hits и misses', async () => {
            // Arrange
            const mockRole = {
                id: 1,
                role: 'VIP_CUSTOMER',
                isSystemRole: true,
                isActive: true,
            } as RoleModel;

            roleRepository.findRoleByName.mockResolvedValue(mockRole);

            // Act
            await service.getCachedRole('VIP_CUSTOMER'); // miss
            await service.getCachedRole('VIP_CUSTOMER'); // hit
            await service.getCachedRole('VIP_CUSTOMER'); // hit

            const stats = service.getStats();

            // Assert
            expect(stats.hits).toBe(2);
            expect(stats.misses).toBe(1);
            expect(stats.hitRate).toBe(66.67); // 2/3 * 100
            expect(stats.size).toBe(1); // 1 роль в кэше
            expect(stats.evictions).toBe(0);
            expect(stats.invalidations).toBe(0);
            expect(stats.ttlMs).toBe(3600000); // 1 час
            expect(stats.maxSize).toBe(50);
        });
    });

    describe('TTL (Time To Live)', () => {
        it('должен инвалидировать запись после истечения TTL', async () => {
            // Arrange
            const mockRole = {
                id: 1,
                role: 'VIP_CUSTOMER',
                isSystemRole: true,
                isActive: true,
            } as RoleModel;

            roleRepository.findRoleByName.mockResolvedValue(mockRole);

            // Act - закэшировать роль
            await service.getCachedRole('VIP_CUSTOMER');
            expect(service.getStats().size).toBe(1);

            // Подменить timestamp кэша на устаревший
            const cachePrivate = service['cache'] as Map<
                string,
                { role: RoleModel; cachedAt: number }
            >;
            const cached = cachePrivate.get('VIP_CUSTOMER');
            if (cached) {
                cached.cachedAt = Date.now() - 3600001; // > 1 hour ago
            }

            // Act - повторный запрос (TTL истёк)
            await service.getCachedRole('VIP_CUSTOMER');

            // Assert - запись удалена и сделан новый запрос к БД
            expect(roleRepository.findRoleByName).toHaveBeenCalledTimes(2);
            expect(service.getStats().invalidations).toBe(1); // TTL expiration
        });
    });

    describe('LRU Eviction', () => {
        it('должен вытеснять старые записи при превышении MAX_CACHE_SIZE', async () => {
            // Arrange - создать 51 системную роль
            const mockRoles: RoleModel[] = [];
            for (let i = 1; i <= 51; i++) {
                mockRoles.push({
                    id: i,
                    role: `SYSTEM_ROLE_${i}`,
                    isSystemRole: true,
                    isActive: true,
                } as RoleModel);
            }

            // Act - закэшировать 51 роль (максимум 50)
            for (let i = 0; i < 51; i++) {
                roleRepository.findRoleByName.mockResolvedValueOnce(
                    mockRoles[i],
                );
                await service.getCachedRole(`SYSTEM_ROLE_${i + 1}`);
            }

            const stats = service.getStats();

            // Assert
            expect(stats.size).toBe(50); // не больше MAX_CACHE_SIZE
            expect(stats.evictions).toBe(1); // 1 запись вытеснена
        });
    });

    describe('invalidateAll', () => {
        it('должен очистить весь кэш', async () => {
            // Arrange
            const mockRole1 = {
                id: 1,
                role: 'VIP_CUSTOMER',
                isSystemRole: true,
                isActive: true,
            } as RoleModel;
            const mockRole2 = {
                id: 2,
                role: 'WHOLESALE',
                isSystemRole: true,
                isActive: true,
            } as RoleModel;

            roleRepository.findRoleByName
                .mockResolvedValueOnce(mockRole1)
                .mockResolvedValueOnce(mockRole2);

            // Закэшировать 2 роли
            await service.getCachedRole('VIP_CUSTOMER');
            await service.getCachedRole('WHOLESALE');

            expect(service.getStats().size).toBe(2);

            // Act
            service.invalidateAll();

            // Assert
            expect(service.getStats().size).toBe(0);
        });
    });
});


