import type { QueryInterface } from 'sequelize';

const TABLE_NAME = 'user_address';
const INDEX_NAME = 'idx_user_address_user_default_created_at';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
    // Композитный индекс под частый запрос списка адресов пользователя
    // с сортировкой по is_default DESC, created_at ASC
    await queryInterface.addIndex(
        TABLE_NAME,
        ['user_id', 'is_default', 'created_at'],
        {
            name: INDEX_NAME,
        },
    );
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex(TABLE_NAME, INDEX_NAME);
};
