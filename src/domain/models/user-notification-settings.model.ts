import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { UserModel } from './user.model';

interface IUserNotificationSettingsModel {
    id: number;
    userId: number;
    emailEnabled: boolean;
    pushEnabled: boolean;
    orderUpdates: boolean;
    marketing: boolean;
    user: UserModel;
    createdAt: Date;
    updatedAt: Date;
}

interface IUserNotificationSettingsCreationAttributes {
    userId: number;
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    orderUpdates?: boolean;
    marketing?: boolean;
}

@Table({
    tableName: 'user_notification_settings',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['createdAt', 'updatedAt'] },
    },
    indexes: [
        {
            fields: ['user_id'],
            name: 'idx_user_notification_settings_user_id',
            unique: true,
        },
    ],
})
export class UserNotificationSettingsModel
    extends Model<
        UserNotificationSettingsModel,
        IUserNotificationSettingsCreationAttributes
    >
    implements IUserNotificationSettingsModel
{
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @ForeignKey(() => UserModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        unique: true,
        field: 'user_id',
    })
    declare userId: number;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'email_enabled',
    })
    declare emailEnabled: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'push_enabled',
    })
    declare pushEnabled: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'order_updates',
    })
    declare orderUpdates: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'marketing',
    })
    declare marketing: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: 'created_at',
    })
    declare createdAt: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: 'updated_at',
    })
    declare updatedAt: Date;

    @BelongsTo(() => UserModel)
    declare user: UserModel;
}
