import { NotificationStatus, NotificationType } from '@app/domain/models';
import { NotificationFilters } from '@app/domain/services';
import { Roles } from '@app/infrastructure/common/decorators/roles-auth.decorator';
import {
    CreateTemplateSwaggerDecorator,
    DeleteTemplateSwaggerDecorator,
    GetStatisticsSwaggerDecorator,
    GetTemplatesSwaggerDecorator,
    GetUnreadCountSwaggerDecorator,
    GetUserNotificationsSwaggerDecorator,
    GetUserSettingsSwaggerDecorator,
    MarkAsReadSwaggerDecorator,
    UpdateTemplateSwaggerDecorator,
    UpdateUserSettingsSwaggerDecorator,
} from '@app/infrastructure/common/decorators/swagger/notification';
import { AuthGuard } from '@app/infrastructure/common/guards/auth.guard';
import { RoleGuard } from '@app/infrastructure/common/guards/role.guard';
import {
    CreateTemplateDto,
    UpdateSettingsDto,
    UpdateTemplateDto,
} from '@app/infrastructure/dto/notification';
import { UserNotificationSettingsResponse } from '@app/infrastructure/responses/notification/user-notification-settings.response';
import { NotificationService } from '@app/infrastructure/services/notification/notification.service';
import {
    BadRequestException,
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
    CUSTOMER_ROLES,
    NOTIFICATION_ACCESS_LEVELS,
    PLATFORM_ROLES,
    TENANT_ADMIN_ROLES,
} from './notification-roles.constants';

interface AuthenticatedRequest extends Request {
    user: { id: number; role?: string };
}

/**
 * Контроллер уведомлений с полной системой ролей и тенантской изоляцией
 *
 * Оптимизировано для производительности:
 * - Кэширование часто запрашиваемых данных
 * - Оптимизированная валидация ролей
 * - Минимизация аллокаций памяти
 * - Параллельная обработка запросов
 *
 * Роли и доступ:
 * - PLATFORM_ROLES: полный доступ ко всем уведомлениям платформы
 * - TENANT_ADMIN_ROLES: управление уведомлениями тенанта
 * - MANAGER_ROLES: управление шаблонами и настройками
 * - STAFF_ROLES: просмотр статистики и обслуживание
 * - CUSTOMER_ROLES: управление своими уведомлениями
 */
@ApiTags('Уведомления')
@Controller('notifications')
@UseGuards(AuthGuard, RoleGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
    private readonly logger = new Logger(NotificationController.name);

    // Кэш для часто запрашиваемых данных
    private readonly cache = new Map<
        string,
        { data: unknown; timestamp: number }
    >();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 минут
    private readonly MAX_CACHE_SIZE = 100; // Максимальный размер кэша
    private readonly DEFAULT_PAGE = 1;
    private readonly DEFAULT_LIMIT = 20;
    private readonly MAX_LIMIT = 100;

    constructor(private readonly notificationService: NotificationService) {}

    /**
     * Получить данные из кэша или выполнить функцию
     * Автоматически очищает старые записи при превышении MAX_CACHE_SIZE
     */
    private async getCachedData<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl: number = this.CACHE_TTL,
    ): Promise<T> {
        const cached = this.cache.get(key);
        const now = Date.now();

        if (cached && now - cached.timestamp < ttl) {
            return cached.data as T;
        }

        const data = await fetcher();
        this.setCacheValue(key, data, now);
        return data;
    }

    /**
     * Установить значение в кэш с автоматической очисткой при превышении размера
     */
    private setCacheValue(
        key: string,
        data: unknown,
        timestamp: number = Date.now(),
    ): void {
        // Если достигнут лимит, удаляем самые старые записи (простой LRU)
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const entries = Array.from(this.cache.entries());
            // Сортируем по timestamp и удаляем 10% самых старых
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toDelete = Math.ceil(this.MAX_CACHE_SIZE * 0.1);
            for (let i = 0; i < toDelete; i++) {
                this.cache.delete(entries[i][0]);
            }
        }

        this.cache.set(key, { data, timestamp });
    }

    /**
     * Очистить кэш
     */
    private clearCache(pattern?: string): void {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    /**
     * Получить уведомления пользователя
     * Доступ: CUSTOMER_ROLES (только свои уведомления)
     */
    @GetUserNotificationsSwaggerDecorator()
    @Get()
    @HttpCode(HttpStatus.OK)
    @Roles(...CUSTOMER_ROLES)
    async getUserNotifications(
        @Req() req: AuthenticatedRequest,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('status') status?: string,
        @Query('type') type?: string,
    ): Promise<{
        data: unknown[];
        meta: {
            totalCount: number;
            currentPage: number;
            lastPage: number;
            limit: number;
        };
    }> {
        const startTime = Date.now();

        try {
            // Валидация через enum для status и type
            let validatedStatus: NotificationStatus | undefined;
            if (status) {
                if (
                    !Object.values(NotificationStatus).includes(
                        status as NotificationStatus,
                    )
                ) {
                    throw new BadRequestException(
                        'Некорректный статус уведомления',
                    );
                }
                validatedStatus = status as NotificationStatus;
            }

            let validatedType: NotificationType | undefined;
            if (type) {
                if (
                    !Object.values(NotificationType).includes(
                        type as NotificationType,
                    )
                ) {
                    throw new BadRequestException(
                        'Некорректный тип уведомления',
                    );
                }
                validatedType = type as NotificationType;
            }

            // Валидация параметров пагинации
            if (page < 1 || limit < 1 || limit > this.MAX_LIMIT) {
                throw new BadRequestException(
                    `Некорректные параметры пагинации: page и limit должны быть >= 1, limit <= ${this.MAX_LIMIT}`,
                );
            }

            const filters: NotificationFilters = {
                userId: req.user.id,
                page,
                limit,
            };

            if (validatedStatus) {
                filters.status = validatedStatus;
            }

            if (validatedType) {
                filters.type = validatedType;
            }

            // Без кэширования — важно для тестов ошибок/валидации
            const result =
                await this.notificationService.getNotifications(filters);

            const endTime = Date.now();
            this.logger.log(
                `getUserNotifications completed in ${endTime - startTime}ms for user ${req.user.id}`,
            );

            return {
                data: result.data,
                meta: {
                    totalCount: result.meta.totalCount as number,
                    currentPage: result.meta.currentPage as number,
                    lastPage: result.meta.lastPage as number,
                    limit: result.meta.limit as number,
                },
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Error in getUserNotifications for user ${req.user.id}: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }

    /**
     * Получить количество непрочитанных уведомлений
     * Доступ: CUSTOMER_ROLES
     */
    @GetUnreadCountSwaggerDecorator()
    @Get('unread-count')
    @HttpCode(HttpStatus.OK)
    @Roles(...CUSTOMER_ROLES)
    async getUnreadCount(
        @Req() req: AuthenticatedRequest,
    ): Promise<{ count: number }> {
        const startTime = Date.now();

        try {
            // Кэширование для счетчика непрочитанных
            const cacheKey = `unread-count:${req.user.id}`;
            const UNREAD_COUNT_TTL = 60 * 1000; // 1 минута TTL для счетчика

            const count = await this.getCachedData(
                cacheKey,
                async () => {
                    return await this.notificationService.getUnreadCount(
                        req.user.id,
                    );
                },
                UNREAD_COUNT_TTL,
            );

            const endTime = Date.now();
            this.logger.log(
                `getUnreadCount completed in ${endTime - startTime}ms for user ${req.user.id}`,
            );

            return { count };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Error in getUnreadCount for user ${req.user.id}: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }

    /**
     * Отметить уведомление как прочитанное
     * Доступ: CUSTOMER_ROLES (только свои уведомления)
     */
    @MarkAsReadSwaggerDecorator()
    @Put(':id/read')
    @HttpCode(HttpStatus.OK)
    @Roles(...CUSTOMER_ROLES)
    async markAsRead(
        @Param('id', ParseIntPipe) notificationId: number,
        @Req() req: AuthenticatedRequest,
    ): Promise<{ message: string }> {
        const startTime = Date.now();

        try {
            await this.notificationService.markAsRead(
                notificationId,
                req.user.id,
            );

            // Очищаем кэш для пользователя после изменения
            this.clearCache(`notifications:${req.user.id}`);
            this.clearCache(`unread-count:${req.user.id}`);

            const endTime = Date.now();
            this.logger.log(
                `markAsRead completed in ${endTime - startTime}ms for user ${req.user.id}, notification ${notificationId}`,
            );

            return { message: 'Уведомление отмечено как прочитанное' };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Error in markAsRead for user ${req.user.id}, notification ${notificationId}: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }

    /**
     * Получить настройки уведомлений пользователя
     * Доступ: CUSTOMER_ROLES
     */
    @GetUserSettingsSwaggerDecorator()
    @Get('settings')
    @HttpCode(HttpStatus.OK)
    @Roles(...CUSTOMER_ROLES)
    async getUserSettings(
        @Req() req: AuthenticatedRequest,
    ): Promise<UserNotificationSettingsResponse> {
        try {
            // Кэшируем настройки на 30 секунд для снижения нагрузки на БД
            const settings = await this.getCachedData(
                `settings:${req.user.id}`,
                () => this.notificationService.getUserSettings(req.user.id),
                30_000, // 30 секунд
            );

            return {
                id: settings.id,
                userId: settings.userId,
                emailEnabled: settings.emailEnabled,
                pushEnabled: settings.pushEnabled,
                orderUpdates: settings.orderUpdates,
                marketing: settings.marketing,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Error in getUserSettings for user ${req.user.id}: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }

    /**
     * Обновить настройки уведомлений пользователя
     * Доступ: CUSTOMER_ROLES
     */
    @UpdateUserSettingsSwaggerDecorator()
    @Put('settings')
    @HttpCode(HttpStatus.OK)
    @Roles(...CUSTOMER_ROLES)
    async updateUserSettings(
        @Body() updateSettingsDto: UpdateSettingsDto,
        @Req() req: AuthenticatedRequest,
    ): Promise<UserNotificationSettingsResponse> {
        try {
            const settings = await this.notificationService.updateUserSettings(
                req.user.id,
                updateSettingsDto,
            );

            // Инвалидируем кэш настроек после обновления
            this.clearCache(`settings:${req.user.id}`);

            return {
                id: settings.id,
                userId: settings.userId,
                emailEnabled: settings.emailEnabled,
                pushEnabled: settings.pushEnabled,
                orderUpdates: settings.orderUpdates,
                marketing: settings.marketing,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Error in updateUserSettings for user ${req.user.id}: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }

    /**
     * Получить шаблоны уведомлений
     * Доступ: MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @GetTemplatesSwaggerDecorator()
    @Get('templates')
    @HttpCode(HttpStatus.OK)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.TEMPLATE_MANAGEMENT)
    async getTemplates(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('type') type?: string,
    ): Promise<{
        data: unknown[];
        meta: {
            totalCount: number;
            currentPage: number;
            lastPage: number;
            limit: number;
        };
    }> {
        const startTime = Date.now();

        try {
            // Валидация параметров пагинации
            if (page < 1 || limit < 1 || limit > this.MAX_LIMIT) {
                throw new BadRequestException(
                    `Некорректные параметры пагинации: page и limit должны быть >= 1, limit <= ${this.MAX_LIMIT}`,
                );
            }

            // Валидация типа через enum
            let validatedType: NotificationType | undefined;
            if (type) {
                if (
                    !Object.values(NotificationType).includes(
                        type as NotificationType,
                    )
                ) {
                    throw new BadRequestException('Некорректный тип шаблона');
                }
                validatedType = type as NotificationType;
            }

            const templates = await this.notificationService.getTemplates({
                type: validatedType,
                isActive: true,
            });

            // Пагинация на уровне контроллера (временное решение)
            // TODO: Переместить пагинацию в сервис для оптимизации
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedTemplates = templates.slice(startIndex, endIndex);

            const result = {
                data: paginatedTemplates,
                meta: {
                    totalCount: templates.length,
                    currentPage: page,
                    lastPage: Math.ceil(templates.length / limit),
                    limit,
                },
            };

            const endTime = Date.now();
            this.logger.log(
                `getTemplates completed in ${endTime - startTime}ms`,
            );

            return result;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Error in getTemplates: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }

    /**
     * Создать шаблон уведомления
     * Доступ: MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @CreateTemplateSwaggerDecorator()
    @Post('templates')
    @HttpCode(HttpStatus.CREATED)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.TEMPLATE_MANAGEMENT)
    async createTemplate(
        @Body() createTemplateDto: CreateTemplateDto,
        @Req() _req: AuthenticatedRequest, // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<{
        id: number;
        name: string;
        type: string;
        title: string;
        message: string;
        isActive: boolean;
    }> {
        const startTime = Date.now();

        try {
            const template = await this.notificationService.createTemplate({
                name: createTemplateDto.name,
                type: createTemplateDto.type,
                title: createTemplateDto.title,
                message: createTemplateDto.message,
                isActive: true,
            });

            // Очищаем кэш шаблонов после создания
            this.clearCache('templates');

            const endTime = Date.now();
            this.logger.log(
                `createTemplate completed in ${endTime - startTime}ms for template ${template.name}`,
            );

            return {
                id: template.id,
                name: template.name,
                type: template.type,
                title: template.title,
                message: template.message,
                isActive: template.isActive,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Error in createTemplate: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }

    /**
     * Обновить шаблон уведомления
     * Доступ: MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @UpdateTemplateSwaggerDecorator()
    @Put('templates/:id')
    @HttpCode(HttpStatus.OK)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.TEMPLATE_MANAGEMENT)
    async updateTemplate(
        @Param('id', ParseIntPipe) templateId: number,
        @Body() updateTemplateDto: UpdateTemplateDto,
        @Req() _req: AuthenticatedRequest, // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<{
        id: number;
        name: string;
        type: string;
        title: string;
        message: string;
        isActive: boolean;
    }> {
        const startTime = Date.now();

        try {
            // Подготовка данных для обновления
            const updateData: Record<string, unknown> = {};
            if (updateTemplateDto.name !== undefined)
                updateData.name = updateTemplateDto.name;
            if (updateTemplateDto.type !== undefined)
                updateData.type = updateTemplateDto.type;
            if (updateTemplateDto.title !== undefined)
                updateData.title = updateTemplateDto.title;
            if (updateTemplateDto.message !== undefined)
                updateData.message = updateTemplateDto.message;
            if (updateTemplateDto.isActive !== undefined)
                updateData.isActive = updateTemplateDto.isActive;

            // Проверяем, есть ли данные для обновления
            if (Object.keys(updateData).length === 0) {
                throw new BadRequestException('Нет данных для обновления');
            }

            const template = await this.notificationService.updateTemplate(
                templateId,
                updateData,
            );

            // Очищаем кэш шаблонов после обновления
            this.clearCache('templates');

            const endTime = Date.now();
            this.logger.log(
                `updateTemplate completed in ${endTime - startTime}ms for template ${templateId}`,
            );

            return {
                id: template.id,
                name: template.name,
                type: template.type,
                title: template.title,
                message: template.message,
                isActive: template.isActive,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Error in updateTemplate for template ${templateId}: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }

    /**
     * Удалить шаблон уведомления
     * Доступ: TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @DeleteTemplateSwaggerDecorator()
    @Delete('templates/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(...TENANT_ADMIN_ROLES, ...PLATFORM_ROLES)
    async deleteTemplate(
        @Param('id', ParseIntPipe) templateId: number,
        @Req() _req: AuthenticatedRequest, // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<void> {
        const startTime = Date.now();

        try {
            // Проверяем существование шаблона перед удалением
            const template =
                await this.notificationService.getTemplateById(templateId);
            if (!template) {
                throw new NotFoundException('Шаблон не найден');
            }

            await this.notificationService.deleteTemplate(templateId);

            // Очищаем кэш шаблонов после удаления
            this.clearCache('templates');

            const endTime = Date.now();
            this.logger.log(
                `deleteTemplate completed in ${endTime - startTime}ms for template ${templateId}`,
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Error in deleteTemplate for template ${templateId}: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }

    /**
     * Получить статистику уведомлений
     * Доступ: STAFF_ROLES, MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @GetStatisticsSwaggerDecorator()
    @Get('statistics')
    @HttpCode(HttpStatus.OK)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.STATISTICS_VIEW)
    async getStatistics(
        @Req() req: AuthenticatedRequest,
        @Query('period') period?: string,
        @Query('type') type?: string,
    ): Promise<{
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
    }> {
        const startTime = Date.now();

        try {
            // Валидация типа через enum
            let validatedType: NotificationType | undefined;
            if (type) {
                if (
                    !Object.values(NotificationType).includes(
                        type as NotificationType,
                    )
                ) {
                    throw new BadRequestException(
                        'Некорректный тип уведомления',
                    );
                }
                validatedType = type as NotificationType;
            }

            // Кэширование для статистики
            const cacheKey = `statistics:${req.user.id}:${period ?? 'default'}:${validatedType ?? 'all'}`;
            const STATISTICS_TTL = 10 * 60 * 1000; // 10 минут TTL для статистики

            const result = await this.getCachedData(
                cacheKey,
                async () => {
                    return await this.notificationService.getStatistics(
                        req.user.id,
                        period,
                        validatedType,
                    );
                },
                STATISTICS_TTL,
            );

            const endTime = Date.now();
            this.logger.log(
                `getStatistics completed in ${endTime - startTime}ms for user ${req.user.id}`,
            );

            return result;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Error in getStatistics for user ${req.user.id}: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }
}
