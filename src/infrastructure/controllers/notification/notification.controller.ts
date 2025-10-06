import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
    DefaultValuePipe,
    ParseIntPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiQuery,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@app/infrastructure/common/guards/auth.guard';
import { RoleGuard } from '@app/infrastructure/common/guards/role.guard';
import { Roles } from '@app/infrastructure/common/decorators/roles-auth.decorator';
import { Req } from '@nestjs/common';
import { Request } from 'express';
import {
    NOTIFICATION_ACCESS_LEVELS,
    PLATFORM_ROLES,
    TENANT_ADMIN_ROLES,
} from './notification-roles.constants';
import { NotificationService } from '@app/infrastructure/services/notification/notification.service';
import { NotificationType, NotificationStatus } from '@app/domain/models';
import { NotificationFilters } from '@app/domain/services';

interface AuthenticatedRequest extends Request {
    user: { id: number };
}

/**
 * Контроллер уведомлений с полной системой ролей и тенантской изоляцией
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
    constructor(private readonly notificationService: NotificationService) {}

    /**
     * Получить уведомления пользователя
     * Доступ: CUSTOMER_ROLES, STAFF_ROLES, MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.NOTIFICATION_VIEW)
    @ApiOperation({
        summary: 'Получить уведомления пользователя',
        description:
            'Возвращает список уведомлений с пагинацией. Клиенты видят только свои уведомления, администраторы - все уведомления тенанта.',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        description: 'Номер страницы',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Количество элементов на странице',
        example: 20,
    })
    @ApiQuery({
        name: 'status',
        required: false,
        description: 'Фильтр по статусу',
        example: 'unread',
    })
    @ApiQuery({
        name: 'type',
        required: false,
        description: 'Фильтр по типу',
        example: 'email',
    })
    @ApiResponse({
        status: 200,
        description: 'Уведомления получены успешно',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'number', example: 1 },
                            type: { type: 'string', example: 'email' },
                            title: {
                                type: 'string',
                                example: 'Заказ подтвержден',
                            },
                            message: {
                                type: 'string',
                                example: 'Ваш заказ #12345 подтвержден',
                            },
                            status: { type: 'string', example: 'sent' },
                            createdAt: { type: 'string', format: 'date-time' },
                        },
                    },
                },
                meta: {
                    type: 'object',
                    properties: {
                        totalCount: { type: 'number', example: 100 },
                        currentPage: { type: 'number', example: 1 },
                        lastPage: { type: 'number', example: 5 },
                        limit: { type: 'number', example: 20 },
                    },
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Не авторизован' })
    @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
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
        const filters: NotificationFilters = {
            userId: req.user.id,
            page,
            limit,
        };

        if (status) {
            filters.status = status as NotificationStatus;
        }

        if (type) {
            filters.type = type as NotificationType;
        }

        const result = await this.notificationService.getNotifications(filters);
        return {
            data: result.data,
            meta: {
                totalCount: result.meta.totalCount as number,
                currentPage: result.meta.currentPage as number,
                lastPage: result.meta.lastPage as number,
                limit: result.meta.limit as number,
            },
        };
    }

    /**
     * Получить количество непрочитанных уведомлений
     * Доступ: CUSTOMER_ROLES, STAFF_ROLES, MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @Get('unread-count')
    @HttpCode(HttpStatus.OK)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.NOTIFICATION_VIEW)
    @ApiOperation({
        summary: 'Получить количество непрочитанных уведомлений',
        description:
            'Возвращает количество непрочитанных уведомлений для пользователя',
    })
    @ApiResponse({
        status: 200,
        description: 'Количество непрочитанных уведомлений',
        schema: {
            type: 'object',
            properties: {
                count: { type: 'number', example: 5 },
            },
        },
    })
    async getUnreadCount(
        @Req() req: AuthenticatedRequest,
    ): Promise<{ count: number }> {
        const count = await this.notificationService.getUnreadCount(
            req.user.id,
        );
        return { count };
    }

    /**
     * Отметить уведомление как прочитанное
     * Доступ: CUSTOMER_ROLES, STAFF_ROLES, MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @Put(':id/read')
    @HttpCode(HttpStatus.OK)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.NOTIFICATION_VIEW)
    @ApiOperation({
        summary: 'Отметить уведомление как прочитанное',
        description:
            'Отмечает уведомление как прочитанное. Клиенты могут отмечать только свои уведомления.',
    })
    @ApiParam({ name: 'id', description: 'ID уведомления', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Уведомление отмечено как прочитанное',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Уведомление отмечено как прочитанное',
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Уведомление не найдено' })
    async markAsRead(
        @Param('id', ParseIntPipe) notificationId: number,
        @Req() req: AuthenticatedRequest,
    ): Promise<{ message: string }> {
        await this.notificationService.markAsRead(notificationId, req.user.id);
        return { message: 'Уведомление отмечено как прочитанное' };
    }

    /**
     * Получить настройки уведомлений пользователя
     * Доступ: CUSTOMER_ROLES, STAFF_ROLES, MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @Get('settings')
    @HttpCode(HttpStatus.OK)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.NOTIFICATION_VIEW)
    @ApiOperation({
        summary: 'Получить настройки уведомлений пользователя',
        description: 'Возвращает настройки уведомлений для пользователя',
    })
    @ApiResponse({
        status: 200,
        description: 'Настройки уведомлений получены',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'number', example: 1 },
                userId: { type: 'number', example: 123 },
                emailEnabled: { type: 'boolean', example: true },
                pushEnabled: { type: 'boolean', example: true },
                orderUpdates: { type: 'boolean', example: true },
                marketing: { type: 'boolean', example: false },
            },
        },
    })
    async getUserSettings(@Req() req: AuthenticatedRequest): Promise<{
        id: number;
        userId: number;
        emailEnabled: boolean;
        pushEnabled: boolean;
        orderUpdates: boolean;
        marketing: boolean;
    }> {
        // TODO: Реализовать после создания NotificationSettingsService
        // return this.notificationService.getUserSettings(req.user.id);

        return {
            id: 1,
            userId: req.user.id,
            emailEnabled: true,
            pushEnabled: true,
            orderUpdates: true,
            marketing: false,
        };
    }

    /**
     * Обновить настройки уведомлений пользователя
     * Доступ: CUSTOMER_ROLES, STAFF_ROLES, MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @Put('settings')
    @HttpCode(HttpStatus.OK)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.NOTIFICATION_VIEW)
    @ApiOperation({
        summary: 'Обновить настройки уведомлений пользователя',
        description: 'Обновляет настройки уведомлений для пользователя',
    })
    @ApiResponse({
        status: 200,
        description: 'Настройки уведомлений обновлены',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'number', example: 1 },
                userId: { type: 'number', example: 123 },
                emailEnabled: { type: 'boolean', example: true },
                pushEnabled: { type: 'boolean', example: false },
                orderUpdates: { type: 'boolean', example: true },
                marketing: { type: 'boolean', example: true },
            },
        },
    })
    async updateUserSettings(
        @Body()
        updateSettingsDto: {
            emailEnabled?: boolean;
            pushEnabled?: boolean;
            orderUpdates?: boolean;
            marketing?: boolean;
        },
        @Req() req: AuthenticatedRequest,
    ): Promise<{
        id: number;
        userId: number;
        emailEnabled: boolean;
        pushEnabled: boolean;
        orderUpdates: boolean;
        marketing: boolean;
    }> {
        // TODO: Реализовать после создания NotificationSettingsService
        // return this.notificationService.updateUserSettings(req.user.id, updateSettingsDto);

        return {
            id: 1,
            userId: req.user.id,
            emailEnabled: updateSettingsDto.emailEnabled ?? true,
            pushEnabled: updateSettingsDto.pushEnabled ?? true,
            orderUpdates: updateSettingsDto.orderUpdates ?? true,
            marketing: updateSettingsDto.marketing ?? false,
        };
    }

    /**
     * Получить шаблоны уведомлений
     * Доступ: MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @Get('templates')
    @HttpCode(HttpStatus.OK)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.TEMPLATE_MANAGEMENT)
    @ApiOperation({
        summary: 'Получить шаблоны уведомлений',
        description:
            'Возвращает список шаблонов уведомлений. Доступно только менеджерам и администраторам.',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        description: 'Номер страницы',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Количество элементов на странице',
        example: 20,
    })
    @ApiQuery({
        name: 'type',
        required: false,
        description: 'Фильтр по типу шаблона',
        example: 'email',
    })
    @ApiResponse({
        status: 200,
        description: 'Шаблоны уведомлений получены',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'number', example: 1 },
                            name: {
                                type: 'string',
                                example: 'order_confirmation',
                            },
                            type: { type: 'string', example: 'email' },
                            title: {
                                type: 'string',
                                example: 'Заказ подтвержден',
                            },
                            isActive: { type: 'boolean', example: true },
                        },
                    },
                },
                meta: {
                    type: 'object',
                    properties: {
                        totalCount: { type: 'number', example: 10 },
                        currentPage: { type: 'number', example: 1 },
                        lastPage: { type: 'number', example: 1 },
                        limit: { type: 'number', example: 20 },
                    },
                },
            },
        },
    })
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
        const templates = await this.notificationService.getTemplates({
            type: type as NotificationType,
            isActive: true,
        });

        // Простая пагинация для шаблонов
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTemplates = templates.slice(startIndex, endIndex);

        return {
            data: paginatedTemplates,
            meta: {
                totalCount: templates.length,
                currentPage: page,
                lastPage: Math.ceil(templates.length / limit),
                limit,
            },
        };
    }

    /**
     * Создать шаблон уведомления
     * Доступ: MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @Post('templates')
    @HttpCode(HttpStatus.CREATED)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.TEMPLATE_MANAGEMENT)
    @ApiOperation({
        summary: 'Создать шаблон уведомления',
        description:
            'Создает новый шаблон уведомления. Доступно только менеджерам и администраторам.',
    })
    @ApiResponse({
        status: 201,
        description: 'Шаблон уведомления создан',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'order_confirmation' },
                type: { type: 'string', example: 'email' },
                title: { type: 'string', example: 'Заказ подтвержден' },
                message: {
                    type: 'string',
                    example: 'Ваш заказ #{{orderNumber}} подтвержден',
                },
                isActive: { type: 'boolean', example: true },
            },
        },
    })
    async createTemplate(
        @Body()
        createTemplateDto: {
            name: string;
            type: string;
            title: string;
            message: string;
        },
        @Req() _req: AuthenticatedRequest, // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<{
        id: number;
        name: string;
        type: string;
        title: string;
        message: string;
        isActive: boolean;
    }> {
        const template = await this.notificationService.createTemplate({
            name: createTemplateDto.name,
            type: createTemplateDto.type as NotificationType,
            title: createTemplateDto.title,
            message: createTemplateDto.message,
            isActive: true,
        });

        return {
            id: template.id,
            name: template.name,
            type: template.type,
            title: template.title,
            message: template.message,
            isActive: template.isActive,
        };
    }

    /**
     * Обновить шаблон уведомления
     * Доступ: MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @Put('templates/:id')
    @HttpCode(HttpStatus.OK)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.TEMPLATE_MANAGEMENT)
    @ApiOperation({
        summary: 'Обновить шаблон уведомления',
        description:
            'Обновляет существующий шаблон уведомления. Доступно только менеджерам и администраторам.',
    })
    @ApiParam({ name: 'id', description: 'ID шаблона', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Шаблон уведомления обновлен',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'number', example: 1 },
                name: { type: 'string', example: 'order_confirmation' },
                type: { type: 'string', example: 'email' },
                title: { type: 'string', example: 'Заказ подтвержден' },
                message: {
                    type: 'string',
                    example: 'Ваш заказ #{{orderNumber}} подтвержден',
                },
                isActive: { type: 'boolean', example: true },
            },
        },
    })
    async updateTemplate(
        @Param('id', ParseIntPipe) templateId: number,
        @Body()
        updateTemplateDto: {
            name?: string;
            type?: string;
            title?: string;
            message?: string;
            isActive?: boolean;
        },
        @Req() _req: AuthenticatedRequest, // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<{
        id: number;
        name: string;
        type: string;
        title: string;
        message: string;
        isActive: boolean;
    }> {
        const updateData: Record<string, unknown> = {};
        if (updateTemplateDto.name) updateData.name = updateTemplateDto.name;
        if (updateTemplateDto.type)
            updateData.type = updateTemplateDto.type as NotificationType;
        if (updateTemplateDto.title) updateData.title = updateTemplateDto.title;
        if (updateTemplateDto.message)
            updateData.message = updateTemplateDto.message;
        if (updateTemplateDto.isActive !== undefined)
            updateData.isActive = updateTemplateDto.isActive;

        const template = await this.notificationService.updateTemplate(
            templateId,
            updateData,
        );

        return {
            id: template.id,
            name: template.name,
            type: template.type,
            title: template.title,
            message: template.message,
            isActive: template.isActive,
        };
    }

    /**
     * Удалить шаблон уведомления
     * Доступ: TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @Delete('templates/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(...TENANT_ADMIN_ROLES, ...PLATFORM_ROLES)
    @ApiOperation({
        summary: 'Удалить шаблон уведомления',
        description:
            'Удаляет шаблон уведомления. Доступно только администраторам тенанта и платформы.',
    })
    @ApiParam({ name: 'id', description: 'ID шаблона', example: 1 })
    @ApiResponse({ status: 204, description: 'Шаблон уведомления удален' })
    @ApiResponse({ status: 404, description: 'Шаблон не найден' })
    async deleteTemplate(
        @Param('id', ParseIntPipe) templateId: number,
        @Req() _req: AuthenticatedRequest, // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<void> {
        await this.notificationService.deleteTemplate(templateId);
    }

    /**
     * Получить статистику уведомлений
     * Доступ: STAFF_ROLES, MANAGER_ROLES, TENANT_ADMIN_ROLES, PLATFORM_ROLES
     */
    @Get('statistics')
    @HttpCode(HttpStatus.OK)
    @Roles(...NOTIFICATION_ACCESS_LEVELS.STATISTICS_VIEW)
    @ApiOperation({
        summary: 'Получить статистику уведомлений',
        description:
            'Возвращает статистику по уведомлениям. Доступно персоналу, менеджерам и администраторам.',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        description: 'Период статистики',
        example: '7d',
    })
    @ApiQuery({
        name: 'type',
        required: false,
        description: 'Тип уведомлений',
        example: 'email',
    })
    @ApiResponse({
        status: 200,
        description: 'Статистика уведомлений получена',
        schema: {
            type: 'object',
            properties: {
                totalSent: { type: 'number', example: 1000 },
                totalDelivered: { type: 'number', example: 950 },
                totalRead: { type: 'number', example: 800 },
                deliveryRate: { type: 'number', example: 95.0 },
                readRate: { type: 'number', example: 84.2 },
                byType: {
                    type: 'object',
                    properties: {
                        email: { type: 'number', example: 800 },
                        push: { type: 'number', example: 200 },
                    },
                },
                byStatus: {
                    type: 'object',
                    properties: {
                        sent: { type: 'number', example: 1000 },
                        delivered: { type: 'number', example: 950 },
                        read: { type: 'number', example: 800 },
                        failed: { type: 'number', example: 50 },
                    },
                },
            },
        },
    })
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
        return this.notificationService.getStatistics(
            req.user.id,
            period,
            type as NotificationType,
        );
    }
}
