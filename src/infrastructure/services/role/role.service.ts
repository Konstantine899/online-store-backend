import { AuditAction, UserModel, UserRoleModel } from '@app/domain/models';
import { IRoleService } from '@app/domain/services';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { AuditService } from '@app/infrastructure/services/audit/audit.service';
import {
    canManageRole,
    CUSTOMER_ROLES,
    getManageableRoles,
    getRoleLevel,
    getVipRoleThreshold,
    getWholesaleRoleThreshold,
    GUEST_ROLES,
    isCustomerRole,
    isSystemRole,
    isTenantRole,
    STAFF_ROLES,
    SYSTEM_ROLES,
} from '@app/infrastructure/controllers/role/role-constants';
import {
    AssignPermissionDto,
    AssignRoleDto,
    CreateRoleDto,
    RevokePermissionDto,
    RevokeRoleDto,
    UpdateRoleDto,
} from '@app/infrastructure/dto';
import {
    RoleHierarchyViolationException,
    RoleNotFoundException,
    TenantIsolationViolationException,
} from '@app/infrastructure/exceptions';
import {
    OrderRepository,
    RoleRepository,
} from '@app/infrastructure/repositories';
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
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RoleCacheService } from './role-cache.service';
import { UserRolesCacheService } from './user-roles-cache.service';

@Injectable()
export class RoleService implements IRoleService {
    private readonly logger = new Logger(RoleService.name);

    constructor(
        private readonly roleRepository: RoleRepository,
        private readonly orderRepository: OrderRepository,
        private readonly roleCacheService: RoleCacheService,
        private readonly userRolesCacheService: UserRolesCacheService,
        private readonly auditService: AuditService,
        @InjectModel(UserModel) private userModel: typeof UserModel,
        @InjectModel(UserRoleModel)
        private userRoleModel: typeof UserRoleModel,
        private readonly metricsCollector: MetricsCollector,
    ) {}

    public async createRole(
        dto: CreateRoleDto,
        tenantId?: number | null,
        auditContext?: {
            userId?: number;
            ipAddress?: string;
            userAgent?: string;
            requestId?: string;
        },
    ): Promise<CreateRoleResponse> {
        // Если роль не системная и tenantId не передан в DTO, используем tenantId из JWT
        // Создаем новый объект DTO, так как поля readonly
        const dtoWithTenantId: CreateRoleDto =
            !dto.isSystemRole && !dto.tenantId && tenantId
                ? { ...dto, tenantId }
                : dto;
        const newRole = await this.roleRepository.createRole(dtoWithTenantId);

        // Создать запись в audit логе
        if (auditContext) {
            await this.auditService.createLog({
                entityType: 'role',
                entityId: newRole.id,
                action: AuditAction.CREATE,
                userId: auditContext.userId ?? null,
                oldValues: null,
                newValues: {
                    role: newRole.role,
                    description: newRole.description,
                    level: newRole.level,
                    isSystemRole: newRole.isSystemRole,
                    isActive: newRole.isActive,
                    tenantId: newRole.tenantId,
                },
                ipAddress: auditContext.ipAddress ?? null,
                userAgent: auditContext.userAgent ?? null,
                requestId: auditContext.requestId ?? null,
                tenantId: newRole.tenantId,
            });
        }

        return newRole;
    }

    /**
     * Получить роль по названию с проверкой tenant isolation
     * @param role - Название роли
     * @param tenantId - ID тенанта (null для системных ролей)
     * @returns GetRoleResponse
     */
    public async getRole(
        role: string,
        tenantId?: number | null,
    ): Promise<GetRoleResponse> {
        this.logger.log(
            { role, tenantId },
            'Запрос роли с проверкой tenant isolation',
        );

        const foundRole = await this.roleRepository.findRole(role, tenantId);
        if (!foundRole) {
            this.logger.warn(
                { role, tenantId },
                'Роль не найдена или недоступна для тенанта',
            );
            throw new RoleNotFoundException(role);
        }

        this.logger.log(
            { role, roleId: foundRole.id, tenantId },
            'Роль успешно получена',
        );

        return foundRole;
    }

    /**
     * Получить список ролей с проверкой tenant isolation
     * @param tenantId - ID тенанта (null для системных ролей)
     * @returns Список ролей (тенантские + системные)
     */
    public async getListRole(
        tenantId?: number | null,
    ): Promise<GetListRoleResponse[]> {
        this.logger.log(
            { tenantId },
            'Запрос списка ролей с проверкой tenant isolation',
        );

        const roles = await this.roleRepository.findListRole(tenantId);
        if (!roles) {
            this.notFound('Роли не найдены');
        }

        this.logger.log(
            { tenantId, rolesCount: roles.length },
            'Список ролей успешно получен',
        );

        return roles;
    }

    /**
     * Обновить роль
     * @param id - ID роли
     * @param dto - Данные для обновления
     * @param tenantId - ID тенанта (null для системных ролей)
     * @returns UpdateRoleResponse
     */
    public async updateRole(
        id: number,
        dto: UpdateRoleDto,
        tenantId: number | null,
        auditContext?: {
            userId?: number;
            ipAddress?: string;
            userAgent?: string;
            requestId?: string;
        },
    ): Promise<UpdateRoleResponse> {
        this.logger.log(
            { roleId: id, tenantId, updatedFields: Object.keys(dto) },
            'Запрос обновления роли с проверкой tenant isolation',
        );

        // Получить старые значения для audit лога
        const oldRole = await this.roleRepository.findRoleById(id, tenantId);
        if (!oldRole) {
            throw new RoleNotFoundException(id);
        }

        const oldValues = {
            role: oldRole.role,
            description: oldRole.description,
            level: oldRole.level,
            isSystemRole: oldRole.isSystemRole,
            isActive: oldRole.isActive,
            tenantId: oldRole.tenantId,
        };

        const updatedRole = await this.roleRepository.updateRole(
            id,
            dto,
            tenantId,
        );

        // Инвалидировать кэш для обновленной роли
        if (updatedRole.isSystemRole) {
            this.roleCacheService.invalidate(updatedRole.role);
            this.logger.debug(
                `Кэш для роли ${updatedRole.role} инвалидирован после обновления`,
            );
        }

        // Инвалидировать кэш всех пользователей с этой ролью
        const invalidatedCount =
            await this.userRolesCacheService.invalidateByRoleId(updatedRole.id);
        this.logger.debug(
            `Инвалидирован кэш для ${invalidatedCount} пользователей с ролью ${updatedRole.role}`,
        );

        // Создать запись в audit логе
        if (auditContext) {
            await this.auditService.createLog({
                entityType: 'role',
                entityId: updatedRole.id,
                action: AuditAction.UPDATE,
                userId: auditContext.userId ?? null,
                oldValues,
                newValues: {
                    role: updatedRole.role,
                    description: updatedRole.description,
                    level: updatedRole.level,
                    isSystemRole: updatedRole.isSystemRole,
                    isActive: updatedRole.isActive,
                    tenantId: updatedRole.tenantId,
                },
                ipAddress: auditContext.ipAddress ?? null,
                userAgent: auditContext.userAgent ?? null,
                requestId: auditContext.requestId ?? null,
                tenantId: updatedRole.tenantId,
            });
        }

        // Получить разрешения роли
        const permissions = await this.roleRepository.findRolePermissions(
            updatedRole.id,
        );

        this.logger.log(
            { roleId: id, roleName: updatedRole.role, tenantId },
            'Роль успешно обновлена',
        );

        // Явно читаем description из модели, используя getDataValue если нужно
        const description =
            updatedRole.description ??
            updatedRole.getDataValue?.('description') ??
            null;

        return {
            message: 'Роль успешно обновлена',
            id: updatedRole.id,
            role: updatedRole.role,
            description: description,
            level: updatedRole.level,
            permissions: permissions.map((p) => ({
                resource: p.resource,
                action: p.action,
                conditions: p.conditions,
            })),
            isSystemRole: updatedRole.isSystemRole,
            isActive: updatedRole.isActive,
            tenantId: updatedRole.tenantId,
            updatedAt: updatedRole.updatedAt,
        };
    }

    /**
     * Удалить роль
     * @param id - ID роли
     * @param tenantId - ID тенанта (null для системных ролей)
     * @returns DeleteRoleResponse
     */
    public async deleteRole(
        id: number,
        tenantId: number | null,
        auditContext?: {
            userId?: number;
            ipAddress?: string;
            userAgent?: string;
            requestId?: string;
        },
    ): Promise<DeleteRoleResponse> {
        this.logger.log(
            { roleId: id, tenantId },
            'Запрос удаления роли с проверкой tenant isolation',
        );

        // Проверить существование роли перед удалением
        const role = await this.roleRepository.findRoleById(id, tenantId);
        if (!role) {
            this.logger.warn(
                { roleId: id, tenantId },
                'Роль не найдена или недоступна для тенанта при удалении',
            );
            throw new RoleNotFoundException(id);
        }

        // Сохранить старые значения для audit лога
        const oldValues = {
            role: role.role,
            description: role.description,
            level: role.level,
            isSystemRole: role.isSystemRole,
            isActive: role.isActive,
            tenantId: role.tenantId,
        };

        const deleted = await this.roleRepository.deleteRole(id, tenantId);
        if (!deleted) {
            this.logger.warn(
                { roleId: id, tenantId },
                'Не удалось удалить роль',
            );
            throw new RoleNotFoundException(id);
        }

        // Инвалидировать кэш для удаленной роли
        if (role.isSystemRole) {
            this.roleCacheService.invalidate(role.role);
            this.logger.debug(
                `Кэш для роли ${role.role} инвалидирован после удаления`,
            );
        }

        // Инвалидировать кэш всех пользователей с этой ролью
        const invalidatedCount =
            await this.userRolesCacheService.invalidateByRoleId(role.id);
        this.logger.debug(
            `Инвалидирован кэш для ${invalidatedCount} пользователей с удаляемой ролью ${role.role}`,
        );

        // Создать запись в audit логе
        if (auditContext) {
            await this.auditService.createLog({
                entityType: 'role',
                entityId: id,
                action: AuditAction.DELETE,
                userId: auditContext.userId ?? null,
                oldValues,
                newValues: null,
                ipAddress: auditContext.ipAddress ?? null,
                userAgent: auditContext.userAgent ?? null,
                requestId: auditContext.requestId ?? null,
                tenantId: role.tenantId,
            });
        }

        this.logger.log(
            { roleId: id, roleName: role.role, tenantId },
            'Роль успешно удалена',
        );

        return {
            message: 'Роль успешно удалена',
            id: role.id,
            role: role.role,
        };
    }

    // ============================================================================
    // МЕТОДЫ УПРАВЛЕНИЯ РАЗРЕШЕНИЯМИ
    // ============================================================================

    /**
     * Назначить разрешение роли
     * @param dto - DTO с данными разрешения
     * @param tenantId - ID тенанта (null для системных ролей)
     * @returns AssignPermissionResponse
     */
    public async assignPermission(
        dto: AssignPermissionDto,
        tenantId: number | null,
        auditContext?: {
            userId?: number;
            ipAddress?: string;
            userAgent?: string;
            requestId?: string;
        },
    ): Promise<AssignPermissionResponse> {
        this.logger.log(
            {
                roleId: dto.roleId,
                resource: dto.resource,
                action: dto.action,
                tenantId,
            },
            'Запрос назначения разрешения роли с проверкой tenant isolation',
        );

        // Проверить существование роли и tenant isolation
        const role = await this.roleRepository.findRoleById(
            dto.roleId,
            tenantId,
        );
        if (!role) {
            this.logger.warn(
                { roleId: dto.roleId, tenantId },
                'Роль не найдена или недоступна для тенанта при назначении разрешения',
            );
            this.notFound('Роль не найдена');
        }

        // Создать разрешение
        const permission = await this.roleRepository.createRolePermission(
            dto.roleId,
            dto.resource,
            dto.action,
            dto.conditions,
        );

        this.logger.log(
            {
                roleId: dto.roleId,
                permissionId: permission.id,
                resource: dto.resource,
                action: dto.action,
                tenantId,
            },
            'Разрешение успешно назначено роли',
        );

        // Создать запись в audit логе
        if (auditContext) {
            await this.auditService.createLog({
                entityType: 'role_permission',
                entityId: permission.id,
                action: AuditAction.GRANT_PERMISSION,
                userId: auditContext.userId ?? null,
                oldValues: null,
                newValues: {
                    roleId: dto.roleId,
                    roleName: role.role,
                    resource: dto.resource,
                    action: dto.action,
                    conditions: dto.conditions ?? null,
                },
                ipAddress: auditContext.ipAddress ?? null,
                userAgent: auditContext.userAgent ?? null,
                requestId: auditContext.requestId ?? null,
                tenantId: role.tenantId,
            });
        }

        return {
            message: 'Разрешение успешно назначено роли',
            permissionId: permission.id,
            roleId: dto.roleId, // Используем roleId из DTO для гарантии
            resource: dto.resource, // Используем resource из DTO для гарантии
            action: dto.action, // Используем action из DTO для гарантии
        };
    }

    /**
     * Отозвать разрешение у роли
     * @param dto - DTO с данными разрешения
     * @param tenantId - ID тенанта (null для системных ролей)
     * @returns RevokePermissionResponse
     */
    public async revokePermission(
        dto: RevokePermissionDto,
        tenantId: number | null,
        auditContext?: {
            userId?: number;
            ipAddress?: string;
            userAgent?: string;
            requestId?: string;
        },
    ): Promise<RevokePermissionResponse> {
        this.logger.log(
            {
                roleId: dto.roleId,
                resource: dto.resource,
                action: dto.action,
                tenantId,
            },
            'Запрос отзыва разрешения роли с проверкой tenant isolation',
        );

        // Проверить существование роли и tenant isolation
        const role = await this.roleRepository.findRoleById(
            dto.roleId,
            tenantId,
        );
        if (!role) {
            this.logger.warn(
                { roleId: dto.roleId, tenantId },
                'Роль не найдена или недоступна для тенанта при отзыве разрешения',
            );
            this.notFound('Роль не найдена');
        }

        // Получить информацию о разрешении перед удалением для audit лога
        const existingPermissions =
            await this.roleRepository.findRolePermissions(dto.roleId);
        const permissionToDelete = existingPermissions.find(
            (p) => p.resource === dto.resource && p.action === dto.action,
        );

        // Удалить разрешение
        const deleted = await this.roleRepository.deleteRolePermission(
            dto.roleId,
            dto.resource,
            dto.action,
        );

        if (!deleted) {
            this.logger.warn(
                {
                    roleId: dto.roleId,
                    resource: dto.resource,
                    action: dto.action,
                    tenantId,
                },
                'Разрешение не найдено при отзыве',
            );
            this.notFound('Разрешение не найдено');
        }

        this.logger.log(
            {
                roleId: dto.roleId,
                resource: dto.resource,
                action: dto.action,
                tenantId,
            },
            'Разрешение успешно отозвано у роли',
        );

        // Создать запись в audit логе
        if (auditContext && permissionToDelete) {
            await this.auditService.createLog({
                entityType: 'role_permission',
                entityId: permissionToDelete.id,
                action: AuditAction.REVOKE_PERMISSION,
                userId: auditContext.userId ?? null,
                oldValues: {
                    roleId: dto.roleId,
                    roleName: role.role,
                    resource: dto.resource,
                    action: dto.action,
                    conditions: permissionToDelete.conditions ?? null,
                },
                newValues: null,
                ipAddress: auditContext.ipAddress ?? null,
                userAgent: auditContext.userAgent ?? null,
                requestId: auditContext.requestId ?? null,
                tenantId: role.tenantId,
            });
        }

        return {
            message: 'Разрешение успешно отозвано у роли',
            roleId: dto.roleId,
            resource: dto.resource,
            action: dto.action,
        };
    }

    /**
     * Получить все разрешения роли
     * @param roleId - ID роли
     * @param tenantId - ID тенанта (null для системных ролей)
     * @returns GetRolePermissionsResponse
     */
    public async getRolePermissions(
        roleId: number,
        tenantId: number | null,
    ): Promise<GetRolePermissionsResponse> {
        this.logger.log(
            { roleId, tenantId },
            'Запрос разрешений роли с проверкой tenant isolation',
        );

        // Проверить существование роли и tenant isolation
        const role = await this.roleRepository.findRoleById(roleId, tenantId);
        if (!role) {
            this.logger.warn(
                { roleId, tenantId },
                'Роль не найдена или недоступна для тенанта при запросе разрешений',
            );
            throw new RoleNotFoundException(roleId);
        }

        // Получить разрешения
        const permissions =
            await this.roleRepository.findRolePermissions(roleId);

        this.logger.log(
            { roleId, tenantId, permissionsCount: permissions.length },
            'Разрешения роли успешно получены',
        );

        // TypeScript guard: role уже проверен выше
        if (!role) {
            this.notFound('Роль не найдена');
        }

        return {
            roleId,
            roleName: role.role,
            permissions: permissions.map((p) => ({
                id: p.id,
                resource: p.resource,
                action: p.action,
                conditions: p.conditions ?? undefined,
            })),
            totalCount: permissions.length,
        };
    }

    // ============================================================================
    // МЕТОДЫ НАЗНАЧЕНИЯ РОЛЕЙ ПОЛЬЗОВАТЕЛЯМ
    // ============================================================================

    /**
     * Назначить роль пользователю
     * @param dto - DTO с данными назначения
     * @param tenantId - ID тенанта (null для системных ролей)
     * @param userRoles - Роли пользователя, который назначает (для проверки иерархии)
     * @returns AssignRoleResponse
     */
    public async assignRoleToUser(
        dto: AssignRoleDto,
        tenantId: number | null,
        userRoles: string[],
        auditContext?: {
            userId?: number;
            ipAddress?: string;
            userAgent?: string;
            requestId?: string;
        },
    ): Promise<AssignRoleResponse> {
        this.logger.log(
            { userId: dto.userId, roleId: dto.roleId, tenantId },
            'Запрос назначения роли пользователю с проверкой tenant isolation',
        );

        // Параллельная проверка пользователя и роли
        const [user, targetRoleExists, targetRole] = await Promise.all([
            this.userModel.findByPk(dto.userId),
            this.roleRepository.findRoleByIdWithoutIsolation(dto.roleId),
            this.roleRepository.findRoleById(dto.roleId, tenantId),
        ]);

        // Проверить существование пользователя
        if (!user) {
            this.notFound('Пользователь не найден');
        }

        // Проверить tenant isolation: пользователь должен быть из того же тенанта
        if (tenantId !== null && user.tenantId !== tenantId) {
            this.logger.warn(
                {
                    userId: dto.userId,
                    userTenantId: user.tenantId,
                    requestTenantId: tenantId,
                },
                'Нарушение tenant isolation при назначении роли',
            );
            throw new TenantIsolationViolationException(
                'назначение роли',
                user.tenantId ?? undefined,
                tenantId,
            );
        }

        // Проверить существование роли
        if (!targetRoleExists) {
            // Роль не существует вообще - возвращаем 404
            throw new RoleNotFoundException(dto.roleId);
        }

        // Проверить доступность роли с учётом tenant isolation
        if (!targetRole) {
            this.notFound('Роль не найдена');
        }

        // Проверить иерархию: может ли текущий пользователь управлять целевой ролью
        const managerRole = userRoles[0]; // Берем первую (высшую) роль
        if (managerRole && !canManageRole(managerRole, targetRole.role)) {
            const userLevel = getRoleLevel(managerRole);
            const requiredLevel = getRoleLevel(targetRole.role);
            throw new RoleHierarchyViolationException(
                'назначение роли',
                userLevel,
                requiredLevel,
            );
        }

        // Проверить, что роль активна
        // ВАЖНО: использовать getDataValue('isActive') вместо targetRole.isActive
        // Используем getDataValue для isActive из-за затенения геттеров Sequelize полями класса
        const isActive = targetRole.getDataValue('isActive');

        if (!isActive) {
            throw new BadRequestException('Нельзя назначать неактивную роль');
        }

        // Проверить дату истечения (не может быть в прошлом)
        const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
        if (expiresAt && expiresAt < new Date()) {
            throw new BadRequestException(
                'Дата истечения не может быть в прошлом',
            );
        }

        // Определить tenantId для назначения (из DTO или из контекста)
        // ВАЖНО: tenantId не может быть null для user_roles (обязательное поле)
        // Используем user.tenantId как fallback, так как он гарантированно установлен при создании пользователя
        const assignmentTenantId =
            dto.tenantId ?? tenantId ?? user.tenantId ?? 1;
        if (!assignmentTenantId) {
            throw new BadRequestException(
                'tenantId обязателен для назначения роли пользователю',
            );
        }

        // Назначить роль
        const userRole = await this.roleRepository.assignRoleToUser(
            dto.userId,
            dto.roleId,
            assignmentTenantId,
            null, // grantedBy будет установлен в контроллере при необходимости
            expiresAt,
            dto.metadata,
        );

        this.logger.log(
            {
                userId: dto.userId,
                roleId: dto.roleId,
                userRoleId: userRole.id,
                tenantId: assignmentTenantId,
            },
            'Роль успешно назначена пользователю',
        );

        // Создать запись в audit логе
        if (auditContext) {
            await this.auditService.createLog({
                entityType: 'user_role',
                entityId: userRole.id,
                action: AuditAction.ASSIGN,
                userId: auditContext.userId ?? null,
                oldValues: null,
                newValues: {
                    userId: dto.userId,
                    roleId: dto.roleId,
                    roleName: targetRole.role,
                    expiresAt: expiresAt ? expiresAt.toISOString() : null,
                    metadata: dto.metadata ?? null,
                    tenantId: assignmentTenantId,
                },
                ipAddress: auditContext.ipAddress ?? null,
                userAgent: auditContext.userAgent ?? null,
                requestId: auditContext.requestId ?? null,
                tenantId: assignmentTenantId,
            });
        }

        // Инвалидировать кэш ролей пользователя
        await this.userRolesCacheService.invalidateUserRoles(
            dto.userId,
            assignmentTenantId,
        );

        return {
            message: 'Роль успешно назначена пользователю',
            userRoleId: userRole.id,
            userId: dto.userId,
            roleId: dto.roleId,
            tenantId: assignmentTenantId,
        };
    }

    /**
     * Отозвать роль у пользователя
     * @param dto - DTO с данными отзыва
     * @param tenantId - ID тенанта (null для системных ролей)
     * @param userRoles - Роли пользователя, который отзывает (для проверки иерархии)
     * @returns RevokeRoleResponse
     */
    public async revokeRoleFromUser(
        dto: RevokeRoleDto,
        tenantId: number | null,
        userRoles: string[],
        auditContext?: {
            userId?: number;
            ipAddress?: string;
            userAgent?: string;
            requestId?: string;
        },
    ): Promise<RevokeRoleResponse> {
        this.logger.log(
            { userId: dto.userId, roleId: dto.roleId, tenantId },
            'Запрос отзыва роли у пользователя с проверкой tenant isolation',
        );

        // Параллельная проверка пользователя и роли
        const [user, targetRoleExists] = await Promise.all([
            this.userModel.findByPk(dto.userId),
            this.roleRepository.findRoleByIdWithoutIsolation(dto.roleId),
        ]);

        // Проверить существование пользователя
        if (!user) {
            this.notFound('Пользователь не найден');
        }

        // Проверить tenant isolation
        if (tenantId !== null && user.tenantId !== tenantId) {
            this.logger.warn(
                {
                    userId: dto.userId,
                    userTenantId: user.tenantId,
                    requestTenantId: tenantId,
                },
                'Нарушение tenant isolation при отзыве роли',
            );
            throw new TenantIsolationViolationException(
                'отзыв роли',
                user.tenantId ?? undefined,
                tenantId,
            );
        }

        // Проверить существование роли
        if (!targetRoleExists) {
            // Роль не существует вообще - возвращаем 404
            throw new RoleNotFoundException(dto.roleId);
        }

        // Проверить иерархию (проверяем на основе существующей роли)
        const managerRole = userRoles[0];

        if (managerRole && !canManageRole(managerRole, targetRoleExists.role)) {
            const userLevel = getRoleLevel(managerRole);
            const requiredLevel = getRoleLevel(targetRoleExists.role);
            throw new RoleHierarchyViolationException(
                'отзыв роли',
                userLevel,
                requiredLevel,
            );
        }

        // Определить tenantId для отзыва
        // ВАЖНО: tenantId не может быть null для user_roles (обязательное поле)
        // Используем user.tenantId как fallback, так как он гарантированно установлен при создании пользователя
        const assignmentTenantId =
            dto.tenantId ?? tenantId ?? user.tenantId ?? 1;
        if (!assignmentTenantId) {
            throw new BadRequestException(
                'tenantId обязателен для отзыва роли у пользователя',
            );
        }

        // Получить существующее назначение роли для audit лога
        const existingUserRole = await this.userRoleModel.findOne({
            where: {
                userId: dto.userId,
                roleId: dto.roleId,
                tenantId: assignmentTenantId,
            },
        });

        // Отозвать роль
        const deleted = await this.roleRepository.revokeRoleFromUser(
            dto.userId,
            dto.roleId,
            assignmentTenantId,
        );

        if (!deleted) {
            this.logger.warn(
                {
                    userId: dto.userId,
                    roleId: dto.roleId,
                    tenantId: assignmentTenantId,
                },
                'Назначение роли не найдено при отзыве',
            );
            this.notFound('Назначение роли не найдено');
        }

        this.logger.log(
            {
                userId: dto.userId,
                roleId: dto.roleId,
                tenantId: assignmentTenantId,
            },
            'Роль успешно отозвана у пользователя',
        );

        // Создать запись в audit логе
        if (auditContext && existingUserRole) {
            await this.auditService.createLog({
                entityType: 'user_role',
                entityId: existingUserRole.id,
                action: AuditAction.REVOKE,
                userId: auditContext.userId ?? null,
                oldValues: {
                    userId: dto.userId,
                    roleId: dto.roleId,
                    roleName: targetRoleExists.role,
                    tenantId: assignmentTenantId,
                },
                newValues: null,
                ipAddress: auditContext.ipAddress ?? null,
                userAgent: auditContext.userAgent ?? null,
                requestId: auditContext.requestId ?? null,
                tenantId: assignmentTenantId,
            });
        }

        // Инвалидировать кэш ролей пользователя
        await this.userRolesCacheService.invalidateUserRoles(
            dto.userId,
            assignmentTenantId,
        );

        return {
            message: 'Роль успешно отозвана у пользователя',
            userId: dto.userId,
            roleId: dto.roleId,
        };
    }

    /**
     * Получить все роли пользователя
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта (null для системных ролей)
     * @returns GetUserRolesResponse
     */
    public async getUserRoles(
        userId: number,
        tenantId: number | null,
    ): Promise<GetUserRolesResponse> {
        this.logger.log(
            { userId, tenantId },
            'Запрос ролей пользователя с проверкой tenant isolation',
        );

        // Проверить существование пользователя
        const user = await this.userModel.findByPk(userId);
        if (!user) {
            this.notFound('Пользователь не найден');
        }

        // Проверить tenant isolation
        if (tenantId !== null && user.tenantId !== tenantId) {
            this.logger.warn(
                {
                    userId,
                    userTenantId: user.tenantId,
                    requestTenantId: tenantId,
                },
                'Нарушение tenant isolation при получении ролей пользователя',
            );
            throw new TenantIsolationViolationException(
                'получение ролей пользователя',
                user.tenantId ?? undefined,
                tenantId,
            );
        }

        // Проверить кэш Redis (только для конкретного tenantId)
        if (tenantId !== null) {
            const cachedRoles = await this.userRolesCacheService.getUserRoles(
                userId,
                tenantId,
            );
            if (cachedRoles) {
                this.logger.debug(
                    { userId, tenantId },
                    'Роли пользователя получены из Redis кэша',
                );
                return {
                    userId,
                    roles: cachedRoles,
                    totalCount: cachedRoles.length,
                };
            }
        }

        // Получить роли из БД
        const userRoles = await this.roleRepository.findUserRoles(
            userId,
            tenantId,
        );

        this.logger.log(
            { userId, tenantId, rolesCount: userRoles.length },
            'Роли пользователя успешно получены из БД',
        );

        // Преобразовать в DTO
        const rolesDto = userRoles.map((ur) => ({
            id: ur.id,
            roleId: ur.roleId,
            roleName: ur.roleName,
            roleDescription: ur.roleDescription,
            roleLevel: ur.roleLevel,
            tenantId: ur.tenantId,
            grantedAt: ur.grantedAt?.toISOString() ?? undefined,
            expiresAt: ur.expiresAt?.toISOString() ?? undefined,
            isActive: ur.isActive,
            metadata: ur.metadata ?? undefined,
        }));

        // Сохранить в кэш Redis (только для конкретного tenantId)
        if (tenantId !== null) {
            await this.userRolesCacheService.setUserRoles(
                userId,
                tenantId,
                rolesDto,
            );
        }

        return {
            userId,
            roles: rolesDto,
            totalCount: rolesDto.length,
        };
    }

    // ============================================================================
    // МЕТОДЫ ИЕРАРХИИ РОЛЕЙ
    // ============================================================================

    /**
     * Получить полную иерархию ролей
     * @returns GetRoleHierarchyResponse
     */
    public async getRoleHierarchy(): Promise<GetRoleHierarchyResponse> {
        const allRoles = await this.roleRepository.findAllRolesGrouped();

        // Группировать роли по категориям
        const systemRoles = allRoles.filter((r) =>
            (SYSTEM_ROLES as readonly string[]).includes(r.role),
        );
        const tenantRoles = allRoles.filter((r) =>
            (STAFF_ROLES as readonly string[]).includes(r.role),
        );
        const customerRoles = allRoles.filter((r) =>
            ([...CUSTOMER_ROLES, ...GUEST_ROLES] as readonly string[]).includes(
                r.role,
            ),
        );

        return {
            systemRoles: systemRoles.map((r) => ({
                role: r.role,
                level: r.level,
                description: r.description,
                isSystemRole: r.isSystemRole,
            })),
            tenantRoles: tenantRoles.map((r) => ({
                role: r.role,
                level: r.level,
                description: r.description,
                isSystemRole: r.isSystemRole,
            })),
            customerRoles: customerRoles.map((r) => ({
                role: r.role,
                level: r.level,
                description: r.description,
                isSystemRole: r.isSystemRole,
            })),
            totalCount: allRoles.length,
        };
    }

    /**
     * Получить уровень роли и список управляемых ролей
     * @param role - Название роли
     * @returns GetRoleLevelResponse
     */
    public async getRoleLevel(role: string): Promise<GetRoleLevelResponse> {
        const roleModel = await this.roleCacheService.getCachedRole(role);
        if (!roleModel) {
            this.notFound(`Роль ${role} не найдена`);
        }

        const level = getRoleLevel(role);
        let category: 'system' | 'tenant' | 'customer';

        if (isSystemRole(role)) {
            category = 'system';
        } else if (isTenantRole(role)) {
            category = 'tenant';
        } else if (isCustomerRole(role)) {
            category = 'customer';
        } else {
            category = 'customer'; // По умолчанию
        }

        const manageableRoles = getManageableRoles(role);

        return {
            role,
            level,
            category,
            manageableRoles,
        };
    }

    // ============================================================================
    // АВТОМАТИЧЕСКОЕ НАЗНАЧЕНИЕ РОЛЕЙ
    // ============================================================================

    /**
     * Базовая функция для автоматического назначения роли по порогу суммы покупок
     * Используется для VIP и WHOLESALE ролей
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     * @param roleName - Имя роли для назначения
     * @param threshold - Порог суммы покупок
     * @returns Результат назначения роли
     */
    private async autoAssignRoleByThreshold(
        userId: number,
        tenantId: number,
        roleName: string,
        threshold: number,
    ): Promise<{ assigned: boolean; roleId?: number }> {
        try {
            // 1-4. Параллельные независимые проверки
            const [user, totalSpent, role] = await Promise.all([
                this.userModel.findByPk(userId),
                this.orderRepository.getUserTotalSpent(userId, tenantId),
                this.roleCacheService.getCachedRole(roleName),
            ]);

            // Проверка пользователя
            if (!user || user.tenantId !== tenantId) {
                this.logger.warn(
                    { userId, tenantId, roleName },
                    'Пользователь не найден или не принадлежит тенанту',
                );
                this.metricsCollector.recordRoleAutoAssignment(
                    roleName,
                    'user_not_found_or_wrong_tenant',
                    false,
                );
                return { assigned: false };
            }

            // Проверка порога
            if (totalSpent < threshold) {
                this.metricsCollector.recordRoleAutoAssignment(
                    roleName,
                    'threshold_not_met',
                    false,
                );
                return { assigned: false };
            }

            // Проверка роли
            if (!role?.isActive) {
                this.logger.warn(
                    { userId, tenantId, roleName },
                    `Роль ${roleName} не найдена или неактивна`,
                );
                this.metricsCollector.recordRoleAutoAssignment(
                    roleName,
                    'role_not_found_or_inactive',
                    false,
                );
                return { assigned: false };
            }

            // 5. Проверка идемпотентности (роль уже назначена)
            const userRoles = await this.roleRepository.findUserRoles(
                userId,
                tenantId,
            );
            const hasRole = userRoles.some((ur) => ur.roleId === role.id);
            if (hasRole) {
                this.metricsCollector.recordRoleAutoAssignment(
                    roleName,
                    'already_assigned',
                    false,
                );
                return { assigned: false, roleId: role.id };
            }

            // 6. Назначение роли
            await this.roleRepository.assignRoleToUser(
                userId,
                role.id,
                tenantId,
                null,
                null,
                {
                    auto_assigned: true,
                    total_spent: totalSpent,
                    threshold,
                    assigned_at: new Date().toISOString(),
                },
            );

            this.logger.log(
                `Автоматически назначена роль ${roleName} пользователю: userId=${userId}, tenantId=${tenantId}, roleId=${role.id}, roleName=${roleName}, totalSpent=${totalSpent}, threshold=${threshold}`,
            );
            this.metricsCollector.recordRoleAutoAssignment(
                roleName,
                'assigned',
                true,
            );

            return { assigned: true, roleId: role.id };
        } catch (error: unknown) {
            this.logger.error(
                { error, userId, tenantId, roleName },
                `Ошибка автоматического назначения роли ${roleName}`,
            );
            this.metricsCollector.recordRoleAutoAssignment(
                roleName,
                'error',
                false,
            );
            return { assigned: false };
        }
    }

    /**
     * Автоматически назначить VIP роль пользователю, если сумма покупок превышает порог
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     * @returns Результат назначения роли
     */
    public async autoAssignVipRole(
        userId: number,
        tenantId: number,
    ): Promise<{ assigned: boolean; roleId?: number }> {
        return this.autoAssignRoleByThreshold(
            userId,
            tenantId,
            'VIP_CUSTOMER',
            getVipRoleThreshold(),
        );
    }

    /**
     * Автоматически назначить WHOLESALE роль пользователю, если количество заказов превышает порог
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     * @returns Результат назначения роли
     */
    public async autoAssignWholesaleRole(
        userId: number,
        tenantId: number,
    ): Promise<{ assigned: boolean; roleId?: number }> {
        try {
            // 1. Проверка существования пользователя и принадлежности к тенанту
            const user = await this.userModel.findByPk(userId);
            if (!user || user.tenantId !== tenantId) {
                this.logger.warn(
                    { userId, tenantId },
                    'Пользователь не найден или не принадлежит тенанту',
                );
                this.metricsCollector.recordRoleAutoAssignment(
                    'WHOLESALE',
                    'user_not_found_or_wrong_tenant',
                    false,
                );
                return { assigned: false };
            }

            // 2. Получение количества заказов пользователя
            const orderCount = await this.orderRepository.getUserOrderCount(
                userId,
                tenantId,
            );
            const wholesaleThreshold = getWholesaleRoleThreshold();

            // 3. Проверка порога
            if (orderCount < wholesaleThreshold) {
                this.metricsCollector.recordRoleAutoAssignment(
                    'WHOLESALE',
                    'threshold_not_met',
                    false,
                );
                return { assigned: false };
            }

            // 4. Поиск WHOLESALE роли (с кэшированием)
            const wholesaleRole =
                await this.roleCacheService.getCachedRole('WHOLESALE');
            if (!wholesaleRole?.isActive) {
                this.logger.warn(
                    { userId, tenantId },
                    'Роль WHOLESALE не найдена или неактивна',
                );
                this.metricsCollector.recordRoleAutoAssignment(
                    'WHOLESALE',
                    'role_not_found_or_inactive',
                    false,
                );
                return { assigned: false };
            }

            // 5. Проверка идемпотентности (роль уже назначена)
            const userRoles = await this.roleRepository.findUserRoles(
                userId,
                tenantId,
            );
            const hasWholesaleRole = userRoles.some(
                (ur) => ur.roleId === wholesaleRole.id,
            );
            if (hasWholesaleRole) {
                this.metricsCollector.recordRoleAutoAssignment(
                    'WHOLESALE',
                    'already_assigned',
                    false,
                );
                return { assigned: false, roleId: wholesaleRole.id };
            }

            // 6. Назначение роли
            await this.roleRepository.assignRoleToUser(
                userId,
                wholesaleRole.id,
                tenantId,
                null,
                null,
                {
                    auto_assigned: true,
                    order_count: orderCount,
                    threshold: wholesaleThreshold,
                    assigned_at: new Date().toISOString(),
                },
            );

            this.logger.log(
                `Автоматически назначена WHOLESALE роль пользователю: userId=${userId}, tenantId=${tenantId}, roleId=${wholesaleRole.id}, roleName=WHOLESALE, orderCount=${orderCount}, threshold=${wholesaleThreshold}`,
            );
            this.metricsCollector.recordRoleAutoAssignment(
                'WHOLESALE',
                'assigned',
                true,
            );
            return { assigned: true, roleId: wholesaleRole.id };
        } catch (error: unknown) {
            this.logger.error(
                {
                    userId,
                    tenantId,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                },
                'Ошибка при автоматическом назначении WHOLESALE роли',
            );
            this.metricsCollector.recordRoleAutoAssignment(
                'WHOLESALE',
                'error',
                false,
            );
            return { assigned: false };
        }
    }

    /**
     * Оценить и обновить клиентские роли пользователя (VIP и WHOLESALE)
     * Выполняет проверку порогов и назначение/понижение ролей параллельно
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     * @returns Результаты назначения и понижения ролей
     */
    public async evaluateAndUpdateCustomerRoles(
        userId: number,
        tenantId: number,
    ): Promise<{
        vipAssigned: boolean;
        wholesaleAssigned: boolean;
        vipRevoked: boolean;
        wholesaleRevoked: boolean;
    }> {
        const [
            vipAssignResult,
            wholesaleAssignResult,
            vipRevokeResult,
            wholesaleRevokeResult,
        ] = await Promise.all([
            this.autoAssignVipRole(userId, tenantId),
            this.autoAssignWholesaleRole(userId, tenantId),
            this.autoRevokeVipRole(userId, tenantId),
            this.autoRevokeWholesaleRole(userId, tenantId),
        ]);

        return {
            vipAssigned: vipAssignResult.assigned,
            wholesaleAssigned: wholesaleAssignResult.assigned,
            vipRevoked: vipRevokeResult.revoked,
            wholesaleRevoked: wholesaleRevokeResult.revoked,
        };
    }

    /**
     * Автоматически понизить VIP роль пользователю, если сумма покупок ниже порога
     * Понижает только автоматически назначенные роли (не вручную назначенные администратором)
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     * @returns Результат понижения роли (revoked: true если роль была отозвана)
     */
    public async autoRevokeVipRole(
        userId: number,
        tenantId: number,
    ): Promise<{ revoked: boolean; roleId?: number }> {
        try {
            // 1. Проверка существования пользователя и принадлежности к тенанту
            const user = await this.userModel.findByPk(userId);
            if (!user || user.tenantId !== tenantId) {
                this.logger.warn(
                    { userId, tenantId },
                    'Пользователь не найден или не принадлежит тенанту',
                );
                this.metricsCollector.recordRoleAutoAssignment(
                    'VIP_CUSTOMER',
                    'revoke_user_not_found_or_wrong_tenant',
                    false,
                );
                return { revoked: false };
            }

            // 2. Поиск VIP роли (с кэшированием)
            const vipRole =
                await this.roleCacheService.getCachedRole('VIP_CUSTOMER');
            if (!vipRole) {
                return { revoked: false };
            }

            // 3. Проверка наличия VIP роли у пользователя
            const userRoles = await this.roleRepository.findUserRoles(
                userId,
                tenantId,
            );
            const userVipRole = userRoles.find(
                (ur) => ur.roleId === vipRole.id,
            );
            if (!userVipRole) {
                // Роль не назначена, нечего понижать
                return { revoked: false };
            }

            // 4. Проверка, что роль была автоматически назначена (не вручную)
            const userRoleRecord = await this.userRoleModel.findOne({
                where: {
                    userId,
                    roleId: vipRole.id,
                    tenantId,
                },
            });

            if (!userRoleRecord) {
                return { revoked: false };
            }

            const metadata = userRoleRecord.metadata ?? {};
            const isAutoAssigned = metadata.auto_assigned === true;

            if (!isAutoAssigned) {
                // Роль назначена вручную администратором, не понижаем
                this.logger.log(
                    `VIP роль пользователя ${userId} была назначена вручную, пропускаем понижение`,
                );
                this.metricsCollector.recordRoleAutoAssignment(
                    'VIP_CUSTOMER',
                    'revoke_skipped_manual_assignment',
                    false,
                );
                return { revoked: false, roleId: vipRole.id };
            }

            // 5. Получение суммы покупок пользователя
            const totalSpent = await this.orderRepository.getUserTotalSpent(
                userId,
                tenantId,
            );
            const vipThreshold = getVipRoleThreshold();

            // 6. Проверка порога - понижаем только если сумма < порога
            if (totalSpent >= vipThreshold) {
                // Порог все еще достигнут, не понижаем
                this.metricsCollector.recordRoleAutoAssignment(
                    'VIP_CUSTOMER',
                    'revoke_threshold_still_met',
                    false,
                );
                return { revoked: false, roleId: vipRole.id };
            }

            // 7. Понижение роли
            const revoked = await this.roleRepository.revokeRoleFromUser(
                userId,
                vipRole.id,
                tenantId,
            );

            if (revoked) {
                this.logger.log(
                    `Автоматически понижена VIP роль пользователю: userId=${userId}, tenantId=${tenantId}, roleId=${vipRole.id}, roleName=VIP_CUSTOMER, totalSpent=${totalSpent}, threshold=${vipThreshold}`,
                );
                this.metricsCollector.recordRoleAutoAssignment(
                    'VIP_CUSTOMER',
                    'revoked',
                    true,
                );
                return { revoked: true, roleId: vipRole.id };
            }

            return { revoked: false };
        } catch (error: unknown) {
            this.logger.error(
                {
                    userId,
                    tenantId,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                },
                'Ошибка при автоматическом понижении VIP роли',
            );
            this.metricsCollector.recordRoleAutoAssignment(
                'VIP_CUSTOMER',
                'revoke_error',
                false,
            );
            return { revoked: false };
        }
    }

    /**
     * Автоматически понизить WHOLESALE роль пользователю, если количество заказов ниже порога
     * Понижает только автоматически назначенные роли (не вручную назначенные администратором)
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     * @returns Результат понижения роли (revoked: true если роль была отозвана)
     */
    public async autoRevokeWholesaleRole(
        userId: number,
        tenantId: number,
    ): Promise<{ revoked: boolean; roleId?: number }> {
        try {
            // 1. Проверка существования пользователя и принадлежности к тенанту
            const user = await this.userModel.findByPk(userId);
            if (!user || user.tenantId !== tenantId) {
                this.logger.warn(
                    { userId, tenantId },
                    'Пользователь не найден или не принадлежит тенанту',
                );
                this.metricsCollector.recordRoleAutoAssignment(
                    'WHOLESALE',
                    'revoke_user_not_found_or_wrong_tenant',
                    false,
                );
                return { revoked: false };
            }

            // 2. Поиск WHOLESALE роли (с кэшированием)
            const wholesaleRole =
                await this.roleCacheService.getCachedRole('WHOLESALE');
            if (!wholesaleRole) {
                return { revoked: false };
            }

            // 3. Проверка наличия WHOLESALE роли у пользователя
            const userRoles = await this.roleRepository.findUserRoles(
                userId,
                tenantId,
            );
            const userWholesaleRole = userRoles.find(
                (ur) => ur.roleId === wholesaleRole.id,
            );
            if (!userWholesaleRole) {
                // Роль не назначена, нечего понижать
                return { revoked: false };
            }

            // 4. Проверка, что роль была автоматически назначена (не вручную)
            const userRoleRecord = await this.userRoleModel.findOne({
                where: {
                    userId,
                    roleId: wholesaleRole.id,
                    tenantId,
                },
            });

            if (!userRoleRecord) {
                return { revoked: false };
            }

            const metadata = userRoleRecord.metadata ?? {};
            const isAutoAssigned = metadata.auto_assigned === true;

            if (!isAutoAssigned) {
                // Роль назначена вручную администратором, не понижаем
                this.logger.log(
                    `WHOLESALE роль пользователя ${userId} была назначена вручную, пропускаем понижение`,
                );
                this.metricsCollector.recordRoleAutoAssignment(
                    'WHOLESALE',
                    'revoke_skipped_manual_assignment',
                    false,
                );
                return { revoked: false, roleId: wholesaleRole.id };
            }

            // 5. Получение количества заказов пользователя
            const orderCount = await this.orderRepository.getUserOrderCount(
                userId,
                tenantId,
            );
            const wholesaleThreshold = getWholesaleRoleThreshold();

            // 6. Проверка порога - понижаем только если количество < порога
            if (orderCount >= wholesaleThreshold) {
                // Порог все еще достигнут, не понижаем
                this.metricsCollector.recordRoleAutoAssignment(
                    'WHOLESALE',
                    'revoke_threshold_still_met',
                    false,
                );
                return { revoked: false, roleId: wholesaleRole.id };
            }

            // 7. Понижение роли
            const revoked = await this.roleRepository.revokeRoleFromUser(
                userId,
                wholesaleRole.id,
                tenantId,
            );

            if (revoked) {
                this.logger.log(
                    `Автоматически понижена WHOLESALE роль пользователю: userId=${userId}, tenantId=${tenantId}, roleId=${wholesaleRole.id}, roleName=WHOLESALE, orderCount=${orderCount}, threshold=${wholesaleThreshold}`,
                );
                this.metricsCollector.recordRoleAutoAssignment(
                    'WHOLESALE',
                    'revoked',
                    true,
                );
                return { revoked: true, roleId: wholesaleRole.id };
            }

            return { revoked: false };
        } catch (error: unknown) {
            this.logger.error(
                {
                    userId,
                    tenantId,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                },
                'Ошибка при автоматическом понижении WHOLESALE роли',
            );
            this.metricsCollector.recordRoleAutoAssignment(
                'WHOLESALE',
                'revoke_error',
                false,
            );
            return { revoked: false };
        }
    }

    // ============================================================================
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ============================================================================

    private notFound(message: string): never {
        // Извлекаем идентификатор из сообщения, если возможно
        const roleMatch = message.match(/Роль\s+(.+?)\s+не найдена/);
        if (roleMatch) {
            throw new RoleNotFoundException(roleMatch[1]);
        }
        throw new RoleNotFoundException();
    }
}
