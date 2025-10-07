import pino from 'pino';
import { createPinoConfig } from './pino.config';

/**
 * Фабрика для создания структурированных логгеров с автоматическим correlation ID.
 * 
 * Использование:
 * ```typescript
 * class MyService {
 *     private readonly logger = createLogger('MyService');
 *     
 *     someMethod() {
 *         this.logger.info({ userId: 123 }, 'User created');
 *     }
 * }
 * ```
 * 
 * Оптимизировано:
 * - Singleton base logger для переиспользования конфигурации
 * - Child loggers создаются быстро (минимальные аллокации)
 * - Автоматическое маскирование PII из конфигурации
 */

// Singleton base logger (создаётся один раз)
let baseLogger: pino.Logger | null = null;

/**
 * Константа для PII полей (создаётся один раз при загрузке модуля)
 * Используется в sanitizeForLogging для O(1) проверки
 */
const PII_FIELDS = new Set([
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'email',
    'phone',
    'firstName',
    'lastName',
    'address',
    'secret',
    'apiKey',
]);

/**
 * Получить базовый логгер (singleton)
 * Переиспользуется для всех child логгеров
 */
function getBaseLogger(): pino.Logger {
    if (!baseLogger) {
        baseLogger = pino(createPinoConfig());
    }
    return baseLogger;
}

/**
 * Создать child logger для конкретного контекста
 * 
 * @param context - имя сервиса/контроллера/модуля
 * @param correlationId - опциональный correlation ID для трассировки
 * @returns Настроенный child logger с контекстом
 */
export function createLogger(
    context: string,
    correlationId?: string,
): pino.Logger {
    const base = getBaseLogger();

    const bindings: Record<string, unknown> = { context };
    if (correlationId) {
        bindings.correlationId = correlationId;
    }

    return base.child(bindings);
}

/**
 * Создать logger с correlation ID из request
 * Используется в контроллерах для трассировки запросов
 * 
 * @param context - имя контекста
 * @param req - Express request объект с correlationId
 * @returns Logger с correlation ID
 */
export function createLoggerWithCorrelation(
    context: string,
    req?: { correlationId?: string },
): pino.Logger {
    return createLogger(context, req?.correlationId);
}

/**
 * Маска для PII данных в логах
 * Используется для явного маскирования данных перед логированием
 * 
 * @param data - данные для маскирования
 * @returns Замаскированная строка
 */
export function maskPII(data: string | undefined | null): string {
    if (!data) return '[EMPTY]';
    if (data.length <= 4) return '[REDACTED]';
    
    // Для email показываем только первую букву и домен
    if (data.includes('@')) {
        const [local, domain] = data.split('@');
        return `${local[0]}***@${domain}`;
    }
    
    // Для других данных показываем первые 2 и последние 2 символа
    return `${data.substring(0, 2)}***${data.substring(data.length - 2)}`;
}

/**
 * Безопасное логирование объекта с автоматическим удалением PII полей
 * 
 * Оптимизировано: PII_FIELDS Set создаётся один раз на уровне модуля
 * 
 * @param obj - объект для логирования
 * @returns Объект без PII полей
 */
export function sanitizeForLogging<T extends Record<string, unknown>>(
    obj: T,
): Partial<T> {
    const sanitized: Partial<T> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (PII_FIELDS.has(key)) {
            sanitized[key as keyof T] = '[REDACTED]' as T[keyof T];
        } else if (Array.isArray(value)) {
            // Обработка массивов: сохраняем структуру, рекурсивно санитизируем элементы
            sanitized[key as keyof T] = value.map((item) =>
                typeof item === 'object' && item !== null
                    ? sanitizeForLogging(item as Record<string, unknown>)
                    : item,
            ) as T[keyof T];
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key as keyof T] = sanitizeForLogging(
                value as Record<string, unknown>,
            ) as T[keyof T];
        } else {
            sanitized[key as keyof T] = value as T[keyof T];
        }
    }

    return sanitized;
}
