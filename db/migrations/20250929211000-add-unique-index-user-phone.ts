import { QueryInterface } from 'sequelize';

const TABLE_NAME = 'user';
const INDEX_NAME = 'user_phone_unique';

export async function up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addIndex(TABLE_NAME, ['phone'], {
        name: INDEX_NAME,
        unique: true,
    });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeIndex(TABLE_NAME, INDEX_NAME);
}


