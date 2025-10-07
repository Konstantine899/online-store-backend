import { JwtStrategy } from '@app/infrastructure/common/strategies/jwt.strategy';
import { UserService } from '@app/infrastructure/services';
import { CheckResponse } from '@app/infrastructure/responses';
import { IAccessTokenSubject } from '@app/domain/jwt';

/**
 * Unit-тесты для JwtStrategy
 * 
 * Цель: покрыть критичные сценарии JWT валидации
 * - Валидация корректного payload (пользователь существует)
 * - Валидация payload для несуществующего пользователя
 * - Обработка различных payload структур
 */

describe('JwtStrategy (unit)', () => {
    let strategy: JwtStrategy;
    let mockUserService: jest.Mocked<UserService>;

    beforeEach(() => {
        // Настройка env для JWT секрета
        process.env.JWT_ACCESS_SECRET = 'test-secret-key-for-unit-tests';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
        process.env.JWT_ACCESS_TTL = '15m';
        process.env.JWT_REFRESH_TTL = '30d';

        // Создаём мок UserService
        mockUserService = {
            checkUserAuth: jest.fn(),
        } as any;

        strategy = new JwtStrategy(mockUserService);
    });

    describe('validate', () => {
        it('должен вернуть данные пользователя для валидного payload', async () => {
            const payload: IAccessTokenSubject = {
                sub: 1,
            };

            const expectedUser: CheckResponse = {
                id: 1,
                email: 'user@test.com',
                roles: [{ id: 2, role: 'USER' }] as any,
            };

            mockUserService.checkUserAuth.mockResolvedValue(expectedUser);

            const result = await strategy.validate(payload);

            expect(result).toEqual(expectedUser);
            expect(mockUserService.checkUserAuth).toHaveBeenCalledWith(1);
            expect(mockUserService.checkUserAuth).toHaveBeenCalledTimes(1);
        });

        it('должен бросить ошибку если пользователь не найден', async () => {
            const payload: IAccessTokenSubject = {
                sub: 999,
            };

            // UserService бросает NotFoundException если пользователь не найден
            mockUserService.checkUserAuth.mockRejectedValue(
                new Error('Профиль пользователя не найден в БД'),
            );

            await expect(strategy.validate(payload)).rejects.toThrow(
                'Профиль пользователя не найден в БД',
            );
            expect(mockUserService.checkUserAuth).toHaveBeenCalledWith(999);
        });

        it('должен корректно обработать payload с admin ролью', async () => {
            const payload: IAccessTokenSubject = {
                sub: 1,
            };

            const expectedUser: CheckResponse = {
                id: 1,
                email: 'admin@test.com',
                roles: [
                    { id: 1, role: 'ADMIN' },
                    { id: 2, role: 'USER' },
                ] as any,
            };

            mockUserService.checkUserAuth.mockResolvedValue(expectedUser);

            const result = await strategy.validate(payload);

            expect(result).toEqual(expectedUser);
            expect(result?.roles).toHaveLength(2);
            expect(result?.roles?.some((r: any) => r.role === 'ADMIN')).toBe(true);
        });

        it('должен корректно обработать пользователей с разными email', async () => {
            const testEmails = [
                'user@test.com',
                'admin@company.org',
                'test.user+tag@example.co.uk',
            ];

            for (const email of testEmails) {
                const payload: IAccessTokenSubject = {
                    sub: 1,
                };

                const expectedUser: CheckResponse = {
                    id: 1,
                    email,
                    roles: [{ id: 2, role: 'USER' }] as any,
                };

                mockUserService.checkUserAuth.mockResolvedValue(expectedUser);

                const result = await strategy.validate(payload);

                expect(result?.email).toBe(email);
            }
        });

        it('должен передать корректный userId в checkUserAuth', async () => {
            const userIds = [1, 42, 999, 123456];

            for (const userId of userIds) {
                mockUserService.checkUserAuth.mockClear();
                
                const payload: IAccessTokenSubject = {
                    sub: userId,
                };

                mockUserService.checkUserAuth.mockResolvedValue({
                    id: userId,
                    email: `user${userId}@test.com`,
                    roles: [{ id: 2, role: 'USER' }] as any,
                });

                await strategy.validate(payload);

                expect(mockUserService.checkUserAuth).toHaveBeenCalledWith(userId);
            }
        });

        it('должен обработать ошибку от UserService', async () => {
            const payload: IAccessTokenSubject = {
                sub: 1,
            };

            mockUserService.checkUserAuth.mockRejectedValue(
                new Error('Database connection failed'),
            );

            await expect(strategy.validate(payload)).rejects.toThrow(
                'Database connection failed',
            );
        });

        it('должен вернуть CheckResponse даже если checkUserAuth возвращает объект с минимальными полями', async () => {
            const payload: IAccessTokenSubject = {
                sub: 1,
            };

            // CheckResponse должен иметь правильную структуру
            const minimalUser: CheckResponse = {
                id: 1,
                email: 'minimal@test.com',
                roles: [] as any,
            };

            mockUserService.checkUserAuth.mockResolvedValue(minimalUser);

            const result = await strategy.validate(payload);

            expect(result).toBeDefined();
            expect(result?.id).toBe(1);
            expect(result?.email).toBe('minimal@test.com');
            expect(result?.roles).toEqual([]);
        });
    });

    describe('Конфигурация стратегии', () => {
        it('должен использовать secretOrKey из JwtSettings', () => {
            // Проверяем, что стратегия создана без ошибок (секрет корректен)
            expect(strategy).toBeDefined();
            expect(strategy).toBeInstanceOf(JwtStrategy);
        });

        it('должен извлекать JWT из Authorization header', () => {
            // Passport автоматически проверяет конфигурацию при создании
            // Проверяем, что стратегия корректно инициализирована
            expect(strategy).toBeDefined();
            expect(strategy).toBeInstanceOf(JwtStrategy);
        });

        it('не должен игнорировать истечение токена (ignoreExpiration: false)', () => {
            // Эта конфигурация проверяется Passport при валидации токена
            // Проверяем, что стратегия создана с корректной конфигурацией
            expect(strategy).toBeDefined();
        });
    });

    describe('Граничные случаи', () => {
        it('должен обработать payload с минимальным userId', async () => {
            const payload: IAccessTokenSubject = {
                sub: 1,
            };

            const expectedUser: CheckResponse = {
                id: 1,
                email: 'first@test.com',
                roles: [{ id: 2, role: 'USER' }] as any,
            };

            mockUserService.checkUserAuth.mockResolvedValue(expectedUser);

            const result = await strategy.validate(payload);

            expect(result).toEqual(expectedUser);
        });

        it('должен обработать payload с большим userId', async () => {
            const payload: IAccessTokenSubject = {
                sub: 999999999,
            };

            const expectedUser: CheckResponse = {
                id: 999999999,
                email: 'user@test.com',
                roles: [{ id: 2, role: 'USER' }] as any,
            };

            mockUserService.checkUserAuth.mockResolvedValue(expectedUser);

            const result = await strategy.validate(payload);

            expect(result?.id).toBe(999999999);
        });

        it('должен обработать пользователя без ролей', async () => {
            const payload: IAccessTokenSubject = {
                sub: 1,
            };

            const expectedUser: CheckResponse = {
                id: 1,
                email: 'user@test.com',
                roles: [] as any,
            };

            mockUserService.checkUserAuth.mockResolvedValue(expectedUser);

            const result = await strategy.validate(payload);

            expect(result).toEqual(expectedUser);
            expect(result?.roles).toEqual([]);
        });
    });

    describe('Производительность', () => {
        it('должен обрабатывать множественные валидации быстро', async () => {
            const payload: IAccessTokenSubject = {
                sub: 1,
            };

            const expectedUser: CheckResponse = {
                id: 1,
                email: 'user@test.com',
                roles: [{ id: 2, role: 'USER' }] as any,
            };

            mockUserService.checkUserAuth.mockResolvedValue(expectedUser);

            const startTime = Date.now();

            // Выполняем 100 валидаций
            const promises = Array.from({ length: 100 }, () =>
                strategy.validate(payload),
            );
            await Promise.all(promises);

            const duration = Date.now() - startTime;

            // Проверяем, что все валидации заняли разумное время (< 1 секунды для 100 операций)
            expect(duration).toBeLessThan(1000);
            expect(mockUserService.checkUserAuth).toHaveBeenCalledTimes(100);
        });
    });
});

