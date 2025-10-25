import type { QueryInterface} from 'sequelize';
import { DataTypes } from 'sequelize';

const TABLE = 'user';

export async function up(queryInterface: QueryInterface): Promise<void> {
    // MySQL JSON columns cannot have non-NULL default in strict modes.
    await queryInterface.changeColumn(TABLE, 'notification_preferences', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
    });

    await queryInterface.changeColumn(TABLE, 'translations', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
    });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    // Revert to previous definition (may not be supported on all MySQL versions)
    await queryInterface.changeColumn(TABLE, 'notification_preferences', {
        type: DataTypes.JSON,
        allowNull: false,
        // defaultValue: {} // avoid reintroducing unsupported default
    });

    await queryInterface.changeColumn(TABLE, 'translations', {
        type: DataTypes.JSON,
        allowNull: true,
        // defaultValue: {} // avoid reintroducing unsupported default
    });
}
