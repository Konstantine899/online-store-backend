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

        // Добавляем внешние ключи с ограничениями
        await queryInterface.addColumn('product', 'category_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'category',
                key: 'id',
            },
            allowNull: false,
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
        });

        await queryInterface.addColumn('product', 'brand_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'brand',
                key: 'id',
            },
            allowNull: false,
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
        });

        await queryInterface.addColumn('product', 'slug', {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true,
        });

        await queryInterface.addColumn('product', 'description', {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        await queryInterface.addColumn('product', 'is_active', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        });

        await queryInterface.addColumn('product', 'stock', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });

        // Создаем индексы для оптимизации запросов
        await Promise.all([
            queryInterface.addIndex('product', ['category_id'], {
                name: 'idx_product_category_id',
            }),
            queryInterface.addIndex('product', ['brand_id'], {
                name: 'idx_product_brand_id',
            }),
            queryInterface.addIndex('product', ['category_id', 'brand_id'], {
                name: 'idx_product_category_brand',
            }),
            // ДОБАВИТЬ НОВЫЕ ИНДЕКСЫ:
            queryInterface.addIndex('product', ['slug'], {
                name: 'idx_product_slug_unique',
                unique: true,
            }),
            queryInterface.addIndex('product', ['is_active'], {
                name: 'idx_product_is_active',
            }),
            queryInterface.addIndex('product', ['stock'], {
                name: 'idx_product_stock',
            }),
            queryInterface.addIndex('product', ['price'], {
                name: 'idx_product_price',
            }),
            queryInterface.addIndex('product', ['rating'], {
                name: 'idx_product_rating',
            }),
            queryInterface.addIndex('product', ['is_active', 'category_id'], {
                name: 'idx_product_active_category',
            }),
            queryInterface.addIndex('product', ['is_active', 'brand_id'], {
                name: 'idx_product_active_brand',
            }),
            queryInterface.addIndex('product', ['price', 'rating'], {
                name: 'idx_product_price_rating',
            }),
        ]);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаляем индексы параллельно
        await Promise.all([
            queryInterface.removeIndex('product', 'idx_product_category_brand'),
            queryInterface.removeIndex('product', 'idx_product_brand_id'),
            queryInterface.removeIndex('product', 'idx_product_category_id'),
            queryInterface.removeIndex('product', 'idx_product_slug_unique'),
            queryInterface.removeIndex('product', 'idx_product_is_active'),
            queryInterface.removeIndex('product', 'idx_product_stock'),
            queryInterface.removeIndex('product', 'idx_product_price'),
            queryInterface.removeIndex('product', 'idx_product_rating'),
            queryInterface.removeIndex(
                'product',
                'idx_product_active_category',
            ),
            queryInterface.removeIndex('product', 'idx_product_active_brand'),
            queryInterface.removeIndex('product', 'idx_product_price_rating'),
        ]);

        // Удаляем колонки и таблицу
        await queryInterface.removeColumn('product', 'brand_id');
        await queryInterface.removeColumn('product', 'category_id');
        await queryInterface.removeColumn('product', 'slug');
        await queryInterface.removeColumn('product', 'description');
        await queryInterface.removeColumn('product', 'is_active');
        await queryInterface.removeColumn('product', 'stock');
        await queryInterface.dropTable('product');
    },
};

export default migration;
