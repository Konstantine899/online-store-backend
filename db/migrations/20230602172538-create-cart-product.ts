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
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
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

        await queryInterface.addColumn('cart-product', 'cart_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'cart',
                key: 'id',
            },
            onUpdate: 'CASCADE', 
            onDelete: 'CASCADE', 
        });

        await queryInterface.addColumn('cart-product', 'product_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'product',
                key: 'id',
            },
            onUpdate: 'CASCADE', 
            onDelete: 'CASCADE', 
        });

        // Добавляем индексы для производительности

        await queryInterface.addIndex('cart-product', ['cart_id'], {
            name: 'idx_cart_product_cart_id',
        });

        await queryInterface.addIndex('cart-product', ['product_id'], {
            name: 'idx_cart_product_product_id',
        });

        await queryInterface.addIndex('cart-product', ['quantity'], {
            name: 'idx_cart_product_quantity',
        });

        await queryInterface.addIndex('cart-product', ['created_at'], {
            name: 'idx_cart_product_created_at',
        });

        // Составные индексы
        await queryInterface.addIndex('cart-product', ['cart_id', 'product_id'], {
            name: 'idx_cart_product_unique',
            unique: true,
        });

        await queryInterface.addIndex('cart-product', ['cart_id', 'quantity'], {
            name: 'idx_cart_product_cart_quantity',
        });

        await queryInterface.addIndex('cart-product', ['product_id', 'quantity'], {
            name: 'idx_cart_product_product_quantity',
        });
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаляем индексы
        await queryInterface.removeIndex('cart-product', 'idx_cart_product_cart_id');
        await queryInterface.removeIndex('cart-product', 'idx_cart_product_product_id');
        await queryInterface.removeIndex('cart-product', 'idx_cart_product_quantity');
        await queryInterface.removeIndex('cart-product', 'idx_cart_product_created_at');
        await queryInterface.removeIndex('cart-product', 'idx_cart_product_unique');
        await queryInterface.removeIndex('cart-product', 'idx_cart_product_cart_quantity');
        await queryInterface.removeIndex('cart-product', 'idx_cart_product_product_quantity');

        await queryInterface.removeColumn('cart-product', 'cart_id');
        await queryInterface.removeColumn('cart-product', 'product_id');
        await queryInterface.dropTable('cart-product');
    },
};

export default migration;
