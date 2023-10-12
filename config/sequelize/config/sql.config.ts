import { registerAs } from '@nestjs/config';
import { Dialect } from 'sequelize';

export const sqlConfig = registerAs('online-store', () => ({
    dialect: <Dialect>process.env.DIALECT || 'mysql',
    logging: process.env.SQL_LOGGING === 'true',
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    autoLoadModels: true,
    synchronize: true,
}));
