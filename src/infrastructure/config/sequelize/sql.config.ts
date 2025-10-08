import { registerAs } from '@nestjs/config';
import { Dialect } from 'sequelize';
import { dbToken } from '@app/infrastructure/config/sequelize/db-token';

export const sqlConfig = registerAs(dbToken, () => {
    // В тестах можно явно включить SQL логирование через DEBUG_SQL=true
    const isTestEnv = process.env.NODE_ENV === 'test';
    const debugSql = process.env.DEBUG_SQL === 'true';
    const sqlLogging = process.env.SQL_LOGGING === 'true';

    // В тестах: логируем только если DEBUG_SQL=true, иначе всегда false
    // В других окружениях: используем SQL_LOGGING
    const shouldLog = isTestEnv ? debugSql : sqlLogging;

    return {
        dialect: <Dialect>process.env.DIALECT || 'mysql',
        logging: shouldLog ? console.log : false,
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT),
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        autoLoadModels: true,
        synchronize: false, // отключаю автосинхронизацию
    };
});
