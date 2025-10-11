"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const TABLE_NAME = 'user_address';
const INDEX_NAME = 'idx_user_address_user_default_created_at';
const up = async (queryInterface) => {
    await queryInterface.addIndex(TABLE_NAME, ['user_id', 'is_default', 'created_at'], {
        name: INDEX_NAME,
    });
};
exports.up = up;
const down = async (queryInterface) => {
    await queryInterface.removeIndex(TABLE_NAME, INDEX_NAME);
};
exports.down = down;
