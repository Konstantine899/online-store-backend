import type { QueryInterface, DataTypes } from 'sequelize';

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
        await queryInterface.createTable('user_role', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            role_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'role',
                    key: 'id',
                },
                allowNull: false,
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            user_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'user',
                    key: 'id',
                },
                allowNull: false,
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });
        await queryInterface.addIndex('user_role', ['user_id'], {
            name: 'idx_user_role_user_id',
        });

        await queryInterface.addIndex('user_role', ['role_id'], {
            name: 'idx_user_role_role_id',
        });

        await queryInterface.addIndex('user_role', ['user_id', 'role_id'], {
            name: 'idx_user_role_unique',
            unique: true,
        });
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        await queryInterface.removeIndex('user_role', 'idx_user_role_user_id');
        await queryInterface.removeIndex('user_role', 'idx_user_role_role_id');
        await queryInterface.removeIndex('user_role', 'idx_user_role_unique');
        await queryInterface.dropTable('user_role');
    },
};

export default migration;
