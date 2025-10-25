import type { QueryInterface} from 'sequelize';
import { DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('user_verification_code', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'user', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        channel: {
            type: DataTypes.STRING(16), // 'email' | 'phone'
            allowNull: false,
        },
        code_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        attempts: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });

    await queryInterface.addIndex(
        'user_verification_code',
        ['user_id', 'channel'],
        {
            name: 'idx_uvc_user_channel',
            unique: false,
        },
    );
    await queryInterface.addIndex('user_verification_code', ['expires_at'], {
        name: 'idx_uvc_expires_at',
        unique: false,
    });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    try {
        await queryInterface.removeIndex(
            'user_verification_code',
            'idx_uvc_user_channel',
        );
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(
                '[migrate] skip removeIndex idx_uvc_user_channel:',
                (e as Error).message,
            );
        }
    }
    try {
        await queryInterface.removeIndex(
            'user_verification_code',
            'idx_uvc_expires_at',
        );
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(
                '[migrate] skip removeIndex idx_uvc_expires_at:',
                (e as Error).message,
            );
        }
    }
    await queryInterface.dropTable('user_verification_code');
}
