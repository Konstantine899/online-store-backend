import type { QueryInterface} from 'sequelize';
import { DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
    // Проверяем, существует ли поле phone в таблице user
    const tableDescription = await queryInterface.describeTable('user');

    if (!tableDescription.phone) {
        // Добавляем поле phone если его нет
        await queryInterface.addColumn('user', 'phone', {
            type: DataTypes.STRING(20),
            allowNull: true,
        });
    }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
    // Удаляем поле phone
    await queryInterface.removeColumn('user', 'phone');
};
