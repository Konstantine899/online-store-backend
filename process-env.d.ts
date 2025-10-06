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
            DIALECT?: string;
            MYSQL_HOST?: string;
            MYSQL_USER?: string;
            MYSQL_PASSWORD?: string;
            MYSQL_DATABASE?: string;
            MYSQL_PORT?: string;
        }
    }
}
