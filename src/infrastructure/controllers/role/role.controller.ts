import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    ParseIntPipe,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

import { IDecodedAccessToken } from '@app/domain/jwt';
import { RoleService } from '@app/infrastructure/services';
import {
    CreateRoleDto,
    AssignRoleDto,
    RevokeRoleDto,
    AssignPermissionDto,
    RevokePermissionDto,
} from '@app/infrastructure/dto';
import {
    CreateRoleSwaggerDecorator,
    Roles,
    GetListRoleSwaggerDecorator,
    GetRoleSwaggerDecorator,
} from '@app/infrastructure/common/decorators';
import { RoleGuard, AuthGuard } from '@app/infrastructure/common/guards';
import {
    CreateRoleResponse,
    GetRoleResponse,
    GetListRoleResponse,
    AssignRoleResponse,
    RevokeRoleResponse,
    AssignPermissionResponse,
    RevokePermissionResponse,
    GetUserRolesResponse,
    GetRolePermissionsResponse,
    GetRoleHierarchyResponse,
    GetRoleLevelResponse,
} from '@app/infrastructure/responses';

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
    constructor(private readonly roleService: RoleService) {}

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
    ): Promise<CreateRoleResponse> {
        return this.roleService.createRole(dto);
    }

    /**
     * Получить информацию о роли
     * @access ADMIN_ROLES
     */
    @GetRoleSwaggerDecorator()
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/one/:role')
    public async getRole(
        @Param('role') role: string,
    ): Promise<GetRoleResponse> {
        return this.roleService.getRole(role);
    }

    /**
     * Получить список всех ролей
     * @access ADMIN_ROLES
     */
    @GetListRoleSwaggerDecorator()
    @HttpCode(200)
    @Roles(...ADMIN_ROLES)
    @UseGuards(AuthGuard, RoleGuard)
    @Get('/list')
    public async getListRole(): Promise<GetListRoleResponse[]> {
        return this.roleService.getListRole();
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
        const tenantId = (request.user as IDecodedAccessToken)?.tenantId;
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
        const tenantId = (request.user as IDecodedAccessToken)?.tenantId;
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
        const tenantId = (request.user as IDecodedAccessToken)?.tenantId;
        return this.roleService.getRolePermissions(roleId, tenantId);
    }

    // ========================================================================
    // НАЗНАЧЕНИЕ РОЛЕЙ ПОЛЬЗОВАТЕЛЯМ (MANAGER_ROLES)
    // ========================================================================

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
        const tenantId = user?.tenantId;
        const userRoles = user?.roles || [];
        return this.roleService.assignRoleToUser(
            dto,
            tenantId,
            userRoles,
        );
    }

    /**
     * Отозвать роль у пользователя
     * @access MANAGER_ROLES
     * @tenant_isolation YES - нельзя отзывать роли у пользователей из других тенантов
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
        const tenantId = user?.tenantId;
        const userRoles = user?.roles || [];
        return this.roleService.revokeRoleFromUser(
            dto,
            tenantId,
            userRoles,
        );
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
        const tenantId = (request.user as IDecodedAccessToken)?.tenantId;
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
}
