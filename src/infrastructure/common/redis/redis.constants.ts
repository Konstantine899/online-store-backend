/**
 * Injection token для Redis client
 */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * TTL по умолчанию для кэша (в секундах)
 */
export const DEFAULT_CACHE_TTL = 900; // 15 минут

/**
 * Префиксы для ключей Redis
 */
export const REDIS_KEY_PREFIXES = {
    USER_ROLES: 'user:roles:',
    ROLE: 'role:',
    PERMISSIONS: 'permissions:',
    SESSION: 'session:',
} as const;

