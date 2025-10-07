declare global {
    namespace NodeJS {
        interface ProcessEnv {
            [key: string]: string | undefined;

            NODE_ENV: 'development' | 'test' | 'staging' | 'production';
            PORT: string;
            ALLOWED_ORIGINS: string;
            COOKIE_PARSER_SECRET_KEY: string;
            JWT_ACCESS_SECRET: string;
            JWT_REFRESH_SECRET: string;
            JWT_ACCESS_TTL: string;
            JWT_REFRESH_TTL: string;
            SQL_LOGGING: string;
            SECURITY_HELMET_ENABLED?: string;
            SECURITY_CORS_ENABLED?: string;
            SECURITY_CSP_ENABLED?: string;
            RATE_LIMIT_ENABLED?: string;
            RATE_LIMIT_GLOBAL_RPS?: string;
            RATE_LIMIT_GLOBAL_RPM?: string;
            RATE_LIMIT_LOGIN_ATTEMPTS?: string;
            RATE_LIMIT_LOGIN_WINDOW?: string;
            RATE_LIMIT_REFRESH_ATTEMPTS?: string;
            RATE_LIMIT_REFRESH_WINDOW?: string;
            RATE_LIMIT_REG_ATTEMPTS?: string;
            RATE_LIMIT_REG_WINDOW?: string;
            JWT_SECRET_ROTATION_DATE?: string;
            JWT_SECRET_VERSION?: string;
            DIALECT?: string;
            MYSQL_HOST?: string;
            MYSQL_USER?: string;
            MYSQL_PASSWORD?: string;
            MYSQL_DATABASE?: string;
            MYSQL_PORT?: string;
        }
    }
}
