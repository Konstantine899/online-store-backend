import { REDIS_CLIENT } from '@app/infrastructure/config/redis/redis.provider';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CacheService } from './cache.service';

describe('CacheService (Unit)', () => {
    let service: CacheService;
    let mockRedis: {
        get: jest.Mock;
        setex: jest.Mock;
        del: jest.Mock;
        scan: jest.Mock;
        exists: jest.Mock;
        ttl: jest.Mock;
        ping: jest.Mock;
    };

    beforeEach(async () => {
        // Mock Redis client
        mockRedis = {
            get: jest.fn(),
            setex: jest.fn(),
            del: jest.fn(),
            scan: jest.fn(),
            exists: jest.fn(),
            ttl: jest.fn(),
            ping: jest.fn(),
        };

        // Мокируем process.env для тестов
        process.env.REDIS_ENABLED = 'true';
        process.env.REDIS_TTL = '900';

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CacheService,
                {
                    provide: REDIS_CLIENT,
                    useValue: mockRedis,
                },
            ],
        }).compile();

        service = module.get<CacheService>(CacheService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.REDIS_ENABLED;
        delete process.env.REDIS_TTL;
    });

    describe('get()', () => {
        it('должен вернуть распарсенное значение если ключ существует', async () => {
            const testData = { userId: 1, name: 'Test' };
            mockRedis.get.mockResolvedValue(JSON.stringify(testData));

            const result = await service.get('user:1');

            expect(result).toEqual(testData);
            expect(mockRedis.get).toHaveBeenCalledWith('user:1');
        });

        it('должен вернуть null если ключ не найден', async () => {
            mockRedis.get.mockResolvedValue(null);

            const result = await service.get('user:999');

            expect(result).toBeNull();
        });

        it('должен вернуть null при ошибке чтения', async () => {
            mockRedis.get.mockRejectedValue(new Error('Redis error'));

            const result = await service.get('user:1');

            expect(result).toBeNull();
        });
    });

    describe('set()', () => {
        it('должен сохранить значение с дефолтным TTL', async () => {
            const testData = { userId: 1, name: 'Test' };
            mockRedis.setex.mockResolvedValue('OK');

            await service.set('user:1', testData);

            expect(mockRedis.setex).toHaveBeenCalledWith(
                'user:1',
                900, // default TTL
                JSON.stringify(testData),
            );
        });

        it('должен сохранить значение с кастомным TTL', async () => {
            const testData = { userId: 1, name: 'Test' };
            mockRedis.setex.mockResolvedValue('OK');

            await service.set('user:1', testData, 300);

            expect(mockRedis.setex).toHaveBeenCalledWith(
                'user:1',
                300,
                JSON.stringify(testData),
            );
        });

        it('не должен бросать ошибку при сбое записи', async () => {
            mockRedis.setex.mockRejectedValue(new Error('Redis error'));

            await expect(
                service.set('user:1', { userId: 1 }),
            ).resolves.not.toThrow();
        });
    });

    describe('del()', () => {
        it('должен удалить ключ и вернуть количество удалённых', async () => {
            mockRedis.del.mockResolvedValue(1);

            const result = await service.del('user:1');

            expect(result).toBe(1);
            expect(mockRedis.del).toHaveBeenCalledWith('user:1');
        });

        it('должен вернуть 0 если ключ не найден', async () => {
            mockRedis.del.mockResolvedValue(0);

            const result = await service.del('user:999');

            expect(result).toBe(0);
        });

        it('должен вернуть 0 при ошибке удаления', async () => {
            mockRedis.del.mockRejectedValue(new Error('Redis error'));

            const result = await service.del('user:1');

            expect(result).toBe(0);
        });
    });

    describe('delPattern()', () => {
        it('должен удалить все ключи по паттерну', async () => {
            // Мокируем SCAN: первая итерация возвращает 2 ключа, вторая - 0 (курсор '0')
            mockRedis.scan.mockResolvedValueOnce([
                '1',
                ['user:1:prefs', 'user:2:prefs'],
            ]);
            mockRedis.scan.mockResolvedValueOnce(['0', []]);

            mockRedis.del.mockResolvedValue(2);

            const result = await service.delPattern('user:*:prefs');

            expect(result).toBe(2);
            expect(mockRedis.scan).toHaveBeenCalledTimes(2);
            expect(mockRedis.del).toHaveBeenCalledWith(
                'user:1:prefs',
                'user:2:prefs',
            );
        });

        it('должен вернуть 0 если паттерн не найден', async () => {
            mockRedis.scan.mockResolvedValue(['0', []]);

            const result = await service.delPattern('nonexistent:*');

            expect(result).toBe(0);
        });

        it('должен вернуть 0 при ошибке', async () => {
            mockRedis.scan.mockRejectedValue(new Error('Redis error'));

            const result = await service.delPattern('user:*');

            expect(result).toBe(0);
        });
    });

    describe('exists()', () => {
        it('должен вернуть true если ключ существует', async () => {
            mockRedis.exists.mockResolvedValue(1);

            const result = await service.exists('user:1');

            expect(result).toBe(true);
        });

        it('должен вернуть false если ключ не существует', async () => {
            mockRedis.exists.mockResolvedValue(0);

            const result = await service.exists('user:999');

            expect(result).toBe(false);
        });

        it('должен вернуть false при ошибке', async () => {
            mockRedis.exists.mockRejectedValue(new Error('Redis error'));

            const result = await service.exists('user:1');

            expect(result).toBe(false);
        });
    });

    describe('ttl()', () => {
        it('должен вернуть TTL в секундах', async () => {
            mockRedis.ttl.mockResolvedValue(600);

            const result = await service.ttl('user:1');

            expect(result).toBe(600);
        });

        it('должен вернуть -1 если ключ без TTL', async () => {
            mockRedis.ttl.mockResolvedValue(-1);

            const result = await service.ttl('user:1');

            expect(result).toBe(-1);
        });

        it('должен вернуть -2 если ключ не существует', async () => {
            mockRedis.ttl.mockResolvedValue(-2);

            const result = await service.ttl('user:999');

            expect(result).toBe(-2);
        });

        it('должен вернуть -2 при ошибке', async () => {
            mockRedis.ttl.mockRejectedValue(new Error('Redis error'));

            const result = await service.ttl('user:1');

            expect(result).toBe(-2);
        });
    });

    describe('ping()', () => {
        it('должен вернуть true если Redis доступен', async () => {
            mockRedis.ping.mockResolvedValue('PONG');

            const result = await service.ping();

            expect(result).toBe(true);
        });

        it('должен вернуть false при ошибке', async () => {
            mockRedis.ping.mockRejectedValue(new Error('Redis error'));

            const result = await service.ping();

            expect(result).toBe(false);
        });
    });

    describe('Pass-through mode (Redis disabled)', () => {
        beforeEach(async () => {
            process.env.REDIS_ENABLED = 'false';

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    CacheService,
                    {
                        provide: REDIS_CLIENT,
                        useValue: null, // Redis отключен
                    },
                ],
            }).compile();

            service = module.get<CacheService>(CacheService);
        });

        it('get() должен вернуть null', async () => {
            const result = await service.get('user:1');
            expect(result).toBeNull();
        });

        it('set() не должен вызвать Redis', async () => {
            await service.set('user:1', { userId: 1 });
            expect(mockRedis.setex).not.toHaveBeenCalled();
        });

        it('del() должен вернуть 0', async () => {
            const result = await service.del('user:1');
            expect(result).toBe(0);
        });

        it('exists() должен вернуть false', async () => {
            const result = await service.exists('user:1');
            expect(result).toBe(false);
        });

        it('ping() должен вернуть false', async () => {
            const result = await service.ping();
            expect(result).toBe(false);
        });
    });
});
