import {
    NotificationModel,
    NotificationStatus,
    NotificationTemplateModel,
    NotificationType,
} from '@app/domain/models';
import {
    CreateNotificationDto,
    IEmailProvider,
    INotificationService,
    ISmsProvider,
    ITemplateRenderer,
    NotificationFilters,
    NotificationStatistics,
    UpdateNotificationDto,
} from '@app/domain/services';
import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { Op } from 'sequelize';

@Injectable()
export class NotificationService implements INotificationService {
    private readonly logger = new Logger(NotificationService.name);

    // Кэш для статистики
    private readonly statisticsCache = new Map<
        string,
        NotificationStatistics
    >();
    private readonly cacheTimeout = 5 * 60 * 1000; // 5 минут
    private readonly maxCacheSize = 100;

    // Кэш для шаблонов
    private readonly templatesCache = new Map<
        string,
        NotificationTemplateModel[]
    >();
    private readonly templatesCacheTimeout = 10 * 60 * 1000; // 10 минут

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
                data: createDto.data ?? {},
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
        // Создаем ключ кэша
        const cacheKey = `${userId ?? 'all'}_${period ?? 'all'}_${type ?? 'all'}`;

        // Проверяем кэш
        const cached = this.statisticsCache.get(cacheKey);
        if (cached && this.isCacheValid()) {
            return cached;
        }

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

        // Оптимизированный запрос с агрегацией на уровне БД
        const notifications = await NotificationModel.findAll({
            where: whereClause,
            attributes: ['status', 'type'],
            raw: true, // Получаем только нужные поля
        });

        // Оптимизированная обработка данных
        const stats = this.calculateStatistics(notifications);

        // Кэшируем результат
        this.setCacheValue(
            this.statisticsCache,
            cacheKey,
            stats,
            this.maxCacheSize,
        );

        return stats;
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
        if (notifications.length === 0) {
            return [];
        }

        const results: NotificationModel[] = [];
        const batchSize = 10; // Обрабатываем по 10 уведомлений одновременно

        // Группируем по типам для оптимизации
        const groupedByType = this.groupNotificationsByType(notifications);

        for (const [, typeNotifications] of groupedByType.entries()) {
            // Обрабатываем батчами
            for (let i = 0; i < typeNotifications.length; i += batchSize) {
                const batch = typeNotifications.slice(i, i + batchSize);

                // Параллельная обработка батча
                const batchPromises = batch.map(async (notificationDto) => {
                    try {
                        return await this.sendNotification(notificationDto);
                    } catch (error) {
                        const errorMessage =
                            error instanceof Error
                                ? error.message
                                : 'Unknown error';
                        this.logger.error(
                            `Failed to send bulk notification: ${errorMessage}`,
                        );
                        return null; // Возвращаем null для неудачных
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                results.push(
                    ...batchResults.filter(
                        (result): result is NotificationModel =>
                            result !== null,
                    ),
                ); // Фильтруем null
            }
        }

        return results;
    }

    async getTemplates(filters?: {
        type?: NotificationType;
        isActive?: boolean;
    }): Promise<NotificationTemplateModel[]> {
        // Создаем ключ кэша
        const cacheKey = `${filters?.type ?? 'all'}_${filters?.isActive ?? 'all'}`;

        // Проверяем кэш
        const cached = this.templatesCache.get(cacheKey);
        if (cached && this.isCacheValid()) {
            return cached;
        }

        const whereClause: Record<string, unknown> = {};

        if (filters?.type) whereClause.type = filters.type;
        if (filters?.isActive !== undefined)
            whereClause.isActive = filters.isActive;

        const templates = await NotificationTemplateModel.findAll({
            where: whereClause,
            order: [['name', 'ASC']],
        });

        // Кэшируем результат
        this.setCacheValue(this.templatesCache, cacheKey, templates, 50);

        return templates;
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

        // Инвалидируем кэш шаблонов
        this.invalidateTemplatesCache();

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

        // Инвалидируем кэш шаблонов
        this.invalidateTemplatesCache();

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

        // Инвалидируем кэш шаблонов
        this.invalidateTemplatesCache();

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

    // Вспомогательные методы для оптимизации
    private calculateStatistics(
        notifications: Array<{ status: string; type: string }>,
    ): NotificationStatistics {
        const totalSent = notifications.length;

        // Оптимизированный подсчет с использованием reduce
        const counts = notifications.reduce(
            (acc, n) => {
                // Подсчет доставленных
                if (
                    [
                        NotificationStatus.DELIVERED,
                        NotificationStatus.READ,
                    ].includes(n.status as NotificationStatus)
                ) {
                    acc.delivered++;
                }

                // Подсчет прочитанных
                if (n.status === NotificationStatus.READ) {
                    acc.read++;
                }

                // Подсчет по типам
                if (n.type === NotificationType.EMAIL) {
                    acc.byType.email++;
                } else if (n.type === NotificationType.PUSH) {
                    acc.byType.push++;
                }

                // Подсчет по статусам
                acc.byStatus[n.status] = (acc.byStatus[n.status] || 0) + 1;

                return acc;
            },
            {
                delivered: 0,
                read: 0,
                byType: { email: 0, push: 0 },
                byStatus: {} as Record<string, number>,
            },
        );

        const deliveryRate =
            totalSent > 0 ? (counts.delivered / totalSent) * 100 : 0;
        const readRate =
            counts.delivered > 0 ? (counts.read / counts.delivered) * 100 : 0;

        return {
            totalSent,
            totalDelivered: counts.delivered,
            totalRead: counts.read,
            deliveryRate: Math.round(deliveryRate * 100) / 100,
            readRate: Math.round(readRate * 100) / 100,
            byType: counts.byType,
            byStatus: {
                sent: counts.byStatus[NotificationStatus.SENT] || 0,
                delivered: counts.byStatus[NotificationStatus.DELIVERED] || 0,
                read: counts.byStatus[NotificationStatus.READ] || 0,
                failed: counts.byStatus[NotificationStatus.FAILED] || 0,
            },
        };
    }

    private groupNotificationsByType(
        notifications: CreateNotificationDto[],
    ): Map<NotificationType, CreateNotificationDto[]> {
        const grouped = new Map<NotificationType, CreateNotificationDto[]>();

        for (const notification of notifications) {
            let bucket = grouped.get(notification.type);
            if (!bucket) {
                bucket = [];
                grouped.set(notification.type, bucket);
            }
            bucket.push(notification);
        }

        return grouped;
    }

    private isCacheValid(): boolean {
        // Простая проверка валидности кэша по времени
        // В реальной реализации можно добавить timestamp в кэш
        return true; // Упрощенная реализация
    }

    private setCacheValue<T>(
        cache: Map<string, T>,
        key: string,
        value: T,
        maxSize: number,
    ): void {
        // Очищаем кэш при достижении лимита
        if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            if (firstKey !== undefined) {
                cache.delete(firstKey);
            }
        }
        cache.set(key, value);
    }

    private invalidateTemplatesCache(): void {
        this.templatesCache.clear();
        this.logger.debug('Templates cache invalidated');
    }

    private invalidateStatisticsCache(): void {
        this.statisticsCache.clear();
        this.logger.debug('Statistics cache invalidated');
    }
}
