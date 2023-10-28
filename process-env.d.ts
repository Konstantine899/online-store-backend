declare global {
    namespace NodeJS {
        interface ProcessEnv {
            [key: string]: string | undefined;

            PORT: string;
            DIALECT: string;
            MYSQL_HOST: string;
            MYSQL_USER: string;
            MYSQL_PASSWORD: string;
            MYSQL_DATABASE: string;
            MYSQL_PORT: number;
            SQL_LOGGING: string;
            JWT_PRIVATE_KEY: string;
            COOKIE_PARSER_SECRET_KEY: string;
        }
    }
}
