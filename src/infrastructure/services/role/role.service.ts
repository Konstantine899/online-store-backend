import { UserModel, UserRoleModel } from '@app/domain/models';
import { IRoleService } from '@app/domain/services';
import { MetricsCollector } from '@app/infrastructure/common/services';
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

@Injectable()
export class RoleService implements IRoleService {
    private readonly logger = new Logger(RoleService.name);

    constructor(
        private readonly roleRepository: RoleRepository,
        private readonly orderRepository: OrderRepository,
        @InjectModel(UserModel) private userModel: typeof UserModel,
        @InjectModel(UserRoleModel)
        private userRoleModel: typeof UserRoleModel,
        private readonly metricsCollector: MetricsCollector,
    ) {}

    public async createRole(dto: CreateRoleDto): Promise<CreateRoleResponse> {
        return this.roleRepository.createRole(dto);
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
    ): Promise<UpdateRoleResponse> {
        this.logger.log(
            { roleId: id, tenantId, updatedFields: Object.keys(dto) },
            'Запрос обновления роли с проверкой tenant isolation',
        );

        const role = await this.roleRepository.updateRole(id, dto, tenantId);

        // Получить разрешения роли
        const permissions = await this.roleRepository.findRolePermissions(
            role.id,
        );

        this.logger.log(
            { roleId: id, roleName: role.role, tenantId },
            'Роль успешно обновлена',
        );

        return {
            message: 'Роль успешно обновлена',
            id: role.id,
            role: role.role,
            description: role.description,
            level: role.level,
            permissions: permissions.map((p) => ({
                resource: p.resource,
                action: p.action,
                conditions: p.conditions,
            })),
            isSystemRole: role.isSystemRole,
            isActive: role.isActive,
            tenantId: role.tenantId,
            updatedAt: role.updatedAt,
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

        const deleted = await this.roleRepository.deleteRole(id, tenantId);
        if (!deleted) {
            this.logger.warn(
                { roleId: id, tenantId },
                'Не удалось удалить роль',
            );
            throw new RoleNotFoundException(id);
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
    ): Promise<AssignPermissionResponse> {
        this.logger.log(
            { roleId: dto.roleId, resource: dto.resource, action: dto.action, tenantId },
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
            { roleId: dto.roleId, permissionId: permission.id, resource: dto.resource, action: dto.action, tenantId },
            'Разрешение успешно назначено роли',
        );

        return {
            message: 'Разрешение успешно назначено роли',
            permissionId: permission.id,
            roleId: permission.roleId,
            resource: permission.resource,
            action: permission.action,
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
    ): Promise<RevokePermissionResponse> {
        this.logger.log(
            { roleId: dto.roleId, resource: dto.resource, action: dto.action, tenantId },
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

        // Удалить разрешение
        const deleted = await this.roleRepository.deleteRolePermission(
            dto.roleId,
            dto.resource,
            dto.action,
        );

        if (!deleted) {
            this.logger.warn(
                { roleId: dto.roleId, resource: dto.resource, action: dto.action, tenantId },
                'Разрешение не найдено при отзыве',
            );
            this.notFound('Разрешение не найдено');
        }

        this.logger.log(
            { roleId: dto.roleId, resource: dto.resource, action: dto.action, tenantId },
            'Разрешение успешно отозвано у роли',
        );

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
    ): Promise<AssignRoleResponse> {
        this.logger.log(
            { userId: dto.userId, roleId: dto.roleId, tenantId },
            'Запрос назначения роли пользователю с проверкой tenant isolation',
        );

        // Проверить существование пользователя
        const user = await this.userModel.findByPk(dto.userId);
        if (!user) {
            this.notFound('Пользователь не найден');
        }

        // Проверить tenant isolation: пользователь должен быть из того же тенанта
        if (tenantId !== null && user.tenantId !== tenantId) {
            this.logger.warn(
                { userId: dto.userId, userTenantId: user.tenantId, requestTenantId: tenantId },
                'Нарушение tenant isolation при назначении роли',
            );
            throw new TenantIsolationViolationException(
                'назначение роли',
                user.tenantId ?? undefined,
                tenantId,
            );
        }

        // Получить целевую роль
        const targetRole = await this.roleRepository.findRoleById(
            dto.roleId,
            tenantId,
        );
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
        if (!targetRole.isActive) {
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
        const assignmentTenantId = dto.tenantId ?? tenantId ?? user.tenantId;

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
            { userId: dto.userId, roleId: dto.roleId, userRoleId: userRole.id, tenantId: assignmentTenantId },
            'Роль успешно назначена пользователю',
        );

        return {
            message: 'Роль успешно назначена пользователю',
            userRoleId: userRole.id,
            userId: userRole.userId,
            roleId: userRole.roleId,
            tenantId: userRole.tenantId,
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
    ): Promise<RevokeRoleResponse> {
        this.logger.log(
            { userId: dto.userId, roleId: dto.roleId, tenantId },
            'Запрос отзыва роли у пользователя с проверкой tenant isolation',
        );

        // Проверить существование пользователя
        const user = await this.userModel.findByPk(dto.userId);
        if (!user) {
            this.notFound('Пользователь не найден');
        }

        // Проверить tenant isolation
        if (tenantId !== null && user.tenantId !== tenantId) {
            this.logger.warn(
                { userId: dto.userId, userTenantId: user.tenantId, requestTenantId: tenantId },
                'Нарушение tenant isolation при отзыве роли',
            );
            throw new TenantIsolationViolationException(
                'отзыв роли',
                user.tenantId ?? undefined,
                tenantId,
            );
        }

        // Получить целевую роль
        const targetRole = await this.roleRepository.findRoleById(
            dto.roleId,
            tenantId,
        );
        if (!targetRole) {
            throw new RoleNotFoundException(dto.roleId);
        }

        // Проверить иерархию
        const managerRole = userRoles[0];
        if (managerRole && !canManageRole(managerRole, targetRole.role)) {
            const userLevel = getRoleLevel(managerRole);
            const requiredLevel = getRoleLevel(targetRole.role);
            throw new RoleHierarchyViolationException(
                'отзыв роли',
                userLevel,
                requiredLevel,
            );
        }

        // Определить tenantId для отзыва
        const assignmentTenantId = dto.tenantId ?? tenantId ?? user.tenantId;

        // Отозвать роль
        const deleted = await this.roleRepository.revokeRoleFromUser(
            dto.userId,
            dto.roleId,
            assignmentTenantId,
        );

        if (!deleted) {
            this.logger.warn(
                { userId: dto.userId, roleId: dto.roleId, tenantId: assignmentTenantId },
                'Назначение роли не найдено при отзыве',
            );
            this.notFound('Назначение роли не найдено');
        }

        this.logger.log(
            { userId: dto.userId, roleId: dto.roleId, tenantId: assignmentTenantId },
            'Роль успешно отозвана у пользователя',
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
                { userId, userTenantId: user.tenantId, requestTenantId: tenantId },
                'Нарушение tenant isolation при получении ролей пользователя',
            );
            throw new TenantIsolationViolationException(
                'получение ролей пользователя',
                user.tenantId ?? undefined,
                tenantId,
            );
        }

        // Получить роли
        const userRoles = await this.roleRepository.findUserRoles(
            userId,
            tenantId,
        );

        this.logger.log(
            { userId, tenantId, rolesCount: userRoles.length },
            'Роли пользователя успешно получены',
        );

        return {
            userId,
            roles: userRoles.map((ur) => ({
                id: ur.id,
                roleName: ur.roleName,
                roleDescription: ur.roleDescription,
                roleLevel: ur.roleLevel,
                tenantId: ur.tenantId,
                grantedAt: ur.grantedAt.toISOString(),
                expiresAt: ur.expiresAt?.toISOString(),
                isActive: ur.isActive,
            })),
            totalCount: userRoles.length,
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
        const roleModel = await this.roleRepository.findRoleByName(role);
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
     * Автоматически назначить VIP роль пользователю, если сумма покупок превышает порог
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     * @returns Результат назначения роли
     */
    public async autoAssignVipRole(
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
                    'VIP_CUSTOMER',
                    'user_not_found_or_wrong_tenant',
                    false,
                );
                return { assigned: false };
            }

            // 2. Получение суммы покупок пользователя
            const totalSpent = await this.orderRepository.getUserTotalSpent(
                userId,
                tenantId,
            );
            const vipThreshold = getVipRoleThreshold();

            // 3. Проверка порога
            if (totalSpent < vipThreshold) {
                this.metricsCollector.recordRoleAutoAssignment(
                    'VIP_CUSTOMER',
                    'threshold_not_met',
                    false,
                );
                return { assigned: false };
            }

            // 4. Поиск VIP роли
            const vipRole =
                await this.roleRepository.findRoleByName('VIP_CUSTOMER');
            if (!vipRole?.isActive) {
                this.logger.warn(
                    { userId, tenantId },
                    'Роль VIP_CUSTOMER не найдена или неактивна',
                );
                this.metricsCollector.recordRoleAutoAssignment(
                    'VIP_CUSTOMER',
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
            const hasVipRole = userRoles.some((ur) => ur.roleId === vipRole.id);
            if (hasVipRole) {
                this.metricsCollector.recordRoleAutoAssignment(
                    'VIP_CUSTOMER',
                    'already_assigned',
                    false,
                );
                return { assigned: false, roleId: vipRole.id };
            }

            // 6. Назначение роли
            await this.roleRepository.assignRoleToUser(
                userId,
                vipRole.id,
                tenantId,
                null,
                null,
                {
                    auto_assigned: true,
                    total_spent: totalSpent,
                    threshold: vipThreshold,
                    assigned_at: new Date().toISOString(),
                },
            );

            this.logger.log(
                `Автоматически назначена VIP роль пользователю: userId=${userId}, tenantId=${tenantId}, roleId=${vipRole.id}, roleName=VIP_CUSTOMER, totalSpent=${totalSpent}, threshold=${vipThreshold}`,
            );
            this.metricsCollector.recordRoleAutoAssignment(
                'VIP_CUSTOMER',
                'assigned',
                true,
            );
            return { assigned: true, roleId: vipRole.id };
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
                'Ошибка при автоматическом назначении VIP роли',
            );
            this.metricsCollector.recordRoleAutoAssignment(
                'VIP_CUSTOMER',
                'error',
                false,
            );
            return { assigned: false };
        }
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

            // 4. Поиск WHOLESALE роли
            const wholesaleRole =
                await this.roleRepository.findRoleByName('WHOLESALE');
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

            // 2. Поиск VIP роли
            const vipRole =
                await this.roleRepository.findRoleByName('VIP_CUSTOMER');
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

            // 2. Поиск WHOLESALE роли
            const wholesaleRole =
                await this.roleRepository.findRoleByName('WHOLESALE');
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
