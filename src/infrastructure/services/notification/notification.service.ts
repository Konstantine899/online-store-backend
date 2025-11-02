import {
    NotificationModel,
    NotificationStatus,
    NotificationTemplateModel,
    NotificationType,
    UserModel,
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
import type { IRedisCache } from '@app/domain/services/notification/i-redis-cache';
import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    Optional,
} from '@nestjs/common';
import { Op, QueryTypes } from 'sequelize';

@Injectable()
export class NotificationService implements INotificationService {
    private readonly logger = new Logger(NotificationService.name);

    // Кэш для статистики с timestamp для проверки TTL
    private readonly statisticsCache = new Map<
        string,
        { value: NotificationStatistics; timestamp: number }
    >();
    private readonly cacheTimeout = 5 * 60 * 1000; // 5 минут
    private readonly maxCacheSize = 100;

    // Кэш для шаблонов с timestamp для проверки TTL
    private readonly templatesCache = new Map<
        string,
        { value: NotificationTemplateModel[]; timestamp: number }
    >();
    private readonly templatesCacheTimeout = 10 * 60 * 1000; // 10 минут

    // Кэш для tenantId пользователей (оптимизация производительности)
    private readonly tenantIdCache = new Map<
        number,
        { tenantId: number; timestamp: number }
    >();
    private readonly tenantCacheTimeout = 5 * 60 * 1000; // 5 минут
    private readonly maxTenantCacheSize = 1000; // Больше чем для статистики, т.к. это критично для производительности

    constructor(
        @Inject('IEmailProvider')
        private readonly emailProvider: IEmailProvider,
        @Inject('ISmsProvider') private readonly smsProvider: ISmsProvider,
        @Inject('ITemplateRenderer')
        private readonly templateRenderer: ITemplateRenderer,
        @Optional()
        @Inject('IRedisCache')
        private readonly redisCache?: IRedisCache,
    ) {}

    /**
     * Получает tenantId для пользователя с кэшированием
     *
     * @param userId - ID пользователя
     * @returns tenantId пользователя
     *
     * @remarks
     * - Использует многоуровневое кэширование: in-memory (5 минут) и опционально Redis
     * - Приоритет получения tenantId:
     *   1. tenant_users таблица (основной источник истины)
     *   2. Последнее уведомление пользователя (fallback для обратной совместимости)
     *   3. Default tenant = 1 (только при отсутствии данных в БД)
     * - Логирует предупреждения при использовании fallback для мониторинга
     */
    private async getUserTenantId(userId: number): Promise<number> {
        const now = Date.now();
        const cacheKey = `tenant:user:${userId}`;

        // Приоритет 1: Проверяем Redis кэш (если доступен)
        if (this.redisCache) {
            try {
                const cachedTenantId =
                    await this.redisCache.get<number>(cacheKey);
                if (cachedTenantId !== null) {
                    // Обновляем in-memory кэш для быстрого доступа
                    this.tenantIdCache.set(userId, {
                        tenantId: cachedTenantId,
                        timestamp: now,
                    });
                    return cachedTenantId;
                }
            } catch (redisError) {
                const errorMessage =
                    redisError instanceof Error
                        ? redisError.message
                        : 'Unknown error';
                this.logger.warn(
                    `Redis cache error for user ${userId}: ${errorMessage}, falling back to in-memory cache`,
                );
                // Продолжаем проверку in-memory кэша
            }
        }

        // Приоритет 2: Проверяем in-memory кэш
        const cached = this.tenantIdCache.get(userId);
        if (cached && now - cached.timestamp < this.tenantCacheTimeout) {
            return cached.tenantId;
        }

        try {
            let tenantId: number | null = null;

            // Приоритет 1: Получаем tenantId из таблицы tenant_users (основной источник истины)
            if (NotificationModel.sequelize) {
                try {
                    const tenantUserResult =
                        await NotificationModel.sequelize.query<{
                            tenant_id: number;
                        }>(
                            'SELECT tenant_id FROM tenant_users WHERE user_id = :userId LIMIT 1',
                            {
                                replacements: { userId },
                                type: QueryTypes.SELECT,
                            },
                        );

                    if (tenantUserResult && tenantUserResult.length > 0) {
                        tenantId = tenantUserResult[0].tenant_id;
                        this.logger.debug(
                            `Found tenantId ${tenantId} for user ${userId} from tenant_users table`,
                        );
                    }
                } catch (tenantUserError) {
                    const errorMessage =
                        tenantUserError instanceof Error
                            ? tenantUserError.message
                            : 'Unknown error';
                    this.logger.warn(
                        `Failed to get tenantId from tenant_users for user ${userId}: ${errorMessage}`,
                    );
                    // Продолжаем проверку других источников
                }
            }

            // Приоритет 2: Если не нашли в tenant_users, пытаемся получить из последнего уведомления
            if (tenantId === null) {
                const lastNotification = await NotificationModel.findOne({
                    where: { userId },
                    attributes: ['tenantId'],
                    order: [['createdAt', 'DESC']],
                    limit: 1,
                });

                if (lastNotification?.tenantId) {
                    tenantId = lastNotification.tenantId;
                    this.logger.debug(
                        `Found tenantId ${tenantId} for user ${userId} from last notification`,
                    );
                }
            }

            // Приоритет 3: Fallback на default tenant = 1 (только если данных нет в БД)
            if (tenantId === null) {
                this.logger.warn(
                    `User ${userId} has no tenant assigned in tenant_users table and no notifications. Using default tenant 1. This may indicate data inconsistency.`,
                );
                tenantId = 1;
            }

            // Кэшируем результат: сначала в Redis (если доступен), затем в in-memory
            if (this.redisCache) {
                try {
                    const ttlSeconds = Math.floor(
                        this.tenantCacheTimeout / 1000,
                    );
                    await this.redisCache.set(cacheKey, tenantId, ttlSeconds);
                } catch (redisError) {
                    const errorMessage =
                        redisError instanceof Error
                            ? redisError.message
                            : 'Unknown error';
                    this.logger.warn(
                        `Failed to cache tenantId in Redis for user ${userId}: ${errorMessage}`,
                    );
                    // Продолжаем кэширование в in-memory
                }
            }

            // Кэшируем в in-memory кэш
            if (this.tenantIdCache.size >= this.maxTenantCacheSize) {
                const firstKey = this.tenantIdCache.keys().next().value;
                if (firstKey !== undefined) {
                    this.tenantIdCache.delete(firstKey);
                }
            }
            this.tenantIdCache.set(userId, { tenantId, timestamp: now });

            return tenantId;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Failed to get tenantId for user ${userId}: ${errorMessage}, using default tenant 1`,
            );

            // Кэшируем fallback значение на короткое время (1 минута) при ошибках
            const fallbackTenantId = 1;

            // Не кэшируем fallback в Redis при ошибках, только в in-memory
            if (this.tenantIdCache.size >= this.maxTenantCacheSize) {
                const firstKey = this.tenantIdCache.keys().next().value;
                if (firstKey !== undefined) {
                    this.tenantIdCache.delete(firstKey);
                }
            }
            this.tenantIdCache.set(userId, {
                tenantId: fallbackTenantId,
                timestamp: now,
            });

            return fallbackTenantId;
        }
    }

    async createNotification(
        createDto: CreateNotificationDto,
    ): Promise<NotificationModel> {
        try {
            // Получаем tenantId для пользователя
            const tenantId = await this.getUserTenantId(createDto.userId);

            const notification = await NotificationModel.create({
                userId: createDto.userId,
                tenantId, // ✅ Добавляем tenant scope
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
                `Notification created: ${notification.id} for user ${createDto.userId} (tenant ${tenantId})`,
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
        // Тенантская изоляция: пользователи видят только свои уведомления
        if (userId) {
            // Получаем tenantId для использования scope
            const tenantId = await this.getUserTenantId(userId);
            // Используем scope byTenant из модели для согласованности
            return NotificationModel.scope({
                method: ['byTenant', tenantId],
            }).findOne({
                where: { id, userId },
                include: [
                    {
                        model: NotificationTemplateModel,
                        as: 'template',
                        required: false,
                    },
                ],
            });
        }

        // Без userId (для админов) - без tenant фильтрации
        return NotificationModel.findOne({
            where: { id },
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
            tenantId: explicitTenantId,
            type,
            status,
            templateName,
            isRead,
            isArchived,
            page = 1,
            limit = 20,
        } = filters;

        const whereClause: Record<string, unknown> = {};

        // Тенантская изоляция: обязательный фильтр по userId и tenantId
        let tenantId: number | undefined;
        if (userId) {
            whereClause.userId = userId;
            // Используем явный tenantId из фильтров или получаем из пользователя
            tenantId = explicitTenantId ?? (await this.getUserTenantId(userId));
            whereClause.tenantId = tenantId;
        } else if (explicitTenantId) {
            // Если указан только tenantId (без userId), используем его
            tenantId = explicitTenantId;
            whereClause.tenantId = tenantId;
        }

        if (type) whereClause.type = type;
        if (status) whereClause.status = status;
        if (templateName) whereClause.templateName = templateName;
        if (typeof isRead === 'boolean') whereClause.isRead = isRead;
        if (typeof isArchived === 'boolean')
            whereClause.isArchived = isArchived;

        const offset = (page - 1) * limit;

        // Используем scope byTenant, если tenantId определен
        const baseQuery = {
            where: whereClause,
            order: [['createdAt', 'DESC']] as [string, string][],
            limit,
            offset,
            include: [
                {
                    model: NotificationTemplateModel,
                    as: 'template',
                    required: false,
                },
            ],
        };

        const { count, rows } = tenantId
            ? await NotificationModel.scope({
                  method: ['byTenant', tenantId],
              }).findAndCountAll(baseQuery)
            : await NotificationModel.findAndCountAll(baseQuery);

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
        let tenantId: number | undefined;
        if (userId) {
            whereClause.userId = userId;
            // Получаем tenantId для использования scope
            tenantId = await this.getUserTenantId(userId);
            whereClause.tenantId = tenantId;
        }

        // Используем scope byTenant, если tenantId определен
        const updateOptions = { where: whereClause };
        const [affectedCount] = tenantId
            ? await NotificationModel.scope({
                  method: ['byTenant', tenantId],
              }).update(updateDto, updateOptions)
            : await NotificationModel.update(updateDto, updateOptions);

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
        let tenantId: number | undefined;
        if (userId) {
            whereClause.userId = userId;
            // Получаем tenantId для использования scope
            tenantId = await this.getUserTenantId(userId);
            whereClause.tenantId = tenantId;
        }

        // Используем scope byTenant, если tenantId определен
        const deleteOptions = { where: whereClause };
        const deletedCount = tenantId
            ? await NotificationModel.scope({
                  method: ['byTenant', tenantId],
              }).destroy(deleteOptions)
            : await NotificationModel.destroy(deleteOptions);

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
        // Получаем tenantId для использования scope
        const tenantId = await this.getUserTenantId(userId);

        // Используем scope byTenant из модели для согласованности
        return NotificationModel.scope({
            method: ['byTenant', tenantId],
        }).count({
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
        // Получаем tenantId для включения в ключ кэша
        let tenantId: number | string = 'all';
        if (userId) {
            tenantId = await this.getUserTenantId(userId);
        }

        // Создаем ключ кэша с tenantId для предотвращения пересечений между tenants
        const cacheKey = `${userId ?? 'all'}_${tenantId}_${period ?? 'all'}_${type ?? 'all'}`;

        // Проверяем кэш
        const cached = this.statisticsCache.get(cacheKey);
        if (
            cached &&
            this.isCacheValid(cacheKey, cached.timestamp, this.cacheTimeout)
        ) {
            return cached.value;
        }

        const whereClause: Record<string, unknown> = {};

        // Тенантская изоляция
        if (userId) {
            whereClause.userId = userId;
            whereClause.tenantId = tenantId;
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
        // Используем scope byTenant, если tenantId определен
        const queryOptions = {
            where: whereClause,
            attributes: ['status', 'type'],
            raw: true, // Получаем только нужные поля
        };
        const notifications =
            userId && whereClause.tenantId
                ? await NotificationModel.scope({
                      method: ['byTenant', whereClause.tenantId as number],
                  }).findAll(queryOptions)
                : await NotificationModel.findAll(queryOptions);

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

        // Группируем по userId для оптимизации получения tenantId
        const groupedByUser = this.groupNotificationsByUserId(notifications);

        for (const [userId, userNotifications] of groupedByUser.entries()) {
            // Получаем tenantId один раз для всех уведомлений пользователя
            await this.getUserTenantId(userId); // Кэшируем tenantId для последующих вызовов

            // Затем группируем по типам для оптимизации отправки
            const groupedByType =
                this.groupNotificationsByType(userNotifications);

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
        if (
            cached &&
            this.isCacheValid(
                cacheKey,
                cached.timestamp,
                this.templatesCacheTimeout,
            )
        ) {
            return cached.value;
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
        // Загружаем пользователя для получения email
        const user = await UserModel.findByPk(notification.userId, {
            attributes: ['id', 'email', 'firstName', 'lastName'],
        });

        if (!user) {
            throw new NotFoundException(
                `Пользователь с ID ${notification.userId} не найден`,
            );
        }

        if (!user.email) {
            throw new BadRequestException(
                `У пользователя ${notification.userId} не указан email`,
            );
        }

        // Используем templateRenderer для рендеринга, если есть шаблон
        let renderedTitle = notification.title;
        let renderedMessage = notification.message;

        if (notification.templateName && this.templateRenderer) {
            try {
                // Получаем шаблон для рендеринга
                const template = await NotificationTemplateModel.findOne({
                    where: { name: notification.templateName },
                });

                if (template) {
                    // Преобразуем notification.data в TemplateVariables (фильтруем только допустимые типы)
                    const templateData: Record<
                        string,
                        string | number | boolean | object | Date
                    > = {};
                    if (notification.data) {
                        for (const [key, value] of Object.entries(
                            notification.data,
                        )) {
                            if (
                                typeof value === 'string' ||
                                typeof value === 'number' ||
                                typeof value === 'boolean' ||
                                value instanceof Date ||
                                (typeof value === 'object' && value !== null)
                            ) {
                                templateData[key] = value as
                                    | string
                                    | number
                                    | boolean
                                    | object
                                    | Date;
                            }
                        }
                    }

                    // Рендерим title шаблона
                    const titleResult =
                        await this.templateRenderer.renderTemplate(
                            template.title,
                            templateData,
                        );
                    if (titleResult.success && titleResult.content) {
                        renderedTitle = titleResult.content;
                    }

                    // Рендерим message шаблона
                    const messageResult =
                        await this.templateRenderer.renderTemplate(
                            template.message,
                            templateData,
                        );
                    if (messageResult.success && messageResult.content) {
                        renderedMessage = messageResult.content;
                    }
                }
            } catch (error) {
                // Если рендеринг не удался, используем оригинальные значения
                this.logger.warn(
                    `Failed to render template for notification ${notification.id}: ${
                        error instanceof Error ? error.message : 'Unknown error'
                    }`,
                );
            }
        }

        // Отправляем email через провайдер
        const emailResult = await this.emailProvider.sendEmail({
            to: user.email,
            subject: renderedTitle,
            html: renderedMessage,
            text: renderedMessage.replace(/<[^>]*>/g, ''), // Plain text версия
        });

        if (!emailResult.success) {
            throw new Error(
                emailResult.error ?? 'Не удалось отправить email уведомление',
            );
        }

        this.logger.log(
            `Email notification sent to ${user.email} (user ${notification.userId}): ${notification.title}`,
        );
    }

    private async sendPushNotification(
        notification: NotificationModel,
    ): Promise<void> {
        // Загружаем пользователя для проверки
        const user = await UserModel.findByPk(notification.userId, {
            attributes: ['id', 'email', 'firstName', 'lastName'],
        });

        if (!user) {
            throw new NotFoundException(
                `Пользователь с ID ${notification.userId} не найден`,
            );
        }

        // Mock реализация для разработки
        // В реальной реализации здесь будет:
        // 1. Получение push tokens пользователя из БД/кэша
        // 2. Интеграция с FCM (Firebase Cloud Messaging) для Android
        // 3. Интеграция с APNS (Apple Push Notification Service) для iOS
        // 4. Отправка через соответствующий сервис
        this.logger.log(
            `Mock push notification queued for user ${notification.userId} (${user.email}): ${notification.title}`,
        );
        this.logger.debug(
            `Push notification content: ${notification.message.substring(0, 100)}...`,
        );

        // Имитация задержки отправки
        await new Promise((resolve) => setTimeout(resolve, 50));
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

    /**
     * Группирует уведомления по userId для оптимизации получения tenantId
     */
    private groupNotificationsByUserId(
        notifications: CreateNotificationDto[],
    ): Map<number, CreateNotificationDto[]> {
        const grouped = new Map<number, CreateNotificationDto[]>();

        for (const notification of notifications) {
            let bucket = grouped.get(notification.userId);
            if (!bucket) {
                bucket = [];
                grouped.set(notification.userId, bucket);
            }
            bucket.push(notification);
        }

        return grouped;
    }

    /**
     * Проверяет валидность записи в кэше по TTL
     * @param cacheKey - ключ записи в кэше
     * @param timestamp - timestamp записи
     * @param ttl - время жизни записи в миллисекундах
     * @returns true если запись еще актуальна, false если истекла
     */
    private isCacheValid(
        cacheKey: string,
        timestamp: number,
        ttl: number,
    ): boolean {
        const now = Date.now();
        const age = now - timestamp;

        // Если запись устарела, удаляем её из кэша
        if (age > ttl) {
            // Определяем, из какого кэша удалять по префиксу ключа
            // (в данном случае можем удалить из обоих, так как ключи уникальны)
            this.statisticsCache.delete(cacheKey);
            this.templatesCache.delete(cacheKey);
            return false;
        }

        return true;
    }

    /**
     * Устанавливает значение в кэш с timestamp
     * @param cache - кэш для сохранения
     * @param key - ключ записи
     * @param value - значение для кэширования
     * @param maxSize - максимальный размер кэша
     */
    private setCacheValue<T>(
        cache: Map<string, { value: T; timestamp: number }>,
        key: string,
        value: T,
        maxSize: number,
    ): void {
        // Очищаем устаревшие записи и освобождаем место при достижении лимита
        if (cache.size >= maxSize) {
            // Удаляем самую старую запись (первую в Map)
            const firstKey = cache.keys().next().value;
            if (firstKey !== undefined) {
                cache.delete(firstKey);
            }
        }

        // Сохраняем значение с текущим timestamp
        cache.set(key, {
            value,
            timestamp: Date.now(),
        });
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
