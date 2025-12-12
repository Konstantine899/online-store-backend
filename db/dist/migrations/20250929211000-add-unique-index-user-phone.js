"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const TABLE_NAME = 'user';
const INDEX_NAME = 'user_phone_unique';
async function up(queryInterface) {
    await queryInterface.addIndex(TABLE_NAME, ['phone'], {
        name: INDEX_NAME,
        unique: true,
    });
}
async function down(queryInterface) {
    await queryInterface.removeIndex(TABLE_NAME, INDEX_NAME);
}
