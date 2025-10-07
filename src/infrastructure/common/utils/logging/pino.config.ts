import { LoggerOptions } from 'pino';
import { getConfig } from '@app/infrastructure/config';

/**
 * Конфигурация Pino логгера для структурированного безопасного логирования.
 * 
 * Оптимизировано для производительности:
 * - Minimal serialization overhead
 * - Conditional pretty printing только в dev
 * - Автоматическое маскирование PII
 * - Константы вместо литералов (создаются один раз)
 */

/**
 * Константы для маскирования PII (создаются один раз при загрузке модуля)
 */
const PII_REDACT_PATHS = [
    // Токены и авторизация
    'authorization',
    'token',
    'accessToken',
    'refreshToken',
    'cookie',
    'password',
    'secret',
    'apiKey',
    // PII данные
    'email',
    'phone',
    'firstName',
    'lastName',
    'name',
    'address',
    'ip', // IP адреса маскируем для GDPR
    // Вложенные объекты
    '*.password',
    '*.token',
    '*.email',
    '*.phone',
    'user.email',
    'user.phone',
    'req.body.password',
    'req.body.email',
    'req.body.phone',
] as const;

/**
 * Оптимизированные сериализаторы (функции создаются один раз)
 */
const reqSerializer = (req: unknown) => {
    const r = req as {
        method?: string;
        url?: string;
        headers?: Record<string, unknown>;
    };
    return {
        method: r.method,
        url: r.url,
        // Не логируем полные заголовки, только безопасные
        userAgent: r.headers?.['user-agent'],
    };
};

const resSerializer = (res: unknown) => {
    const r = res as { statusCode?: number };
    return {
        statusCode: r.statusCode,
    };
};

/**
 * Базовая конфигурация Pino логгера
 * Вызывается один раз при создании base logger (singleton pattern)
 */
export function createPinoConfig(): LoggerOptions {
    const cfg = getConfig();
    const isProduction = cfg.NODE_ENV === 'production';
    const isDevelopment = cfg.NODE_ENV === 'development';

    // Сериализатор ошибок с условным stack (зависит от окружения)
    const errSerializer = (err: unknown) => {
        const e = err as Error & { stack?: string };
        return {
            type: e.constructor?.name,
            message: e.message,
            stack: isProduction ? undefined : e.stack,
        };
    };

    return {
        level: isProduction ? 'info' : 'debug',
        
        // Формат: структурированный JSON в production, pretty в development
        transport: isDevelopment
            ? {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'HH:MM:ss Z',
                      ignore: 'pid,hostname',
                  },
              }
            : undefined,

        // Базовые поля для каждого лога
        base: {
            env: cfg.NODE_ENV,
            pid: process.pid,
        },

        // Форматирование timestamp (оптимизировано)
        timestamp: () => `,"time":"${new Date().toISOString()}"`,

        // Автоматическое маскирование PII и секретов
        redact: {
            paths: PII_REDACT_PATHS as unknown as string[],
            censor: '[REDACTED]',
            remove: false, // Оставляем ключи, только маскируем значения
        },

        // Сериализаторы для оптимизации и безопасности
        serializers: {
            req: reqSerializer,
            res: resSerializer,
            err: errSerializer,
        },
    };
}

/**
 * Уровни логирования согласно правилам проекта:
 * - info: бизнес-события (регистрация, логин, создание сущностей)
 * - warn: ретраи, деградации, rate limiting
 * - error: падения, необработанные исключения, критичные ошибки
 */
export const LOG_LEVELS = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    DEBUG: 'debug',
} as const;
