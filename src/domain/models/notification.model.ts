import { Model, DataType, Column, Table, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { UserModel } from './user.model';

export enum NotificationType {
    EMAIL = 'email',
    PUSH = 'push'
}

export enum NotificationStatus {
    PENDING = 'pending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    FAILED = 'failed'
}

interface INotificationModel {
    id: number;
    userId: number;
    type: NotificationType;
    templateName: string;
    title: string;
    message: string;
    data?: any;
    status: NotificationStatus;
    sentAt?: Date;
    readAt?: Date;
    failedReason?: string;
    isRead: boolean;
    isArchived: boolean;
    user: UserModel;
    createdAt: Date;
}

interface INotificationCreationAttributes {
    userId: number;
    type: NotificationType;
    templateName: string;
    title: string;
    message: string;
    data?: any;
    status?: NotificationStatus;
    isRead?: boolean;
    isArchived?: boolean;
}

@Table({
    tableName: 'notifications',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    defaultScope: {
        attributes: { exclude: ['updatedAt'] },
    },
    scopes: {
        // Scope для поиска по пользователю
        byUser: (userId: number) => ({
            where: { userId },
        }),
        // Scope для поиска по типу
        byType: (type: NotificationType) => ({
            where: { type },
        }),
        // Scope для поиска по статусу
        byStatus: (status: NotificationStatus) => ({
            where: { status },
        }),
        // Scope для непрочитанных уведомлений
        unread: {
            where: { isRead: false },
        },
        // Scope для прочитанных уведомлений
        read: {
            where: { isRead: true },
        },
        // Scope для архивированных уведомлений
        archived: {
            where: { isArchived: true },
        },
        // Scope для неархивированных уведомлений
        notArchived: {
            where: { isArchived: false },
        },
        // Scope для недавних уведомлений
        recent: (days: number = 30) => ({
            where: {
                createdAt: {
                    [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                },
            },
        }),
        // Scope для загрузки с пользователем
        withUser: {
            include: [{
                model: UserModel,
                attributes: ['id', 'email', 'firstName', 'lastName'],
            }],
        },
    },
    indexes: [
        { fields: ['user_id'], name: 'idx_notifications_user_id' },
        { fields: ['type'], name: 'idx_notifications_type' },
        { fields: ['status'], name: 'idx_notifications_status' },
        { fields: ['template_name'], name: 'idx_notifications_template_name' },
        { fields: ['is_read'], name: 'idx_notifications_is_read' },
        { fields: ['is_archived'], name: 'idx_notifications_is_archived' },
        { fields: ['created_at'], name: 'idx_notifications_created_at' },
        { fields: ['user_id', 'status'], name: 'idx_notifications_user_status' },
    ],
})
export class NotificationModel
    extends Model<NotificationModel, INotificationCreationAttributes>
    implements INotificationModel
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
        field: 'user_id',
    })
    declare userId: number;

    @Column({
        type: DataType.ENUM(...Object.values(NotificationType)),
        allowNull: false,
    })
    declare type: NotificationType;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        field: 'template_name',
    })
    declare templateName: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    declare title: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    declare message: string;

    @Column({
        type: DataType.JSON,
        allowNull: true,
    })
    declare data: any;

    @Column({
        type: DataType.ENUM(...Object.values(NotificationStatus)),
        allowNull: false,
        defaultValue: NotificationStatus.PENDING,
    })
    declare status: NotificationStatus;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'sent_at',
    })
    declare sentAt: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        field: 'read_at',
    })
    declare readAt: Date;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        field: 'failed_reason',
    })
    declare failedReason: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_read',
    })
    declare isRead: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_archived',
    })
    declare isArchived: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: 'created_at',
    })
    declare createdAt: Date;

    @BelongsTo(() => UserModel)
    declare user: UserModel;

    // Getters для флагов
    get isReadNotification(): boolean {
        return this.isRead;
    }

    get isArchivedNotification(): boolean {
        return this.isArchived;
    }

    get notificationStatus(): string {
        if (this.isArchived) return 'archived';
        if (this.isRead) return 'read';
        return this.status;
    }

    // Методы для управления флагами
    async markAsRead(): Promise<void> {
        await this.update({ 
            isRead: true, 
            readAt: new Date(),
            status: NotificationStatus.READ 
        });
    }

    async markAsUnread(): Promise<void> {
        await this.update({ 
            isRead: false, 
            readAt: null 
        });
    }

    async archiveNotification(): Promise<void> {
        await this.update({ isArchived: true });
    }

    async unarchiveNotification(): Promise<void> {
        await this.update({ isArchived: false });
    }

    // Статические методы для работы с флагами
    static async getReadNotifications(): Promise<NotificationModel[]> {
        return this.findAll({
            where: { isRead: true },
            order: [['createdAt', 'DESC']],
        });
    }

    static async getUnreadNotifications(): Promise<NotificationModel[]> {
        return this.findAll({
            where: { isRead: false },
            order: [['createdAt', 'DESC']],
        });
    }

    static async getArchivedNotifications(): Promise<NotificationModel[]> {
        return this.findAll({
            where: { isArchived: true },
            order: [['createdAt', 'DESC']],
        });
    }

    static async getNonArchivedNotifications(): Promise<NotificationModel[]> {
        return this.findAll({
            where: { isArchived: false },
            order: [['createdAt', 'DESC']],
        });
    }
}
