import { Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { RedisService } from '../redis.service';

describe('RedisService - scanKeys() (unit)', () => {
    let redisService: RedisService;
    let mockRedisClient: jest.Mocked<Pick<Redis, 'scan' | 'ping'>>;

    beforeEach(() => {
        // Mock Redis client
        mockRedisClient = {
            scan: jest.fn(),
            ping: jest.fn().mockResolvedValue('PONG'),
        };

        redisService = new RedisService(mockRedisClient as unknown as Redis);
        jest.spyOn(Logger.prototype, 'debug').mockImplementation();
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('scanKeys()', () => {
        it('должен вернуть все ключи по паттерну в батчах', async () => {
            // Мокируем 3 итерации SCAN
            mockRedisClient.scan
                .mockResolvedValueOnce([
                    '10',
                    ['user:roles:1:100', 'user:roles:1:101'],
                ])
                .mockResolvedValueOnce([
                    '20',
                    ['user:roles:1:102', 'user:roles:1:103'],
                ])
                .mockResolvedValueOnce(['0', ['user:roles:1:104']]);

            const allKeys: string[] = [];

            for await (const batch of redisService.scanKeys(
                'user:roles:*',
                100,
            )) {
                allKeys.push(...batch);
            }

            expect(allKeys.length).toBe(5);
            expect(allKeys).toContain('user:roles:1:100');
            expect(allKeys).toContain('user:roles:1:104');
            expect(mockRedisClient.scan).toHaveBeenCalledTimes(3);
        });

        it('должен пропускать пустые батчи', async () => {
            mockRedisClient.scan
                .mockResolvedValueOnce(['10', ['key1', 'key2']])
                .mockResolvedValueOnce(['20', []]) // Пустой батч
                .mockResolvedValueOnce(['0', ['key3']]);

            const allKeys: string[] = [];

            for await (const batch of redisService.scanKeys('test:*', 100)) {
                allKeys.push(...batch);
            }

            expect(allKeys.length).toBe(3);
            expect(allKeys).toEqual(['key1', 'key2', 'key3']);
        });

        it('должен обрабатывать ошибки Redis', async () => {
            mockRedisClient.scan.mockRejectedValue(
                new Error('Redis connection lost'),
            );

            const allKeys: string[] = [];

            for await (const batch of redisService.scanKeys('test:*', 100)) {
                allKeys.push(...batch);
            }

            expect(allKeys.length).toBe(0);
            expect(Logger.prototype.error).toHaveBeenCalled();
        });

        it('должен использовать корректные параметры SCAN', async () => {
            mockRedisClient.scan.mockResolvedValue(['0', ['key1']]);

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const batch of redisService.scanKeys(
                'user:roles:*',
                50,
            )) {
                // Итерация для запуска генератора
            }

            expect(mockRedisClient.scan).toHaveBeenCalledWith(
                '0',
                'MATCH',
                'user:roles:*',
                'COUNT',
                50,
            );
        });

        it('должен остановиться когда cursor = 0', async () => {
            mockRedisClient.scan
                .mockResolvedValueOnce(['5', ['key1']])
                .mockResolvedValueOnce(['0', ['key2']]); // Конец

            const scanCalls: number[] = [];

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const batch of redisService.scanKeys('test:*', 100)) {
                scanCalls.push(mockRedisClient.scan.mock.calls.length);
            }

            expect(mockRedisClient.scan).toHaveBeenCalledTimes(2);
            expect(scanCalls).toEqual([1, 2]);
        });
    });
});
