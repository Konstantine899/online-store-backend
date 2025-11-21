import {
    RoleModel,
    RolePermissionModel,
    UserModel,
    UserRoleModel,
} from '@app/domain/models';
import { IRoleRepository } from '@app/domain/repositories';
import { CreateRoleDto } from '@app/infrastructure/dto';
import {
    CreateRoleResponse,
    GetListRoleResponse,
    GetRoleResponse,
} from '@app/infrastructure/responses';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';

@Injectable()
export class RoleRepository implements IRoleRepository {
    private static readonly ROLE_FIELDS = ['role', 'description'] as const;

    constructor(
        @InjectModel(RoleModel) private roleModel: typeof RoleModel,
        @InjectModel(RolePermissionModel)
        private rolePermissionModel: typeof RolePermissionModel,
        @InjectModel(UserRoleModel) private userRoleModel: typeof UserRoleModel,
        @InjectModel(UserModel) private userModel: typeof UserModel,
    ) {}

    private pickAllowedFields(dto: CreateRoleDto): {
        role: string;
        description: string;
    } {
        const { role, description } = dto;
        return { role, description };
    }

    public async createRole(dto: CreateRoleDto): Promise<CreateRoleResponse> {
        try {
            const allowedFields = this.pickAllowedFields(dto);
            const role = await this.roleModel.create(allowedFields);
            return this.findRole(role.role);
        } catch (error: unknown) {
            if (
                error instanceof Error &&
                error.name === 'SequelizeUniqueConstraintError'
            ) {
                throw new ConflictException('Роль уже существует');
            }
            throw error;
        }
    }

    public async findRole(role: string): Promise<GetRoleResponse> {
        return this.roleModel.findOne({
            where: { role },
        }) as Promise<GetRoleResponse>;
    }

    public async findListRole(): Promise<GetListRoleResponse[]> {
        return this.roleModel.findAll();
    }

    // ============================================================================
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ============================================================================

    /**
     * Найти роль по ID с проверкой tenant isolation
     * @param id - ID роли
     * @param tenantId - ID тенанта (null для системных ролей)
     * @returns RoleModel или null
     */
    public async findRoleById(
        id: number,
        tenantId?: number | null,
    ): Promise<RoleModel | null> {
        const where: WhereOptions = { id };

        // Tenant isolation: системные роли доступны всем, тенантские - только своему тенанту
        if (tenantId !== undefined && tenantId !== null) {
            where[Op.or as keyof WhereOptions] = [
                { tenantId, isSystemRole: false }, // Роли тенанта
                { isSystemRole: true, tenantId: null }, // Системные роли
            ];
        }

        return this.roleModel.findOne({ where });
    }

    /**
     * Найти роль по названию
     * @param role - Название роли
     * @returns RoleModel или null
     */
    public async findRoleByName(role: string): Promise<RoleModel | null> {
        return this.roleModel.findOne({ where: { role } });
    }

    /**
     * Получить все роли, сгруппированные для иерархии
     * @returns Массив всех ролей, отсортированных по level
     */
    public async findAllRolesGrouped(): Promise<RoleModel[]> {
        return this.roleModel.findAll({
            order: [['level', 'DESC']],
        });
    }

    // ============================================================================
    // МЕТОДЫ УПРАВЛЕНИЯ РАЗРЕШЕНИЯМИ
    // ============================================================================

    /**
     * Создать разрешение для роли
     * @param roleId - ID роли
     * @param resource - Ресурс
     * @param action - Действие
     * @param conditions - Условия (опционально)
     * @returns Созданная запись разрешения
     */
    public async createRolePermission(
        roleId: number,
        resource: string,
        action: string,
        conditions?: Record<string, unknown>,
    ): Promise<{
        id: number;
        roleId: number;
        resource: string;
        action: string;
    }> {
        try {
            const permission = await this.rolePermissionModel.create({
                roleId,
                resource,
                action,
                conditions: conditions ?? undefined,
            });

            return {
                id: permission.id,
                roleId: permission.roleId,
                resource: permission.resource,
                action: permission.action,
            };
        } catch (error: unknown) {
            if (
                error instanceof Error &&
                error.name === 'SequelizeUniqueConstraintError'
            ) {
                throw new ConflictException(
                    'Разрешение уже назначено этой роли',
                );
            }
            throw error;
        }
    }

    /**
     * Удалить разрешение у роли
     * @param roleId - ID роли
     * @param resource - Ресурс
     * @param action - Действие
     * @returns true если удалено, false если не найдено
     */
    public async deleteRolePermission(
        roleId: number,
        resource: string,
        action: string,
    ): Promise<boolean> {
        const deleted = await this.rolePermissionModel.destroy({
            where: { roleId, resource, action },
        });

        return deleted > 0;
    }

    /**
     * Получить все разрешения роли
     * @param roleId - ID роли
     * @returns Массив разрешений
     */
    public async findRolePermissions(roleId: number): Promise<
        Array<{
            id: number;
            resource: string;
            action: string;
            conditions: Record<string, unknown> | null;
        }>
    > {
        const permissions = await this.rolePermissionModel.findAll({
            where: { roleId },
        });

        return permissions.map((p) => ({
            id: p.id,
            resource: p.resource,
            action: p.action,
            conditions: p.conditions,
        }));
    }

    // ============================================================================
    // МЕТОДЫ НАЗНАЧЕНИЯ РОЛЕЙ ПОЛЬЗОВАТЕЛЯМ
    // ============================================================================

    /**
     * Назначить роль пользователю
     * @param userId - ID пользователя
     * @param roleId - ID роли
     * @param tenantId - ID тенанта
     * @param grantedBy - ID пользователя, который назначил роль (null для системных)
     * @param expiresAt - Дата истечения (null для бессрочных)
     * @param metadata - Метаданные назначения
     * @returns Созданная запись user_role
     */
    public async assignRoleToUser(
        userId: number,
        roleId: number,
        tenantId: number,
        grantedBy: number | null,
        expiresAt?: Date | null,
        metadata?: Record<string, unknown>,
    ): Promise<{
        id: number;
        userId: number;
        roleId: number;
        tenantId: number;
    }> {
        try {
            const userRole = await this.userRoleModel.create({
                userId,
                roleId,
                tenantId,
                grantedBy,
                grantedAt: new Date(),
                expiresAt: expiresAt ?? null,
                isActive: true,
                metadata: metadata ?? {},
            });

            return {
                id: userRole.id,
                userId: userRole.userId,
                roleId: userRole.roleId,
                tenantId: userRole.tenantId,
            };
        } catch (error: unknown) {
            if (
                error instanceof Error &&
                error.name === 'SequelizeUniqueConstraintError'
            ) {
                throw new ConflictException(
                    'Пользователь уже имеет эту роль в этом тенанте',
                );
            }
            throw error;
        }
    }

    /**
     * Отозвать роль у пользователя
     * @param userId - ID пользователя
     * @param roleId - ID роли
     * @param tenantId - ID тенанта
     * @returns true если удалено, false если не найдено
     */
    public async revokeRoleFromUser(
        userId: number,
        roleId: number,
        tenantId: number,
    ): Promise<boolean> {
        const deleted = await this.userRoleModel.destroy({
            where: { userId, roleId, tenantId },
        });

        return deleted > 0;
    }

    /**
     * Получить все роли пользователя
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта (опционально для фильтрации)
     * @returns Массив ролей пользователя
     */
    public async findUserRoles(
        userId: number,
        tenantId?: number | null,
    ): Promise<
        Array<{
            id: number;
            roleId: number;
            roleName: string;
            roleDescription: string;
            roleLevel: number;
            tenantId: number;
            grantedAt: Date;
            expiresAt: Date | null;
            isActive: boolean;
        }>
    > {
        const where: WhereOptions = { userId };

        if (tenantId !== undefined && tenantId !== null) {
            where.tenantId = tenantId;
        }

        const userRoles = await this.userRoleModel.findAll({
            where,
            include: [
                {
                    model: RoleModel,
                    attributes: ['id', 'role', 'description', 'level'],
                },
            ],
            order: [['grantedAt', 'DESC']],
        });

        return userRoles.map((ur) => ({
            id: ur.id,
            roleId: ur.roleId,
            roleName: ur.role?.role ?? '',
            roleDescription: ur.role?.description ?? '',
            roleLevel: ur.role?.level ?? 0,
            tenantId: ur.tenantId,
            grantedAt: ur.grantedAt,
            expiresAt: ur.expiresAt,
            isActive: ur.isActive,
        }));
    }
}
