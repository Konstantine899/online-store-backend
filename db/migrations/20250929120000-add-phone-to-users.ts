import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn(
            'user',
            'phone',
            {
                type: DataTypes.STRING(20),
                allowNull: true,
                comment: 'E.164 phone',
            },
            { transaction },
        );

        await queryInterface.addIndex('user', ['phone'], {
            name: 'user_phone_unique',
            unique: true,
            using: 'BTREE',
            transaction,
        });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
        await queryInterface.removeIndex('user', 'user_phone_unique', {
            transaction,
        });
        await queryInterface.removeColumn('user', 'phone', { transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};
