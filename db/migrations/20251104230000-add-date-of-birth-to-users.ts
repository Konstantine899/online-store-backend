import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addColumn('user', 'date_of_birth', {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Дата рождения пользователя (только дата, без времени)',
    });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeColumn('user', 'date_of_birth');
}
