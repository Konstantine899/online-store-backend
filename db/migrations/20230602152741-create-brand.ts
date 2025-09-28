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
        await queryInterface.createTable('brand', {
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
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });

        await queryInterface.addColumn('brand', 'category_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'category',
                key: 'id',
            },
            allowNull: false,
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
        });
        await queryInterface.addColumn('brand', 'slug', {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true,
        });
        
        await queryInterface.addColumn('brand', 'description', {
            type: Sequelize.TEXT,
            allowNull: true,
        });
        
        await queryInterface.addColumn('brand', 'is_active', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        });
        
        await queryInterface.addColumn('brand', 'logo', {
            type: Sequelize.STRING(500),
            allowNull: true,
        });
        await Promise.all([
            queryInterface.addIndex('brand', ['slug'], {
                name: 'idx_brand_slug_unique',
                unique: true,
            }),
            queryInterface.addIndex('brand', ['is_active'], {
                name: 'idx_brand_is_active',
            }),
            queryInterface.addIndex('brand', ['is_active', 'category_id'], {
                name: 'idx_brand_active_category',
            }),
        ]);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        await Promise.all([
            queryInterface.removeIndex('brand', 'idx_brand_active_category'),
            queryInterface.removeIndex('brand', 'idx_brand_is_active'),
            queryInterface.removeIndex('brand', 'idx_brand_slug_unique'),
        ]);
        await queryInterface.removeColumn('brand', 'logo');
        await queryInterface.removeColumn('brand', 'is_active');
        await queryInterface.removeColumn('brand', 'description');
        await queryInterface.removeColumn('brand', 'slug');
        await queryInterface.removeColumn('brand', 'category_id');
        await queryInterface.dropTable('brand');
        await queryInterface.removeColumn('brand', 'category_id');
        await queryInterface.dropTable('brand');
    },
};

export default migration;
