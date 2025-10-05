import { NotificationModel, NotificationTemplateModel, NotificationType, NotificationStatus } from '@app/domain/models';

export interface CreateNotificationDto {
    userId: number;
    type: NotificationType;
    templateName: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
}

export interface UpdateNotificationDto {
    status?: NotificationStatus;
    isRead?: boolean;
    isArchived?: boolean;
    readAt?: Date | null;
    sentAt?: Date;
    failedReason?: string;
}

export interface NotificationFilters {
    userId?: number;
    type?: NotificationType;
    status?: NotificationStatus;
    templateName?: string;
    isRead?: boolean;
    isArchived?: boolean;
    page?: number;
    limit?: number;
}

export interface NotificationStatistics {
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    deliveryRate: number;
    readRate: number;
    byType: {
        email: number;
        push: number;
    };
    byStatus: {
        sent: number;
        delivered: number;
        read: number;
        failed: number;
    };
}

export interface INotificationService {
    // CRUD операции
    createNotification(createDto: CreateNotificationDto): Promise<NotificationModel>;
    getNotificationById(id: number, userId?: number): Promise<NotificationModel | null>;
    getNotifications(filters: NotificationFilters): Promise<{ data: NotificationModel[]; meta: Record<string, unknown> }>;
    updateNotification(id: number, updateDto: UpdateNotificationDto, userId?: number): Promise<NotificationModel>;
    deleteNotification(id: number, userId?: number): Promise<void>;

    // Управление уведомлениями
    markAsRead(id: number, userId: number): Promise<NotificationModel>;
    markAsUnread(id: number, userId: number): Promise<NotificationModel>;
    archiveNotification(id: number, userId: number): Promise<NotificationModel>;
    unarchiveNotification(id: number, userId: number): Promise<NotificationModel>;

    // Статистика
    getUnreadCount(userId: number): Promise<number>;
    getStatistics(userId?: number, period?: string, type?: NotificationType): Promise<NotificationStatistics>;

    // Отправка уведомлений
    sendNotification(createDto: CreateNotificationDto): Promise<NotificationModel>;
    sendBulkNotifications(notifications: CreateNotificationDto[]): Promise<NotificationModel[]>;

    // Работа с шаблонами
    getTemplates(filters?: { type?: NotificationType; isActive?: boolean }): Promise<NotificationTemplateModel[]>;
    getTemplateByName(name: string): Promise<NotificationTemplateModel | null>;
    createTemplateFromNotification(notificationId: number): Promise<NotificationTemplateModel>;
}
