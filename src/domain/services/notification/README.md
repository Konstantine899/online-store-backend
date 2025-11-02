# Notification Service Domain

## Интерфейсы

### IRedisCache

Опциональный интерфейс для распределённого кэша (Redis).

**Использование:**

```typescript
// 1. Установить пакет redis (если еще не установлен)
npm install redis @types/redis

// 2. Создать реализацию IRedisCache
// src/infrastructure/services/cache/redis-cache.service.ts
@Injectable()
export class RedisCacheService implements IRedisCache {
    constructor(private readonly redisClient: RedisClientType) {}

    async get<T>(key: string): Promise<T | null> { /* ... */ }
    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> { /* ... */ }
    async delete(key: string): Promise<void> { /* ... */ }
    async exists(key: string): Promise<boolean> { /* ... */ }
}

// 3. Зарегистрировать в ServicesModule
{
    provide: 'IRedisCache',
    useClass: RedisCacheService, // или null для отключения
}
```

**Примечание:** Если `IRedisCache` не предоставлен, используется только in-memory кэш.
