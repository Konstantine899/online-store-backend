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
        await queryInterface.createTable('cart-product', {
            quantity: {
                type: Sequelize.INTEGER,
                defaultValue: 1,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });

        await queryInterface.addColumn('cart-product', 'cart_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'cart',
                key: 'id',
            },
        });

        await queryInterface.addColumn('cart-product', 'product_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'product',
                key: 'id',
            },
        });

        // Добавляем индексы для производительности
        await queryInterface.addIndex(
            'cart-product',
            ['cart_id', 'product_id'],
            {
                name: 'idx_cart_product_unique',
                unique: true,
            },
        );

        await queryInterface.addIndex('cart-product', ['cart_id'], {
            name: 'idx_cart_product_cart_id',
        });
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаляем индексы
        await queryInterface.removeIndex(
            'cart-product',
            'idx_cart_product_cart_id',
        );
        await queryInterface.removeIndex(
            'cart-product',
            'idx_cart_product_unique',
        );

        await queryInterface.removeColumn('cart-product', 'cart_id');
        await queryInterface.removeColumn('cart-product', 'product_id');
        await queryInterface.dropTable('cart-product');
    },
};

export default migration;
