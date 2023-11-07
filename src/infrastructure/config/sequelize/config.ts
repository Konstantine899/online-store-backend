import { registerAs } from '@nestjs/config';
import { sqlConfig } from './sql.config';
import { dbToken } from '@app/infrastructure/config/sequelize/db-token';

export const databaseConfig = registerAs(dbToken, () => ({
    sql: { ...sqlConfig() },
}));
