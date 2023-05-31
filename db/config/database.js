const path = require('path');
require('dotenv').config({ path: path.join('.migrate.env') });
const {
  DEV_MYSQL_USER,
  DEV_MYSQL_PASSWORD,
  DEV_MYSQL_DATABASE,
  DEV_MYSQL_HOST,
  DEV_DIALECT,
  TEST_DIALECT,
  TEST_MYSQL_HOST,
  TEST_MYSQL_USER,
  TEST_MYSQL_PASSWORD,
  TEST_MYSQL_DATABASE,
  PROD_DIALECT,
  PROD_MYSQL_HOST,
  PROD_MYSQL_USER,
  PROD_MYSQL_PASSWORD,
  PROD_MYSQL_DATABASE,
} = process.env;
module.exports = {
  development: {
    username: DEV_MYSQL_USER,
    password: DEV_MYSQL_PASSWORD,
    database: DEV_MYSQL_DATABASE,
    host: DEV_MYSQL_HOST,
    dialect: DEV_DIALECT,
  },
  test: {
    username: TEST_MYSQL_USER,
    password: TEST_MYSQL_PASSWORD,
    database: TEST_MYSQL_DATABASE,
    host: TEST_MYSQL_HOST,
    dialect: TEST_DIALECT,
  },
  production: {
    username: PROD_MYSQL_USER,
    password: PROD_MYSQL_PASSWORD,
    database: PROD_MYSQL_DATABASE,
    host: PROD_MYSQL_HOST,
    dialect: PROD_DIALECT,
  },
};
