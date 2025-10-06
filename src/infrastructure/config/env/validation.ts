/*
 * Простая валидация переменных окружения без сторонних зависимостей.
 * Бросает Error с понятным русским сообщением при некорректной конфигурации.
 */

export type ValidatedEnv = {
    NODE_ENV: 'development' | 'test' | 'staging' | 'production';
    PORT: number;
    ALLOWED_ORIGINS: string[];
    COOKIE_PARSER_SECRET_KEY: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_TTL: string; // e.g. "900s"
    JWT_REFRESH_TTL: string; // e.g. "30d"
    SQL_LOGGING: boolean;
    SECURITY_HELMET_ENABLED: boolean;
    SECURITY_CORS_ENABLED: boolean;
    SECURITY_CSP_ENABLED: boolean;
    RATE_LIMIT_ENABLED: boolean;
    RATE_LIMIT_GLOBAL_RPS: number;
    RATE_LIMIT_GLOBAL_RPM: number;
    RATE_LIMIT_LOGIN_ATTEMPTS: number;
    RATE_LIMIT_LOGIN_WINDOW: string; // e.g. "15m"
    RATE_LIMIT_REFRESH_ATTEMPTS: number;
    RATE_LIMIT_REFRESH_WINDOW: string; // e.g. "5m"
    RATE_LIMIT_REG_ATTEMPTS: number;
    RATE_LIMIT_REG_WINDOW: string; // e.g. "1m"
};

function asNumber(value: string | undefined, name: string, opts?: { min?: number; max?: number }): number {
    if (!value) throw new Error(`Отсутствует обязательная переменная окружения: ${name}`);
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error(`Переменная ${name} должна быть числом`);
    if (opts?.min !== undefined && n < opts.min) throw new Error(`Переменная ${name} должна быть >= ${opts.min}`);
    if (opts?.max !== undefined && n > opts.max) throw new Error(`Переменная ${name} должна быть <= ${opts.max}`);
    return n;
}

function asBoolean(value: string | undefined, defaultValue = 'false'): boolean {
    const v = (value ?? defaultValue).toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
}

function requiredString(value: string | undefined, name: string): string {
    if (!value || value.trim().length === 0) {
        throw new Error(`Переменная ${name} обязательна и не может быть пустой`);
    }
    return value;
}

export function validateEnv(raw: NodeJS.ProcessEnv): ValidatedEnv {
    const NODE_ENV_RAW = requiredString(raw.NODE_ENV || 'development', 'NODE_ENV').toLowerCase();
    if (!['development', 'test', 'staging', 'production'].includes(NODE_ENV_RAW)) {
        throw new Error('NODE_ENV должен быть одним из: development, test, staging, production');
    }

    const PORT = asNumber(raw.PORT || '5000', 'PORT', { min: 1, max: 65535 });

    const ALLOWED_ORIGINS = (raw.ALLOWED_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const COOKIE_PARSER_SECRET_KEY = requiredString(raw.COOKIE_PARSER_SECRET_KEY, 'COOKIE_PARSER_SECRET_KEY');
    const JWT_ACCESS_SECRET = requiredString(raw.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET');
    const JWT_REFRESH_SECRET = requiredString(raw.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');

    const JWT_ACCESS_TTL = requiredString(raw.JWT_ACCESS_TTL || '900s', 'JWT_ACCESS_TTL');
    const JWT_REFRESH_TTL = requiredString(raw.JWT_REFRESH_TTL || '30d', 'JWT_REFRESH_TTL');

    const SQL_LOGGING = asBoolean(raw.SQL_LOGGING, 'false');
    const SECURITY_HELMET_ENABLED = asBoolean(raw.SECURITY_HELMET_ENABLED, 'true');
    const SECURITY_CORS_ENABLED = asBoolean(raw.SECURITY_CORS_ENABLED, 'true');
    const SECURITY_CSP_ENABLED = asBoolean(raw.SECURITY_CSP_ENABLED, 'true');

    // Rate limiting
    const RATE_LIMIT_ENABLED = asBoolean(raw.RATE_LIMIT_ENABLED, 'true');
    const RATE_LIMIT_GLOBAL_RPS = asNumber(
        raw.RATE_LIMIT_GLOBAL_RPS || '3',
        'RATE_LIMIT_GLOBAL_RPS',
        { min: 1 },
    );
    const RATE_LIMIT_GLOBAL_RPM = asNumber(
        raw.RATE_LIMIT_GLOBAL_RPM || '100',
        'RATE_LIMIT_GLOBAL_RPM',
        { min: 1 },
    );
    const RATE_LIMIT_LOGIN_ATTEMPTS = asNumber(
        raw.RATE_LIMIT_LOGIN_ATTEMPTS || '5',
        'RATE_LIMIT_LOGIN_ATTEMPTS',
        { min: 1 },
    );
    const RATE_LIMIT_LOGIN_WINDOW = requiredString(
        raw.RATE_LIMIT_LOGIN_WINDOW || '15m',
        'RATE_LIMIT_LOGIN_WINDOW',
    );
    const RATE_LIMIT_REFRESH_ATTEMPTS = asNumber(
        raw.RATE_LIMIT_REFRESH_ATTEMPTS || '10',
        'RATE_LIMIT_REFRESH_ATTEMPTS',
        { min: 1 },
    );
    const RATE_LIMIT_REFRESH_WINDOW = requiredString(
        raw.RATE_LIMIT_REFRESH_WINDOW || '5m',
        'RATE_LIMIT_REFRESH_WINDOW',
    );
    const RATE_LIMIT_REG_ATTEMPTS = asNumber(
        raw.RATE_LIMIT_REG_ATTEMPTS || '3',
        'RATE_LIMIT_REG_ATTEMPTS',
        { min: 1 },
    );
    const RATE_LIMIT_REG_WINDOW = requiredString(
        raw.RATE_LIMIT_REG_WINDOW || '1m',
        'RATE_LIMIT_REG_WINDOW',
    );

    return {
        NODE_ENV: NODE_ENV_RAW as ValidatedEnv['NODE_ENV'],
        PORT,
        ALLOWED_ORIGINS,
        COOKIE_PARSER_SECRET_KEY,
        JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET,
        JWT_ACCESS_TTL,
        JWT_REFRESH_TTL,
        SQL_LOGGING,
        SECURITY_HELMET_ENABLED,
        SECURITY_CORS_ENABLED,
        SECURITY_CSP_ENABLED,
        RATE_LIMIT_ENABLED,
        RATE_LIMIT_GLOBAL_RPS,
        RATE_LIMIT_GLOBAL_RPM,
        RATE_LIMIT_LOGIN_ATTEMPTS,
        RATE_LIMIT_LOGIN_WINDOW,
        RATE_LIMIT_REFRESH_ATTEMPTS,
        RATE_LIMIT_REFRESH_WINDOW,
        RATE_LIMIT_REG_ATTEMPTS,
        RATE_LIMIT_REG_WINDOW,
    };
}


