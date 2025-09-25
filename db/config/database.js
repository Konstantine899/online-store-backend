const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.migrate.env') });

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

module.exports = {
    development: {
        username: DEV_MYSQL_USER,
        password: DEV_MYSQL_PASSWORD,
        database: DEV_MYSQL_DATABASE,
        host: DEV_MYSQL_HOST,
        port: DEV_MYSQL_PORT,
        dialect: DEV_DIALECT,
    },
    test: {
        username: TEST_MYSQL_USER,
        password: TEST_MYSQL_PASSWORD,
        database: TEST_MYSQL_DATABASE,
        host: TEST_MYSQL_HOST,
        port: TEST_MYSQL_PORT,
        dialect: TEST_DIALECT,
    },
    production: {
        username: PROD_MYSQL_USER,
        password: PROD_MYSQL_PASSWORD,
        database: PROD_MYSQL_DATABASE,
        host: PROD_MYSQL_HOST,
        port: PROD_MYSQL_PORT,
        dialect: PROD_DIALECT,
    },
};
