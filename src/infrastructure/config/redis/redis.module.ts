import { Global, Module } from '@nestjs/common';
import { redisProvider } from './redis.provider';

/**
 * Глобальный модуль для Redis кэширования
 * Экспортирует REDIS_CLIENT для использования в сервисах
 */
@Global()
@Module({
    providers: [redisProvider],
    exports: [redisProvider],
})
export class RedisModule {}

