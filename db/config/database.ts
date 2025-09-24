import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .migrate.env
dotenv.config({ path: path.join(__dirname, '../../.migrate.env') });

interface DatabaseConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  dialect: string;
}

interface Config {
  development: DatabaseConfig;
  test: DatabaseConfig;
  production: DatabaseConfig;
}

const {
  // Development
  DEV_MYSQL_USER,
  DEV_MYSQL_PASSWORD,
  DEV_MYSQL_DATABASE,
  DEV_MYSQL_HOST,
  DEV_MYSQL_PORT,
  DEV_DIALECT,
  // Test
  TEST_MYSQL_HOST,
  TEST_MYSQL_PORT,
  TEST_MYSQL_USER,
  TEST_MYSQL_PASSWORD,
  TEST_MYSQL_DATABASE,
  TEST_DIALECT,
  // Production
  PROD_MYSQL_HOST,
  PROD_MYSQL_PORT,
  PROD_MYSQL_USER,
  PROD_MYSQL_PASSWORD,
  PROD_MYSQL_DATABASE,
  PROD_DIALECT,
} = process.env;

const config: Config = {
  development: {
    username: DEV_MYSQL_USER || '',
    password: DEV_MYSQL_PASSWORD || '',
    database: DEV_MYSQL_DATABASE || '',
    host: DEV_MYSQL_HOST || 'localhost',
    port: parseInt(DEV_MYSQL_PORT || '3306', 10),
    dialect: DEV_DIALECT || 'mysql',
  },
  test: {
    username: TEST_MYSQL_USER || '',
    password: TEST_MYSQL_PASSWORD || '',
    database: TEST_MYSQL_DATABASE || '',
    host: TEST_MYSQL_HOST || 'localhost',
    port: parseInt(TEST_MYSQL_PORT || '3306', 10),
    dialect: TEST_DIALECT || 'mysql',
  },
  production: {
    username: PROD_MYSQL_USER || '',
    password: PROD_MYSQL_PASSWORD || '',
    database: PROD_MYSQL_DATABASE || '',
    host: PROD_MYSQL_HOST || 'localhost',
    port: parseInt(PROD_MYSQL_PORT || '3306', 10),
    dialect: PROD_DIALECT || 'mysql',
  },
};

export default config;

// CommonJS export for Sequelize CLI compatibility
module.exports = config;
