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
        await queryInterface.createTable('product', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            name: {
                type: Sequelize.STRING,
                unique: true,
                allowNull: false,
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            rating: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
            },
            image: {
                type: Sequelize.STRING,
                allowNull: false,
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

        await queryInterface.addColumn('product', 'category_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'category',
                key: 'id',
            },
            allowNull: false,
        });

        await queryInterface.addColumn('product', 'brand_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'brand',
                key: 'id',
            },
            allowNull: false,
        });
        await queryInterface.addIndex('product', ['category_id'], {
            name: 'idx_product_category_id',
        });

        await queryInterface.addIndex('product', ['brand_id'], {
            name: 'idx_product_brand_id',
        });

        // Составной индекс для частых запросов по категории и бренду
        await queryInterface.addIndex('product', ['category_id', 'brand_id'], {
            name: 'idx_product_category_brand',
        });
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаляем индексы
        await queryInterface.removeIndex(
            'product',
            'idx_product_category_brand',
        );
        await queryInterface.removeIndex('product', 'idx_product_brand_id');
        await queryInterface.removeIndex('product', 'idx_product_category_id');

        await queryInterface.removeColumn('product', 'brand_id');
        await queryInterface.removeColumn('product', 'category_id');
        await queryInterface.dropTable('product');
    },
};

export default migration;
