import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('user', 'phone', {
        type: DataTypes.STRING(20),
        allowNull: true,
    });

    await queryInterface.addIndex('user', ['phone'], {
        name: 'idx_user_phone',
    });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex('user', 'idx_user_phone');
    await queryInterface.removeColumn('user', 'phone');
};