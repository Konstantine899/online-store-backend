import { Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

/**
 * Global Redis модуль
 * Предоставляет Redis client для всего приложения
 */
@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: (configService: ConfigService): Redis => {
                const redisConfig = configService.get('redis');

                const client = new Redis({
                    host: redisConfig.host,
                    port: redisConfig.port,
                    password: redisConfig.password,
                    db: redisConfig.db,
                    keyPrefix: redisConfig.keyPrefix,
                    retryStrategy: redisConfig.retryStrategy,
                    maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
                    enableReadyCheck: redisConfig.enableReadyCheck,
                    showFriendlyErrorStack: redisConfig.showFriendlyErrorStack,
                    lazyConnect: false,
                });

                // Error handling
                client.on('error', (err) => {
                    console.error('Redis Client Error:', err);
                });

                client.on('connect', () => {
                    console.log(
                        `✅ Redis connected to ${redisConfig.host}:${redisConfig.port}`,
                    );
                });

                client.on('ready', () => {
                    console.log('✅ Redis client ready');
                });

                return client;
            },
            inject: [ConfigService],
        },
        RedisService,
    ],
    exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule implements OnModuleInit, OnModuleDestroy {
    constructor(private readonly redisService: RedisService) {}

    async onModuleInit(): Promise<void> {
        await this.redisService.ping();
    }

    async onModuleDestroy(): Promise<void> {
        await this.redisService.disconnect();
    }
}
