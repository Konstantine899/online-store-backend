import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
    Inject,
} from '@nestjs/common';
import { Op } from 'sequelize';
import {
    NotificationModel,
    NotificationTemplateModel,
    NotificationType,
    NotificationStatus,
} from '@app/domain/models';
import {
    INotificationService,
    CreateNotificationDto,
    UpdateNotificationDto,
    NotificationFilters,
    NotificationStatistics,
} from '@app/domain/services';
import { IEmailProvider } from '@app/domain/services';
import { ISmsProvider } from '@app/domain/services';
import { ITemplateRenderer } from '@app/domain/services';

@Injectable()
export class NotificationService implements INotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        @Inject('IEmailProvider')
        private readonly emailProvider: IEmailProvider,
        @Inject('ISmsProvider') private readonly smsProvider: ISmsProvider,
        @Inject('ITemplateRenderer')
        private readonly templateRenderer: ITemplateRenderer,
    ) {}

    async createNotification(
        createDto: CreateNotificationDto,
    ): Promise<NotificationModel> {
        try {
            const notification = await NotificationModel.create({
                userId: createDto.userId,
                type: createDto.type,
                templateName: createDto.templateName,
                title: createDto.title,
                message: createDto.message,
                data: createDto.data || {},
                status: NotificationStatus.PENDING,
                isRead: false,
                isArchived: false,
            });

            this.logger.log(
                `Notification created: ${notification.id} for user ${createDto.userId}`,
            );
            return notification;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(
                `Failed to create notification: ${errorMessage}`,
                errorStack,
            );
            throw new BadRequestException('Не удалось создать уведомление');
        }
    }

    async getNotificationById(
        id: number,
        userId?: number,
    ): Promise<NotificationModel | null> {
        const whereClause: Record<string, unknown> = { id };

        // Тенантская изоляция: пользователи видят только свои уведомления
        if (userId) {
            whereClause.userId = userId;
        }

        return NotificationModel.findOne({
            where: whereClause,
            include: [
                {
                    model: NotificationTemplateModel,
                    as: 'template',
                    required: false,
                },
            ],
        });
    }

    async getNotifications(
        filters: NotificationFilters,
    ): Promise<{ data: NotificationModel[]; meta: Record<string, unknown> }> {
        const {
            userId,
            type,
            status,
            templateName,
            isRead,
            isArchived,
            page = 1,
            limit = 20,
        } = filters;

        const whereClause: Record<string, unknown> = {};

        // Тенантская изоляция: обязательный фильтр по userId
        if (userId) {
            whereClause.userId = userId;
        }

        if (type) whereClause.type = type;
        if (status) whereClause.status = status;
        if (templateName) whereClause.templateName = templateName;
        if (typeof isRead === 'boolean') whereClause.isRead = isRead;
        if (typeof isArchived === 'boolean')
            whereClause.isArchived = isArchived;

        const offset = (page - 1) * limit;

        const { count, rows } = await NotificationModel.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [
                {
                    model: NotificationTemplateModel,
                    as: 'template',
                    required: false,
                },
            ],
        });

        const totalPages = Math.ceil(count / limit);

        return {
            data: rows,
            meta: {
                totalCount: count,
                currentPage: page,
                lastPage: totalPages,
                nextPage: page < totalPages ? page + 1 : null,
                previousPage: page > 1 ? page - 1 : null,
                limit,
            },
        };
    }

    async updateNotification(
        id: number,
        updateDto: UpdateNotificationDto,
        userId?: number,
    ): Promise<NotificationModel> {
        const whereClause: Record<string, unknown> = { id };

        // Тенантская изоляция
        if (userId) {
            whereClause.userId = userId;
        }

        const [affectedCount] = await NotificationModel.update(updateDto, {
            where: whereClause,
        });

        if (affectedCount === 0) {
            throw new NotFoundException('Уведомление не найдено');
        }

        const updatedNotification = await this.getNotificationById(id, userId);
        if (!updatedNotification) {
            throw new NotFoundException('Уведомление не найдено');
        }

        this.logger.log(`Notification updated: ${id}`);
        return updatedNotification;
    }

    async deleteNotification(id: number, userId?: number): Promise<void> {
        const whereClause: Record<string, unknown> = { id };

        // Тенантская изоляция
        if (userId) {
            whereClause.userId = userId;
        }

        const deletedCount = await NotificationModel.destroy({
            where: whereClause,
        });

        if (deletedCount === 0) {
            throw new NotFoundException('Уведомление не найдено');
        }

        this.logger.log(`Notification deleted: ${id}`);
    }

    async markAsRead(id: number, userId: number): Promise<NotificationModel> {
        return this.updateNotification(
            id,
            {
                isRead: true,
                readAt: new Date(),
                status: NotificationStatus.READ,
            },
            userId,
        );
    }

    async markAsUnread(id: number, userId: number): Promise<NotificationModel> {
        return this.updateNotification(
            id,
            {
                isRead: false,
                readAt: null,
            },
            userId,
        );
    }

    async archiveNotification(
        id: number,
        userId: number,
    ): Promise<NotificationModel> {
        return this.updateNotification(
            id,
            {
                isArchived: true,
            },
            userId,
        );
    }

    async unarchiveNotification(
        id: number,
        userId: number,
    ): Promise<NotificationModel> {
        return this.updateNotification(
            id,
            {
                isArchived: false,
            },
            userId,
        );
    }

    async getUnreadCount(userId: number): Promise<number> {
        return NotificationModel.count({
            where: {
                userId,
                isRead: false,
                isArchived: false,
            },
        });
    }

    async getStatistics(
        userId?: number,
        period?: string,
        type?: NotificationType,
    ): Promise<NotificationStatistics> {
        const whereClause: Record<string, unknown> = {};

        // Тенантская изоляция
        if (userId) {
            whereClause.userId = userId;
        }

        // Фильтр по периоду
        if (period) {
            const days = this.parsePeriod(period);
            whereClause.createdAt = {
                [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            };
        }

        // Фильтр по типу
        if (type) {
            whereClause.type = type;
        }

        const notifications = await NotificationModel.findAll({
            where: whereClause,
            attributes: ['status', 'type'],
        });

        const totalSent = notifications.length;
        const totalDelivered = notifications.filter((n) =>
            [NotificationStatus.DELIVERED, NotificationStatus.READ].includes(
                n.status,
            ),
        ).length;
        const totalRead = notifications.filter(
            (n) => n.status === NotificationStatus.READ,
        ).length;

        const deliveryRate =
            totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
        const readRate =
            totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;

        const byType = {
            email: notifications.filter(
                (n) => n.type === NotificationType.EMAIL,
            ).length,
            push: notifications.filter((n) => n.type === NotificationType.PUSH)
                .length,
        };

        const byStatus = {
            sent: notifications.filter(
                (n) => n.status === NotificationStatus.SENT,
            ).length,
            delivered: notifications.filter(
                (n) => n.status === NotificationStatus.DELIVERED,
            ).length,
            read: notifications.filter(
                (n) => n.status === NotificationStatus.READ,
            ).length,
            failed: notifications.filter(
                (n) => n.status === NotificationStatus.FAILED,
            ).length,
        };

        return {
            totalSent,
            totalDelivered,
            totalRead,
            deliveryRate: Math.round(deliveryRate * 100) / 100,
            readRate: Math.round(readRate * 100) / 100,
            byType,
            byStatus,
        };
    }

    async sendNotification(
        createDto: CreateNotificationDto,
    ): Promise<NotificationModel> {
        // Создаем уведомление
        const notification = await this.createNotification(createDto);

        try {
            // Отправляем через соответствующий провайдер
            if (createDto.type === NotificationType.EMAIL) {
                await this.sendEmailNotification(notification);
            } else if (createDto.type === NotificationType.PUSH) {
                await this.sendPushNotification(notification);
            }

            // Обновляем статус на отправленное
            await this.updateNotification(notification.id, {
                status: NotificationStatus.SENT,
                sentAt: new Date(),
            });

            this.logger.log(`Notification sent: ${notification.id}`);
            return notification;
        } catch (error) {
            // Обновляем статус на неудачное
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            await this.updateNotification(notification.id, {
                status: NotificationStatus.FAILED,
                failedReason: errorMessage,
            });

            this.logger.error(
                `Failed to send notification: ${errorMessage}`,
                errorStack,
            );
            throw error;
        }
    }

    async sendBulkNotifications(
        notifications: CreateNotificationDto[],
    ): Promise<NotificationModel[]> {
        const results: NotificationModel[] = [];

        for (const notificationDto of notifications) {
            try {
                const notification =
                    await this.sendNotification(notificationDto);
                results.push(notification);
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(
                    `Failed to send bulk notification: ${errorMessage}`,
                );
                // Продолжаем отправку остальных уведомлений
            }
        }

        return results;
    }

    async getTemplates(filters?: {
        type?: NotificationType;
        isActive?: boolean;
    }): Promise<NotificationTemplateModel[]> {
        const whereClause: Record<string, unknown> = {};

        if (filters?.type) whereClause.type = filters.type;
        if (filters?.isActive !== undefined)
            whereClause.isActive = filters.isActive;

        return NotificationTemplateModel.findAll({
            where: whereClause,
            order: [['name', 'ASC']],
        });
    }

    async createTemplate(
        createDto: Partial<NotificationTemplateModel>,
    ): Promise<NotificationTemplateModel> {
        if (
            !createDto.name ||
            !createDto.type ||
            !createDto.title ||
            !createDto.message
        ) {
            throw new BadRequestException(
                'Необходимо указать name, type, title и message для создания шаблона',
            );
        }

        const template = await NotificationTemplateModel.create({
            name: createDto.name,
            type: createDto.type,
            title: createDto.title,
            message: createDto.message,
            isActive: createDto.isActive ?? true,
        });
        this.logger.log(`Template created: ${template.id}`);
        return template;
    }

    async getTemplateById(
        id: number,
    ): Promise<NotificationTemplateModel | null> {
        return NotificationTemplateModel.findByPk(id);
    }

    async getTemplateByName(
        name: string,
    ): Promise<NotificationTemplateModel | null> {
        return NotificationTemplateModel.findOne({
            where: { name, isActive: true },
        });
    }

    async updateTemplate(
        id: number,
        updateDto: Partial<NotificationTemplateModel>,
    ): Promise<NotificationTemplateModel> {
        const [affectedCount] = await NotificationTemplateModel.update(
            updateDto,
            {
                where: { id },
            },
        );

        if (affectedCount === 0) {
            throw new NotFoundException(`Шаблон с ID ${id} не найден.`);
        }

        const updatedTemplate = await this.getTemplateById(id);
        if (!updatedTemplate) {
            throw new NotFoundException(
                `Шаблон с ID ${id} не найден после обновления.`,
            );
        }
        this.logger.log(`Template updated: ${id}`);
        return updatedTemplate;
    }

    async deleteTemplate(id: number): Promise<void> {
        const deletedCount = await NotificationTemplateModel.destroy({
            where: { id },
        });

        if (deletedCount === 0) {
            throw new NotFoundException(`Шаблон с ID ${id} не найден.`);
        }
        this.logger.log(`Template deleted: ${id}`);
    }

    async createTemplateFromNotification(
        notificationId: number,
    ): Promise<NotificationTemplateModel> {
        const notification = await this.getNotificationById(notificationId);
        if (!notification) {
            throw new NotFoundException('Уведомление не найдено');
        }

        const template = await NotificationTemplateModel.create({
            name: `${notification.templateName}_${Date.now()}`,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            variables: [],
            isActive: true,
        });

        this.logger.log(`Template created from notification: ${template.id}`);
        return template;
    }

    private async sendEmailNotification(
        notification: NotificationModel,
    ): Promise<void> {
        // Mock реализация для разработки
        this.logger.log(
            `Mock email sent to user ${notification.userId}: ${notification.title}`,
        );

        // В реальной реализации здесь будет:
        // const result = await this.emailProvider.sendEmail({
        //     to: user.email,
        //     subject: notification.title,
        //     html: notification.message,
        // });
    }

    private async sendPushNotification(
        notification: NotificationModel,
    ): Promise<void> {
        // Mock реализация для разработки
        this.logger.log(
            `Mock push notification sent to user ${notification.userId}: ${notification.title}`,
        );

        // В реальной реализации здесь будет интеграция с push-сервисом
    }

    private parsePeriod(period: string): number {
        const match = period.match(/^(\d+)([dhms])$/);
        if (!match) {
            throw new BadRequestException(
                'Неверный формат периода. Используйте: 7d, 24h, 30m, 60s',
            );
        }

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case 'd':
                return value * 24 * 60 * 60;
            case 'h':
                return value * 60 * 60;
            case 'm':
                return value * 60;
            case 's':
                return value;
            default:
                throw new BadRequestException('Неверная единица времени');
        }
    }
}
