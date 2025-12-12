/**
 * Интерфейс для распределённого кэша (Redis)
 * Используется для кэширования tenantId в распределённых системах
 *
 * @remarks
 * Опциональный сервис - если не предоставлен, используется только in-memory кэш
 * Для использования нужно установить пакет redis и создать реализацию
 */
export interface IRedisCache {
    /**
     * Получает значение из кэша
     * @param key - ключ кэша
     * @returns значение или null, если не найдено
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Устанавливает значение в кэш с TTL
     * @param key - ключ кэша
     * @param value - значение для кэширования
     * @param ttlSeconds - время жизни в секундах
     */
    set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;

    /**
     * Удаляет значение из кэша
     * @param key - ключ кэша
     */
    delete(key: string): Promise<void>;

    /**
     * Проверяет существование ключа
     * @param key - ключ кэша
     */
    exists(key: string): Promise<boolean>;
}
