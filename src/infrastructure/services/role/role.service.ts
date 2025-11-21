import { UserModel } from '@app/domain/models';
import { IRoleService } from '@app/domain/services';
import {
    canManageRole,
    CUSTOMER_ROLES,
    getManageableRoles,
    getRoleLevel,
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
} from '@app/infrastructure/dto';
import { RoleRepository } from '@app/infrastructure/repositories';
import {
    AssignPermissionResponse,
    AssignRoleResponse,
    CreateRoleResponse,
    GetListRoleResponse,
    GetRoleHierarchyResponse,
    GetRoleLevelResponse,
    GetRolePermissionsResponse,
    GetRoleResponse,
    GetUserRolesResponse,
    RevokePermissionResponse,
    RevokeRoleResponse,
} from '@app/infrastructure/responses';
import {
    BadRequestException,
    ForbiddenException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class RoleService implements IRoleService {
    constructor(
        private readonly roleRepository: RoleRepository,
        @InjectModel(UserModel) private userModel: typeof UserModel,
    ) {}

    public async createRole(dto: CreateRoleDto): Promise<CreateRoleResponse> {
        return this.roleRepository.createRole(dto);
    }

    public async getRole(role: string): Promise<GetRoleResponse> {
        const foundRole = await this.roleRepository.findRole(role);
        if (!foundRole) {
            this.notFound(`Роль ${role} не найдена`);
        }
        return foundRole;
    }

    public async getListRole(): Promise<GetListRoleResponse[]> {
        const roles = await this.roleRepository.findListRole();
        if (!roles) {
            this.notFound('Роли не найдены');
        }
        return roles;
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
        // Проверить существование роли и tenant isolation
        const role = await this.roleRepository.findRoleById(
            dto.roleId,
            tenantId,
        );
        if (!role) {
            this.notFound('Роль не найдена');
        }

        // Создать разрешение
        const permission = await this.roleRepository.createRolePermission(
            dto.roleId,
            dto.resource,
            dto.action,
            dto.conditions,
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
        // Проверить существование роли и tenant isolation
        const role = await this.roleRepository.findRoleById(
            dto.roleId,
            tenantId,
        );
        if (!role) {
            this.notFound('Роль не найдена');
        }

        // Удалить разрешение
        const deleted = await this.roleRepository.deleteRolePermission(
            dto.roleId,
            dto.resource,
            dto.action,
        );

        if (!deleted) {
            this.notFound('Разрешение не найдено');
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
        // Проверить существование роли и tenant isolation
        const role = await this.roleRepository.findRoleById(roleId, tenantId);
        if (!role) {
            this.notFound('Роль не найдена');
        }

        // Получить разрешения
        const permissions =
            await this.roleRepository.findRolePermissions(roleId);

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
        // Проверить существование пользователя
        const user = await this.userModel.findByPk(dto.userId);
        if (!user) {
            this.notFound('Пользователь не найден');
        }

        // Проверить tenant isolation: пользователь должен быть из того же тенанта
        if (tenantId !== null && user.tenantId !== tenantId) {
            throw new ForbiddenException(
                'Нельзя назначать роли пользователям из других тенантов',
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
            throw new ForbiddenException(
                'Недостаточно прав для назначения этой роли',
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
        // Проверить существование пользователя
        const user = await this.userModel.findByPk(dto.userId);
        if (!user) {
            this.notFound('Пользователь не найден');
        }

        // Проверить tenant isolation
        if (tenantId !== null && user.tenantId !== tenantId) {
            throw new ForbiddenException(
                'Нельзя отзывать роли у пользователей из других тенантов',
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

        // Проверить иерархию
        const managerRole = userRoles[0];
        if (managerRole && !canManageRole(managerRole, targetRole.role)) {
            throw new ForbiddenException(
                'Недостаточно прав для отзыва этой роли',
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
            this.notFound('Назначение роли не найдено');
        }

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
        // Проверить существование пользователя
        const user = await this.userModel.findByPk(userId);
        if (!user) {
            this.notFound('Пользователь не найден');
        }

        // Проверить tenant isolation
        if (tenantId !== null && user.tenantId !== tenantId) {
            throw new ForbiddenException(
                'Нельзя получить роли пользователей из других тенантов',
            );
        }

        // Получить роли
        const userRoles = await this.roleRepository.findUserRoles(
            userId,
            tenantId,
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
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ============================================================================

    private notFound(message: string): never {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }
}
