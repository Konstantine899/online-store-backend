import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

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
import {
    AssignPermissionDto,
    AssignRoleDto,
    CreateRoleDto,
    RevokePermissionDto,
    RevokeRoleDto,
    UpdateRoleDto,
} from '@app/infrastructure/dto';
import {
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
} from '@app/infrastructure/responses';
import {
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
export class RoleController implements IRoleController {
    constructor(
        private readonly roleService: RoleService,
        private readonly roleCacheService: RoleCacheService,
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
        return this.roleService.createRole(dto, tenantId);
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
        return this.roleService.updateRole(id, dto, tenantId);
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
        return this.roleService.assignRoleToUser(dto, tenantId, userRoles);
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
        return this.roleService.revokeRoleFromUser(dto, tenantId, userRoles);
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
        return this.roleService.deleteRole(id, tenantId);
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
        return this.roleService.assignPermission(dto, tenantId);
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
        return this.roleService.revokePermission(dto, tenantId);
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
}
