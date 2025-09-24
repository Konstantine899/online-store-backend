"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: path.join(__dirname, '../../.migrate.env') });
const { DEV_MYSQL_USER, DEV_MYSQL_PASSWORD, DEV_MYSQL_DATABASE, DEV_MYSQL_HOST, DEV_MYSQL_PORT, DEV_DIALECT, TEST_MYSQL_HOST, TEST_MYSQL_PORT, TEST_MYSQL_USER, TEST_MYSQL_PASSWORD, TEST_MYSQL_DATABASE, TEST_DIALECT, PROD_MYSQL_HOST, PROD_MYSQL_PORT, PROD_MYSQL_USER, PROD_MYSQL_PASSWORD, PROD_MYSQL_DATABASE, PROD_DIALECT, } = process.env;
const config = {
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
exports.default = config;
module.exports = config;
