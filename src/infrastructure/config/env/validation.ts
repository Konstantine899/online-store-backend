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
    };
}


