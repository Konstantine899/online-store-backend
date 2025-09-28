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
        await queryInterface.createTable('category', {
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
            image: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            slug: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
        await Promise.all([
            queryInterface.addIndex('category', ['slug'], {
                name: 'idx_category_slug_unique',
                unique: true,
            }),
            queryInterface.addIndex('category', ['is_active'], {
                name: 'idx_category_is_active',
            }),
            queryInterface.addIndex('category', ['image'], {
                name: 'idx_category_image',
            }),
            queryInterface.addIndex('category', ['is_active', 'name'], {
                name: 'idx_category_active_name',
            }),
        ]);
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.dropTable('category');
    },
};

export default migration;
