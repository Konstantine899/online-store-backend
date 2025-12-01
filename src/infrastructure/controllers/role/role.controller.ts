import {
    BadRequestException,
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { AuditLogModel } from '@app/domain/models';
import { IDecodedAccessToken } from '@app/domain/jwt';
import {
    CreateRoleSwaggerDecorator,
    DeleteRoleSwaggerDecorator,
    GetListRoleSwaggerDecorator,
    GetRoleSwaggerDecorator,
    Roles,
    UpdateRoleSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { AuthGuard, RoleGuard } from '@app/infrastructure/common/guards';
import { PerformanceMonitoringInterceptor } from '@app/infrastructure/common/interceptors/performance-monitoring.interceptor';
import {
    AuditFiltersDto,
    AssignPermissionDto,
    AssignRoleDto,
    CreateRoleDto,
    RevokePermissionDto,
    RevokeRoleDto,
    UpdateRoleDto,
} from '@app/infrastructure/dto';
import {
    AuditLogResponse,
    AuditSummaryResponse,
    AuditTimelineResponse,
    PaginatedAuditLogsResponse,
    UserActivityReportResponse,
    AssignPermissionResponse,
    AssignRoleResponse,
    CreateRoleResponse,
    DeleteRoleResponse,
    GetListRoleResponse,
    GetRoleHierarchyResponse,
    GetRoleLevelResponse,
    GetRolePermissionsResponse,
    GetRoleResponse,
    GetUserRolesResponse,
    RevokePermissionResponse,
    RevokeRoleResponse,
    UpdateRoleResponse,
    mapAuditLogToResponse,
} from '@app/infrastructure/responses';
import { CSVExporter } from '@app/infrastructure/common/utils/export/csv-exporter';
import {
    AuditService,
    RoleAuditService,
    RoleCacheService,
    RoleService,
} from '@app/infrastructure/services';

import { IRoleController } from '@app/domain/controllers';
import { ADMIN_ROLES, MANAGER_ROLES } from './role-constants';

/**
 * Контроллер управления ролями
 *
 * Реализует полную систему управления ролями с иерархией:
 * - Управление ролями (CRUD): ADMIN_ROLES
 * - Управление разрешениями: ADMIN_ROLES
 * - Назначение ролей пользователям: MANAGER_ROLES
 * - Просмотр ролей и разрешений: MANAGER_ROLES
 *
 * Tenant isolation: все операции с тенантскими ролями изолированы по tenantId из JWT
 */
@ApiTags('Роль')
@ApiBearerAuth('JWT-auth')
@Controller('role')
@UseInterceptors(PerformanceMonitoringInterceptor)
export class RoleController implements IRoleController {
    constructor(
        private readonly roleService: RoleService,
        private readonly roleCacheService: RoleCacheService,
        private readonly auditService: AuditService,
        private readonly roleAuditService: RoleAuditService,
        private readonly performanceInterceptor: PerformanceMonitoringInterceptor,
    ) {}

    // ========================================================================
    // CRUD ОПЕРАЦИИ С РОЛЯМИ (ADMIN_ROLES)
    // ========================================================================

    /**
     * Создать новую роль
     * @access ADMIN_ROLES
     */
    @CreateRoleSwaggerDecorator()
    @HttpCode(201)
    @Roles(...ADMIN_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/create')
    public async createRole(
        @Body() dto: CreateRoleDto,
        @Req() request: Request,
    ): Promise<CreateRoleResponse> {
        const tenantId =
            (request.user as IDecodedAccessToken)?.tenantId ?? null;
        const userId = (request.user as IDecodedAccessToken)?.id;
        const ipAddress = request.ip;
        const userAgent = request.headers['user-agent'];
        const requestId = request.headers['x-request-id'] as string;

        return this.roleService.createRole(dto, tenantId, {
            userId,
            ipAddress,
            userAgent,
            requestId,
        });
    }

    /**
     * Получить информацию о роли
     * @access ADMIN_ROLES
     * @tenant_isolation YES - можно получить только роли своего тенанта + системные
     */
    @GetRoleSwaggerDecorator()
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/one/:role')
    public async getRole(
        @Param('role') role: string,
        @Req() request: Request,
    ): Promise<GetRoleResponse> {
        const tenantId =
            (request.user as IDecodedAccessToken)?.tenantId ?? null;
        return this.roleService.getRole(role, tenantId);
    }

    /**
     * Получить список всех ролей
     * @access ADMIN_ROLES
     * @tenant_isolation YES - возвращает только роли своего тенанта + системные
     */
    @GetListRoleSwaggerDecorator()
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/list')
    public async getListRole(
        @Req() request: Request,
    ): Promise<GetListRoleResponse[]> {
        const tenantId =
            (request.user as IDecodedAccessToken)?.tenantId ?? null;
        return this.roleService.getListRole(tenantId);
    }

    /**
     * Обновить роль
     * @access ADMIN_ROLES
     * @tenant_isolation YES - нельзя обновлять роли других тенантов
     */
    @UpdateRoleSwaggerDecorator()
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Patch('/:id')
    public async updateRole(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateRoleDto,
        @Req() request: Request,
    ): Promise<UpdateRoleResponse> {
        const tenantId =
            (request.user as IDecodedAccessToken)?.tenantId ?? null;
        const userId = (request.user as IDecodedAccessToken)?.id;
        const ipAddress = request.ip;
        const userAgent = request.headers['user-agent'];
        const requestId = request.headers['x-request-id'] as string;

        return this.roleService.updateRole(id, dto, tenantId, {
            userId,
            ipAddress,
            userAgent,
            requestId,
        });
    }

    // ========================================================================
    // НАЗНАЧЕНИЕ И ОТЗЫВ РОЛЕЙ У ПОЛЬЗОВАТЕЛЕЙ (MANAGER_ROLES)
    // ========================================================================
    // ВАЖНО: Эти роуты должны быть ВЫШЕ /:id, чтобы /revoke не матчился как /:id

    /**
     * Назначить роль пользователю
     * @access MANAGER_ROLES
     * @tenant_isolation YES - нельзя назначать роли пользователям из других тенантов
     */
    @HttpCode(201)
    @Roles(...MANAGER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/assign')
    public async assignRoleToUser(
        @Body() dto: AssignRoleDto,
        @Req() request: Request,
    ): Promise<AssignRoleResponse> {
        const user = request.user as IDecodedAccessToken;
        const tenantId = user?.tenantId ?? null;
        const userRoles = (user?.roles ?? []).map((role) => role.role);
        const userId = user?.id;
        const ipAddress = request.ip;
        const userAgent = request.headers['user-agent'];
        const requestId = request.headers['x-request-id'] as string;

        return this.roleService.assignRoleToUser(dto, tenantId, userRoles, {
            userId,
            ipAddress,
            userAgent,
            requestId,
        });
    }

    /**
     * Отозвать роль у пользователя
     * @access MANAGER_ROLES
     * @tenant_isolation YES - нельзя отзывать роли у пользователям из других тенантов
     */
    @HttpCode(200)
    @Roles(...MANAGER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/revoke')
    public async revokeRoleFromUser(
        @Body() dto: RevokeRoleDto,
        @Req() request: Request,
    ): Promise<RevokeRoleResponse> {
        const user = request.user as IDecodedAccessToken;
        const tenantId = user?.tenantId ?? null;
        const userRoles = (user?.roles ?? []).map((role) => role.role);
        const userId = user?.id;
        const ipAddress = request.ip;
        const userAgent = request.headers['user-agent'];
        const requestId = request.headers['x-request-id'] as string;

        return this.roleService.revokeRoleFromUser(dto, tenantId, userRoles, {
            userId,
            ipAddress,
            userAgent,
            requestId,
        });
    }

    // ========================================================================
    // УДАЛЕНИЕ РОЛИ ПО ID (ADMIN_ROLES)
    // ========================================================================

    /**
     * Удалить роль
     * @access ADMIN_ROLES
     * @tenant_isolation YES - нельзя удалять роли других тенантов
     * @note Системные роли не могут быть удалены
     */
    @DeleteRoleSwaggerDecorator()
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/:id')
    public async deleteRole(
        @Param('id', ParseIntPipe) id: number,
        @Req() request: Request,
    ): Promise<DeleteRoleResponse> {
        const tenantId =
            (request.user as IDecodedAccessToken)?.tenantId ?? null;
        const userId = (request.user as IDecodedAccessToken)?.id;
        const ipAddress = request.ip;
        const userAgent = request.headers['user-agent'];
        const requestId = request.headers['x-request-id'] as string;

        return this.roleService.deleteRole(id, tenantId, {
            userId,
            ipAddress,
            userAgent,
            requestId,
        });
    }

    // ========================================================================
    // УПРАВЛЕНИЕ РАЗРЕШЕНИЯМИ РОЛЕЙ (ADMIN_ROLES)
    // ========================================================================

    /**
     * Назначить разрешение роли
     * @access ADMIN_ROLES
     */
    @HttpCode(201)
    @Roles(...ADMIN_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/permissions/assign')
    public async assignPermission(
        @Body() dto: AssignPermissionDto,
        @Req() request: Request,
    ): Promise<AssignPermissionResponse> {
        const tenantId =
            (request.user as IDecodedAccessToken)?.tenantId ?? null;
        const userId = (request.user as IDecodedAccessToken)?.id;
        const ipAddress = request.ip;
        const userAgent = request.headers['user-agent'];
        const requestId = request.headers['x-request-id'] as string;

        return this.roleService.assignPermission(dto, tenantId, {
            userId,
            ipAddress,
            userAgent,
            requestId,
        });
    }

    /**
     * Отозвать разрешение у роли
     * @access ADMIN_ROLES
     */
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/permissions/revoke')
    public async revokePermission(
        @Body() dto: RevokePermissionDto,
        @Req() request: Request,
    ): Promise<RevokePermissionResponse> {
        const tenantId =
            (request.user as IDecodedAccessToken)?.tenantId ?? null;
        const userId = (request.user as IDecodedAccessToken)?.id;
        const ipAddress = request.ip;
        const userAgent = request.headers['user-agent'];
        const requestId = request.headers['x-request-id'] as string;

        return this.roleService.revokePermission(dto, tenantId, {
            userId,
            ipAddress,
            userAgent,
            requestId,
        });
    }

    /**
     * Получить все разрешения роли
     * @access MANAGER_ROLES
     */
    @HttpCode(200)
    @Roles(...MANAGER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/permissions/:roleId')
    public async getRolePermissions(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Req() request: Request,
    ): Promise<GetRolePermissionsResponse> {
        const tenantId =
            (request.user as IDecodedAccessToken)?.tenantId ?? null;
        return this.roleService.getRolePermissions(roleId, tenantId);
    }

    /**
     * Получить все роли пользователя
     * @access MANAGER_ROLES
     * @tenant_isolation YES - можно получить роли только для пользователей своего тенанта
     */
    @HttpCode(200)
    @Roles(...MANAGER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/user/:userId')
    public async getUserRoles(
        @Param('userId', ParseIntPipe) userId: number,
        @Req() request: Request,
    ): Promise<GetUserRolesResponse> {
        const tenantId =
            (request.user as IDecodedAccessToken)?.tenantId ?? null;
        return this.roleService.getUserRoles(userId, tenantId);
    }

    // ========================================================================
    // ПРОСМОТР ИЕРАРХИИ РОЛЕЙ (MANAGER_ROLES)
    // ========================================================================

    /**
     * Получить полную иерархию ролей
     * @access MANAGER_ROLES
     * @returns Иерархия ролей: System, Tenant, Customer
     */
    @HttpCode(200)
    @Roles(...MANAGER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/hierarchy')
    public async getRoleHierarchy(): Promise<GetRoleHierarchyResponse> {
        return this.roleService.getRoleHierarchy();
    }

    /**
     * Получить уровень роли и список управляемых ролей
     * @access MANAGER_ROLES
     * @returns Уровень роли, категория и список ролей, которыми можно управлять
     */
    @HttpCode(200)
    @Roles(...MANAGER_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/level/:role')
    public async getRoleLevel(
        @Param('role') role: string,
    ): Promise<GetRoleLevelResponse> {
        return this.roleService.getRoleLevel(role);
    }

    // ========================================================================
    // МОНИТОРИНГ И УПРАВЛЕНИЕ КЭШЕМ (SUPER_ADMIN, PLATFORM_ADMIN)
    // ========================================================================

    /**
     * Получить статистику кэша ролей
     * @access SUPER_ADMIN, PLATFORM_ADMIN
     */
    @ApiOperation({ summary: 'Получить статистику кэша системных ролей' })
    @ApiResponse({
        status: 200,
        description: 'Статистика кэша',
        schema: {
            type: 'object',
            properties: {
                hits: { type: 'number', example: 150 },
                misses: { type: 'number', example: 10 },
                invalidations: { type: 'number', example: 5 },
                evictions: { type: 'number', example: 0 },
                size: { type: 'number', example: 8 },
                hitRate: { type: 'number', example: 93.75 },
                ttlMs: { type: 'number', example: 3600000 },
                maxSize: { type: 'number', example: 50 },
            },
        },
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/cache/stats')
    public getCacheStats(): {
        hits: number;
        misses: number;
        invalidations: number;
        evictions: number;
        size: number;
        hitRate: number;
        ttlMs: number;
        maxSize: number;
    } {
        return this.roleCacheService.getStats();
    }

    /**
     * Очистить кэш ролей
     * @access SUPER_ADMIN
     */
    @ApiOperation({ summary: 'Очистить весь кэш системных ролей' })
    @ApiResponse({
        status: 200,
        description: 'Кэш очищен',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Кэш очищен успешно' },
                clearedCount: { type: 'number', example: 8 },
            },
        },
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles('SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Delete('/cache')
    public clearCache(): { message: string; clearedCount: number } {
        const statsBefore = this.roleCacheService.getStats();
        const clearedCount = statsBefore.size;

        this.roleCacheService.invalidateAll();

        return {
            message: 'Кэш очищен успешно',
            clearedCount,
        };
    }

    /**
     * Сбросить статистику кэша (только счетчики)
     * @access SUPER_ADMIN
     */
    @ApiOperation({
        summary: 'Сбросить статистику кэша (hits/misses/evictions)',
    })
    @ApiResponse({
        status: 200,
        description: 'Статистика сброшена',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Статистика кэша сброшена',
                },
            },
        },
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles('SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/cache/reset-stats')
    public resetCacheStats(): { message: string } {
        this.roleCacheService.resetStats();
        return { message: 'Статистика кэша сброшена' };
    }

    // ============================================================================
    // МОНИТОРИНГ ПРОИЗВОДИТЕЛЬНОСТИ
    // ============================================================================

    @ApiOperation({
        summary: 'Получить статистику медленных запросов',
        description:
            'Возвращает список медленных запросов (>500ms). SUPER_ADMIN видит все запросы, PLATFORM_ADMIN - только своего тенанта.',
    })
    @ApiResponse({
        status: 200,
        description: 'Статистика медленных запросов',
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/performance/slow-queries')
    public getSlowQueries(
        @Req() req: Request & { user?: IDecodedAccessToken },
    ): Array<{
        method: string;
        route: string;
        duration: number;
        timestamp: string;
    }> {
        const user = req.user;
        const userRoles = user?.roles ?? [];
        const tenantId = user?.tenantId ?? null;

        // SUPER_ADMIN видит все запросы (null)
        // PLATFORM_ADMIN видит только свой тенант
        const isSuperAdmin = userRoles.some((r) => r.role === 'SUPER_ADMIN');
        const requestorTenantId = isSuperAdmin ? null : tenantId;

        return this.performanceInterceptor.getSlowQueries(requestorTenantId);
    }

    @ApiOperation({
        summary: 'Получить сводную статистику производительности',
        description: 'Возвращает агрегированную статистику медленных запросов',
    })
    @ApiResponse({
        status: 200,
        description: 'Сводная статистика',
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/performance/stats')
    public getPerformanceStats(): {
        totalSlowQueries: number;
        averageDuration: number;
        maxDuration: number;
        slowestRoute: string;
    } {
        return this.performanceInterceptor.getStats();
    }

    @ApiOperation({
        summary: 'Очистить статистику медленных запросов',
        description: 'Удаляет все записи о медленных запросах',
    })
    @ApiResponse({
        status: 200,
        description: 'Статистика очищена',
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles('SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Post('/performance/clear')
    public clearPerformanceStats(): { message: string } {
        this.performanceInterceptor.clearSlowQueries();
        this.performanceInterceptor.clearTenantStats();
        return { message: 'Статистика медленных запросов очищена' };
    }

    // ============================================================================
    // TENANT-AWARE МОНИТОРИНГ
    // ============================================================================

    @ApiOperation({
        summary: 'Получить статистику производительности тенанта',
        description:
            'Возвращает статистику медленных запросов для конкретного тенанта',
    })
    @ApiResponse({
        status: 200,
        description: 'Статистика тенанта',
        schema: {
            type: 'object',
            properties: {
                tenantId: { type: 'number' },
                slowQueryCount: { type: 'number' },
                avgDuration: { type: 'number' },
                maxDuration: { type: 'number' },
                totalDuration: { type: 'number' },
            },
        },
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/performance/tenant/:tenantId/stats')
    public getTenantStats(
        @Param('tenantId', ParseIntPipe) tenantId: number,
        @Req() req: Request & { user?: IDecodedAccessToken },
    ): {
        tenantId: number;
        slowQueryCount: number;
        avgDuration: number;
        maxDuration: number;
        totalDuration: number;
    } {
        const user = req.user;
        const userRoles = user?.roles ?? [];
        const userTenantId = user?.tenantId ?? null;

        const isSuperAdmin = userRoles.some((r) => r.role === 'SUPER_ADMIN');

        // PLATFORM_ADMIN может видеть только свой тенант
        if (!isSuperAdmin && userTenantId !== tenantId) {
            throw new ForbiddenException(
                'Недостаточно прав для просмотра статистики другого тенанта',
            );
        }

        const stats = this.performanceInterceptor.getTenantStats(tenantId);

        return {
            tenantId,
            ...stats,
        };
    }

    @ApiOperation({
        summary: 'Получить топ проблемных тенантов',
        description:
            'Возвращает список тенантов с наибольшим количеством медленных запросов (только для SUPER_ADMIN)',
    })
    @ApiResponse({
        status: 200,
        description: 'Топ проблемных тенантов',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    tenantId: { type: 'number' },
                    slowQueryCount: { type: 'number' },
                    avgDuration: { type: 'number' },
                    maxDuration: { type: 'number' },
                },
            },
        },
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles('SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/performance/tenants/top-noisy')
    public getTopNoisyTenants(
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ): Array<{
        tenantId: number;
        slowQueryCount: number;
        avgDuration: number;
        maxDuration: number;
    }> {
        return this.performanceInterceptor.getTopNoisyTenants(limit);
    }

    // ========================================================================
    // АУДИТ РОЛЕЙ (ADMIN_ROLES, SUPER_ADMIN)
    // ========================================================================

    /**
     * Получить список всех логов аудита ролей
     * @access ADMIN_ROLES, SUPER_ADMIN
     * @tenant_isolation YES - TENANT_ADMIN видит только логи своего тенанта
     */
    @ApiOperation({
        summary: 'Получить список всех логов аудита ролей',
        description:
            'Возвращает пагинированный список audit логов с возможностью фильтрации',
    })
    @ApiResponse({
        status: 200,
        description: 'Список audit логов',
        type: PaginatedAuditLogsResponse,
    })
    @ApiResponse({ status: 401, description: 'Не авторизован' })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiResponse({
        status: 429,
        description: 'Превышен лимит запросов (30 запросов в минуту). Повторите позже.',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES, 'SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/audit')
    public async getAuditLogs(
        @Query() filters: AuditFiltersDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Req() request: Request,
    ): Promise<PaginatedAuditLogsResponse> {
        const user = request.user as IDecodedAccessToken;
        const tenantId = user?.tenantId ?? null;

        // Для TENANT_ADMIN применяем tenant isolation
        const isTenantAdmin =
            user?.roles?.some((r) => r.role === 'TENANT_ADMIN') ?? false;
        const effectiveTenantId = isTenantAdmin ? tenantId : filters.tenantId;

        // Преобразовать строки дат в Date объекты
        const startDate = filters.startDate
            ? new Date(filters.startDate)
            : undefined;
        const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

        const auditLogs = await this.auditService.findAll(page, limit, {
            action: filters.action,
            entityType: filters.entityType,
            entityId: filters.entityId,
            userId: filters.userId,
            tenantId: effectiveTenantId ?? undefined,
            startDate,
            endDate,
            requestId: filters.requestId,
        });

        return {
            data: auditLogs.data.map((log) =>
                mapAuditLogToResponse(log, false),
            ),
            meta: {
                totalCount: auditLogs.totalCount,
                currentPage: auditLogs.currentPage,
                lastPage: auditLogs.lastPage,
                limit: auditLogs.limit,
                hasNextPage: auditLogs.currentPage < auditLogs.lastPage,
                hasPreviousPage: auditLogs.currentPage > 1,
            },
        };
    }

    /**
     * Получить audit логи с фильтрацией
     * @access ADMIN_ROLES, SUPER_ADMIN
     * @tenant_isolation YES - TENANT_ADMIN видит только логи своего тенанта
     */
    @ApiOperation({
        summary: 'Получить audit логи с фильтрацией',
        description:
            'Возвращает audit логи с применением множественных фильтров',
    })
    @ApiResponse({
        status: 200,
        description: 'Отфильтрованные audit логи',
        type: PaginatedAuditLogsResponse,
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiResponse({
        status: 429,
        description: 'Превышен лимит запросов (30 запросов в минуту). Повторите позже.',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES, 'SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/audit/filter')
    public async getFilteredAudit(
        @Query() filters: AuditFiltersDto,
        @Req() request: Request,
    ): Promise<PaginatedAuditLogsResponse> {
        const user = request.user as IDecodedAccessToken;
        const tenantId = user?.tenantId ?? null;

        // Получаем page и limit напрямую из query параметров, минуя ParseIntPipe
        // чтобы избежать конфликта с валидацией DTO
        const page = request.query.page
            ? parseInt(String(request.query.page), 10)
            : 1;
        const limit = request.query.limit
            ? parseInt(String(request.query.limit), 10)
            : 20;

        // Для TENANT_ADMIN применяем tenant isolation
        const isTenantAdmin =
            user?.roles?.some((r) => r.role === 'TENANT_ADMIN') ?? false;
        const effectiveTenantId = isTenantAdmin ? tenantId : filters.tenantId;

        // Преобразовать строки дат в Date объекты
        const startDate = filters.startDate
            ? new Date(filters.startDate)
            : undefined;
        const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

        // Используем getAuditByDateRange если указаны даты, иначе findAll
        let auditLogs;
        if (startDate && endDate) {
            auditLogs = await this.roleAuditService.getAuditByDateRange(
                startDate,
                endDate,
                page,
                limit,
                {
                    action: filters.action,
                    entityType: filters.entityType,
                    entityId: filters.entityId,
                    userId: filters.userId,
                    tenantId: effectiveTenantId ?? undefined,
                    requestId: filters.requestId,
                },
            );
        } else {
            auditLogs = await this.auditService.findAll(page, limit, {
                action: filters.action,
                entityType: filters.entityType,
                entityId: filters.entityId,
                userId: filters.userId,
                tenantId: effectiveTenantId ?? undefined,
                startDate,
                endDate,
                requestId: filters.requestId,
            });
        }

        return {
            data: auditLogs.data.map((log) =>
                mapAuditLogToResponse(log, false),
            ),
            meta: {
                totalCount: auditLogs.totalCount,
                currentPage: auditLogs.currentPage,
                lastPage: auditLogs.lastPage,
                limit: auditLogs.limit,
                hasNextPage: auditLogs.currentPage < auditLogs.lastPage,
                hasPreviousPage: auditLogs.currentPage > 1,
            },
        };
    }

    /**
     * Получить детали конкретного audit лога
     * @access ADMIN_ROLES, SUPER_ADMIN
     * @tenant_isolation YES - TENANT_ADMIN видит только логи своего тенанта
     */
    @ApiOperation({
        summary: 'Получить детали audit лога',
        description: 'Возвращает детальную информацию об audit логе, включая diff',
    })
    @ApiResponse({
        status: 200,
        description: 'Детали audit лога',
        type: AuditLogResponse,
    })
    @ApiResponse({ status: 404, description: 'Audit лог не найден' })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiResponse({
        status: 429,
        description: 'Превышен лимит запросов (30 запросов в минуту). Повторите позже.',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES, 'SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/audit/:id')
    public async getAuditLogById(
        @Param('id', ParseIntPipe) id: number,
        @Req() request: Request,
    ): Promise<AuditLogResponse> {
        const user = request.user as IDecodedAccessToken;
        const tenantId = user?.tenantId ?? null;

        const auditLog = await this.auditService.findById(id);
        if (!auditLog) {
            throw new NotFoundException('Audit лог не найден');
        }

        // Tenant isolation для TENANT_ADMIN
        const isTenantAdmin =
            user?.roles?.some((r) => r.role === 'TENANT_ADMIN') ?? false;
        if (
            isTenantAdmin &&
            auditLog.tenantId !== null &&
            auditLog.tenantId !== tenantId
        ) {
            throw new ForbiddenException(
                'Доступ к audit логу другого тенанта запрещён',
            );
        }

        const diff = this.roleAuditService.getDiff(auditLog);
        return mapAuditLogToResponse(auditLog, true, diff);
    }

    /**
     * Получить историю изменений конкретной роли
     * @access ADMIN_ROLES, SUPER_ADMIN
     * @tenant_isolation YES - TENANT_ADMIN видит только роли своего тенанта
     */
    @ApiOperation({
        summary: 'Получить историю изменений роли',
        description:
            'Возвращает все audit логи для конкретной роли (CREATE, UPDATE, DELETE)',
    })
    @ApiResponse({
        status: 200,
        description: 'История изменений роли',
        type: PaginatedAuditLogsResponse,
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiResponse({
        status: 429,
        description: 'Превышен лимит запросов (30 запросов в минуту). Повторите позже.',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES, 'SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/audit/role/:roleId')
    public async getRoleAuditHistory(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Req() request: Request,
    ): Promise<PaginatedAuditLogsResponse> {
        const user = request.user as IDecodedAccessToken;
        const tenantId = user?.tenantId ?? null;

        const auditLogs = await this.roleAuditService.getRoleAuditHistory(
            roleId,
            page,
            limit,
            tenantId,
        );

        return {
            data: auditLogs.data.map((log) =>
                mapAuditLogToResponse(log, false),
            ),
            meta: {
                totalCount: auditLogs.totalCount,
                currentPage: auditLogs.currentPage,
                lastPage: auditLogs.lastPage,
                limit: auditLogs.limit,
                hasNextPage: auditLogs.currentPage < auditLogs.lastPage,
                hasPreviousPage: auditLogs.currentPage > 1,
            },
        };
    }

    /**
     * Получить историю назначений ролей для конкретного пользователя
     * @access ADMIN_ROLES, SUPER_ADMIN
     * @tenant_isolation YES - TENANT_ADMIN видит только пользователей своего тенанта
     */
    @ApiOperation({
        summary: 'Получить историю назначений ролей пользователю',
        description:
            'Возвращает все audit логи назначений и отзывов ролей для пользователя',
    })
    @ApiResponse({
        status: 200,
        description: 'История назначений ролей',
        type: PaginatedAuditLogsResponse,
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiResponse({
        status: 429,
        description: 'Превышен лимит запросов (30 запросов в минуту). Повторите позже.',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES, 'SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/audit/user/:userId')
    public async getUserRoleAuditHistory(
        @Param('userId', ParseIntPipe) userId: number,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Req() request: Request,
    ): Promise<PaginatedAuditLogsResponse> {
        const user = request.user as IDecodedAccessToken;
        const tenantId = user?.tenantId ?? null;

        const auditLogs = await this.roleAuditService.getUserRoleAuditHistory(
            userId,
            page,
            limit,
            tenantId,
        );

        return {
            data: auditLogs.data.map((log) =>
                mapAuditLogToResponse(log, false),
            ),
            meta: {
                totalCount: auditLogs.totalCount,
                currentPage: auditLogs.currentPage,
                lastPage: auditLogs.lastPage,
                limit: auditLogs.limit,
                hasNextPage: auditLogs.currentPage < auditLogs.lastPage,
                hasPreviousPage: auditLogs.currentPage > 1,
            },
        };
    }

    // ========================================================================
    // ОТЧЁТЫ ПО АУДИТУ (ADMIN_ROLES, SUPER_ADMIN)
    // ========================================================================

    /**
     * Получить сводный отчёт по audit логам
     * @access ADMIN_ROLES, SUPER_ADMIN
     * @tenant_isolation YES - TENANT_ADMIN видит только свой тенант
     */
    @ApiOperation({
        summary: 'Получить сводный отчёт по audit логам',
        description:
            'Возвращает агрегированную статистику по операциям за указанный период',
    })
    @ApiResponse({
        status: 200,
        description: 'Сводный отчёт',
        type: AuditSummaryResponse,
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiResponse({
        status: 429,
        description: 'Превышен лимит запросов (30 запросов в минуту). Повторите позже.',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES, 'SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/audit/reports/summary')
    public async getAuditSummary(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('tenantId') tenantIdParam?: string,
        @Req() request: Request,
    ): Promise<AuditSummaryResponse> {
        const user = request.user as IDecodedAccessToken;
        const tenantId = user?.tenantId ?? null;

        // Для TENANT_ADMIN применяем tenant isolation
        const isTenantAdmin =
            user?.roles?.some((r) => r.role === 'TENANT_ADMIN') ?? false;
        let parsedTenantId: number | null = null;
        if (tenantIdParam) {
            const parsed = Number.parseInt(tenantIdParam, 10);
            parsedTenantId = Number.isNaN(parsed) ? null : parsed;
        }
        const effectiveTenantId = isTenantAdmin ? tenantId : parsedTenantId;

        if (!startDateStr || !endDateStr) {
            throw new BadRequestException(
                'startDate и endDate обязательны для сводного отчёта',
            );
        }

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new BadRequestException('Неверный формат даты');
        }

        if (startDate > endDate) {
            throw new BadRequestException(
                'startDate не может быть больше endDate',
            );
        }

        return this.roleAuditService.generateSummaryReport(
            startDate,
            endDate,
            effectiveTenantId,
        );
    }

    /**
     * Получить timeline изменений роли
     * @access ADMIN_ROLES, SUPER_ADMIN
     * @tenant_isolation YES - TENANT_ADMIN видит только роли своего тенанта
     */
    @ApiOperation({
        summary: 'Получить timeline изменений роли',
        description:
            'Возвращает хронологию всех изменений конкретной роли с diff',
    })
    @ApiResponse({
        status: 200,
        description: 'Timeline изменений роли',
        type: AuditTimelineResponse,
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiResponse({
        status: 429,
        description: 'Превышен лимит запросов (30 запросов в минуту). Повторите позже.',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES, 'SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/audit/reports/timeline/:roleId')
    public async getRoleTimeline(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Req() request: Request,
    ): Promise<AuditTimelineResponse> {
        const user = request.user as IDecodedAccessToken;
        const tenantId = user?.tenantId ?? null;

        return this.roleAuditService.generateTimelineReport(roleId, tenantId);
    }

    /**
     * Получить отчёт об активности пользователя
     * @access ADMIN_ROLES, SUPER_ADMIN
     * @tenant_isolation YES - TENANT_ADMIN видит только пользователей своего тенанта
     */
    @ApiOperation({
        summary: 'Получить отчёт об активности пользователя',
        description:
            'Возвращает статистику всех операций пользователя с ролями за период',
    })
    @ApiResponse({
        status: 200,
        description: 'Отчёт об активности пользователя',
        type: UserActivityReportResponse,
    })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiResponse({
        status: 429,
        description: 'Превышен лимит запросов (30 запросов в минуту). Повторите позже.',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES, 'SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/audit/reports/user-activity/:userId')
    public async getUserActivity(
        @Param('userId', ParseIntPipe) userId: number,
        @Req() request: Request,
        @Query('startDate') startDateStr?: string,
        @Query('endDate') endDateStr?: string,
    ): Promise<UserActivityReportResponse> {
        const user = request.user as IDecodedAccessToken;
        const tenantId = user?.tenantId ?? null;

        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        if (startDate && isNaN(startDate.getTime())) {
            throw new BadRequestException('Неверный формат startDate');
        }
        if (endDate && isNaN(endDate.getTime())) {
            throw new BadRequestException('Неверный формат endDate');
        }
        if (
            startDate &&
            endDate &&
            startDate > endDate
        ) {
            throw new BadRequestException(
                'startDate не может быть больше endDate',
            );
        }

        return this.roleAuditService.generateUserActivityReport(
            userId,
            startDate,
            endDate,
            tenantId,
        );
    }

    /**
     * Экспортировать audit логи в CSV или JSON
     * @access ADMIN_ROLES, SUPER_ADMIN
     * @tenant_isolation YES - TENANT_ADMIN видит только логи своего тенанта
     */
    @ApiOperation({
        summary: 'Экспортировать audit логи',
        description: 'Экспортирует audit логи в CSV или JSON формате',
    })
    @ApiResponse({
        status: 200,
        description: 'Файл с экспортированными данными',
    })
    @ApiResponse({ status: 400, description: 'Неверный формат' })
    @ApiResponse({ status: 403, description: 'Недостаточно прав' })
    @ApiResponse({
        status: 429,
        description: 'Превышен лимит запросов (30 запросов в минуту). Повторите позже.',
    })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Roles(...ADMIN_ROLES, 'SUPER_ADMIN')
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/audit/reports/export')
    public async exportAudit(
        @Query() filters: AuditFiltersDto,
        @Query('format') format: 'csv' | 'json',
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(1000), ParseIntPipe) limit: number,
        @Req() request: Request,
        @Res() res: Response,
    ): Promise<void> {
        const user = request.user as IDecodedAccessToken;
        const tenantId = user?.tenantId ?? null;

        if (!format || (format !== 'csv' && format !== 'json')) {
            throw new BadRequestException(
                'Формат должен быть "csv" или "json"',
            );
        }

        // Для TENANT_ADMIN применяем tenant isolation
        const isTenantAdmin =
            user?.roles?.some((r) => r.role === 'TENANT_ADMIN') ?? false;
        const effectiveTenantId = isTenantAdmin ? tenantId : filters.tenantId;

        // Преобразовать строки дат в Date объекты
        const startDate = filters.startDate
            ? new Date(filters.startDate)
            : undefined;
        const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

        // Получить все данные (может потребоваться несколько запросов для больших объёмов)
        let allAuditLogs: AuditLogModel[] = [];
        let currentPage = page;
        let hasMore = true;

        // Лимит на экспорт - максимум 10000 записей (защита от memory leak)
        const MAX_EXPORT_RECORDS = 10000;
        while (hasMore && allAuditLogs.length < MAX_EXPORT_RECORDS) {
            const result = await this.auditService.findAll(
                currentPage,
                limit,
                {
                    action: filters.action,
                    entityType: filters.entityType,
                    entityId: filters.entityId,
                    userId: filters.userId,
                    tenantId: effectiveTenantId ?? undefined,
                    startDate,
                    endDate,
                    requestId: filters.requestId,
                },
            );

            allAuditLogs = allAuditLogs.concat(result.data);
            hasMore = result.currentPage < result.lastPage;
            currentPage++;
        }

        // Преобразовать в формат для экспорта
        const exportData = allAuditLogs.map((log) =>
            mapAuditLogToResponse(log, false),
        );

        if (format === 'csv') {
            const csvContent = CSVExporter.exportAuditLogs(exportData);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
            );
            res.send(csvContent);
        } else {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`,
            );
            res.json(exportData);
        }
    }
}
