import { QueryInterface, DataTypes } from 'sequelize';

interface Migration {
    up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void>;
    down(queryInterface: QueryInterface): Promise<void>;
}

const migration: Migration = {
    async up(
        queryInterface: QueryInterface,
        Sequelize: typeof DataTypes,
    ): Promise<void> {
        await queryInterface.createTable('cart', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });
        await queryInterface.addIndex('cart', ['created_at'], {
            name: 'idx_cart_created_at',
        });

        await queryInterface.addIndex('cart', ['updated_at'], {
            name: 'idx_cart_updated_at',
        });

        // Составной индекс для аналитики
        await queryInterface.addIndex('cart', ['created_at', 'updated_at'], {
            name: 'idx_cart_created_updated',
        });
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.removeIndex('cart', 'idx_cart_created_at');
        await queryInterface.removeIndex('cart', 'idx_cart_updated_at');
        await queryInterface.removeIndex('cart', 'idx_cart_created_updated');
        await queryInterface.dropTable('cart');
    },
};

export default migration;
