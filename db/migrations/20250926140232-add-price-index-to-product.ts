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
        // Добавляем индекс по цене для оптимизации сортировки
        await queryInterface.addIndex('product', ['price'], {
            name: 'idx_product_price',
        });

        // Добавляем составной индекс для поиска по имени и сортировки по цене
        await queryInterface.addIndex('product', ['name', 'price'], {
            name: 'idx_product_name_price',
        });

        // Добавляем составной индекс для фильтрации по категории и сортировки по цене
        await queryInterface.addIndex('product', ['category_id', 'price'], {
            name: 'idx_product_category_price',
        });

        // Добавляем составной индекс для фильтрации по бренду и сортировки по цене
        await queryInterface.addIndex('product', ['brand_id', 'price'], {
            name: 'idx_product_brand_price',
        });

        // Добавляем составной индекс для фильтрации по категории, бренду и сортировки по цене
        await queryInterface.addIndex('product', ['category_id', 'brand_id', 'price'], {
            name: 'idx_product_category_brand_price',
        });
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаляем индексы в обратном порядке
        await queryInterface.removeIndex('product', 'idx_product_category_brand_price');
        await queryInterface.removeIndex('product', 'idx_product_brand_price');
        await queryInterface.removeIndex('product', 'idx_product_category_price');
        await queryInterface.removeIndex('product', 'idx_product_name_price');
        await queryInterface.removeIndex('product', 'idx_product_price');
    },
};

export default migration;
