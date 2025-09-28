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
        await queryInterface.createTable('order', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            phone: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            address: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            comment: {
                type: Sequelize.STRING(2200),
                allowNull: true,
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

        await queryInterface.addColumn('order', 'user_id', {
            type: Sequelize.INTEGER,
            references: {
                model: 'user',
                key: 'id',
            },
            allowNull: false,
            onUpdate: 'CASCADE', 
        onDelete: 'CASCADE', 
        });
        // Добавляем индексы для производительности
        await queryInterface.addIndex('order', ['user_id'], {
            name: 'idx_order_user_id',
        });

        await queryInterface.addIndex('order', ['status'], {
            name: 'idx_order_status',
        });
        await queryInterface.addIndex('order', ['created_at'], {
            name: 'idx_order_created_at',
        });
    
        await queryInterface.addIndex('order', ['amount'], {
            name: 'idx_order_amount',
        });
    
        // СОСТАВНЫЕ ИНДЕКСЫ для частых запросов
        await queryInterface.addIndex('order', ['user_id', 'status'], {
            name: 'idx_order_user_status',
        });
    
        await queryInterface.addIndex('order', ['status', 'created_at'], {
            name: 'idx_order_status_created',
        });
    
        await queryInterface.addIndex('order', ['user_id', 'created_at'], {
            name: 'idx_order_user_created',
        });
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Удаляем все индексы
        await queryInterface.removeIndex('order', 'idx_order_user_id');
        await queryInterface.removeIndex('order', 'idx_order_status');
        await queryInterface.removeIndex('order', 'idx_order_created_at');
        await queryInterface.removeIndex('order', 'idx_order_amount');
        await queryInterface.removeIndex('order', 'idx_order_user_status');
        await queryInterface.removeIndex('order', 'idx_order_status_created');
        await queryInterface.removeIndex('order', 'idx_order_user_created');

        await queryInterface.removeColumn('order', 'user_id');
        await queryInterface.dropTable('order');
    },
};

export default migration;
