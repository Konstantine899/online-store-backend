import type { QueryInterface} from 'sequelize';
import { DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('user_address', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'user', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Название адреса (Дом, Работа и т.п.)',
        },
        street: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        house: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        apartment: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        postal_code: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        country: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: 'Россия',
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });

    await queryInterface.addIndex('user_address', ['user_id'], {
        name: 'idx_user_address_user_id',
    });
    await queryInterface.addIndex('user_address', ['user_id', 'is_default'], {
        name: 'idx_user_address_user_default',
    });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('user_address');
};
