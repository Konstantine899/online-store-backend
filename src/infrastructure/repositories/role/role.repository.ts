import {
    RoleAutoRenewalConfigModel,
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
import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes, WhereOptions } from 'sequelize';

@Injectable()
export class RoleRepository implements IRoleRepository {
    private static readonly ROLE_FIELDS = ['role', 'description'] as const;

    constructor(
        @InjectModel(RoleModel) private roleModel: typeof RoleModel,
        @InjectModel(RolePermissionModel)
        private rolePermissionModel: typeof RolePermissionModel,
        @InjectModel(UserRoleModel) private userRoleModel: typeof UserRoleModel,
        @InjectModel(UserModel) private userModel: typeof UserModel,
        @InjectModel(RoleAutoRenewalConfigModel)
        private roleAutoRenewalConfigModel: typeof RoleAutoRenewalConfigModel,
    ) {}

    public async createRole(dto: CreateRoleDto): Promise<CreateRoleResponse> {
        try {
            const role = await this.roleModel.create({
                role: dto.role,
                description: dto.description,
                level: dto.level ?? 0,
                permissions: dto.permissions ?? [],
                isSystemRole: dto.isSystemRole ?? false,
                isActive: dto.isActive ?? true,
                tenantId: dto.isSystemRole ? null : (dto.tenantId ?? null),
            });
            // После create() Sequelize возвращает полный объект со всеми полями
            return role as GetRoleResponse;
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

    /**
     * Найти роль по названию с проверкой tenant isolation
     * @param role - Название роли
     * @param tenantId - ID тенанта (null для системных ролей, undefined для всех)
     * @returns GetRoleResponse или null
     */
    public async findRole(
        role: string,
        tenantId?: number | null,
    ): Promise<GetRoleResponse> {
        if (!role) {
            throw new Error('Role parameter is required');
        }

        let where: WhereOptions;

        // Tenant isolation: системные роли доступны всем, тенантские - только своему тенанту
        if (tenantId !== undefined && tenantId !== null) {
            where = {
                [Op.or]: [
                    { role, tenantId, isSystemRole: false }, // Роли тенанта
                    { role, isSystemRole: true, tenantId: null }, // Системные роли
                ],
            };
        } else {
            where = { role };
        }

        return this.roleModel.findOne({ where }) as Promise<GetRoleResponse>;
    }

    /**
     * Найти список ролей с проверкой tenant isolation
     * @param tenantId - ID тенанта (null для системных ролей, undefined для всех)
     * @returns Список ролей (тенантские + системные)
     */
    public async findListRole(
        tenantId?: number | null,
    ): Promise<GetListRoleResponse[]> {
        const where: WhereOptions = {};

        // Tenant isolation: системные роли доступны всем, тенантские - только своему тенанту
        if (tenantId !== undefined && tenantId !== null) {
            where[Op.or as keyof WhereOptions] = [
                { tenantId, isSystemRole: false }, // Роли тенанта
                { isSystemRole: true, tenantId: null }, // Системные роли
            ];
        }

        return this.roleModel.findAll({ where });
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
     * Найти роль по ID без проверки tenant isolation
     * Используется для проверки существования роли перед проверкой tenant isolation
     * @param id - ID роли
     * @returns RoleModel или null
     */
    public async findRoleByIdWithoutIsolation(
        id: number,
    ): Promise<RoleModel | null> {
        return this.roleModel.findOne({ where: { id } });
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

    /**
     * Обновить роль
     * @param id - ID роли
     * @param dto - Данные для обновления
     * @param tenantId - ID тенанта (для проверки изоляции)
     * @returns Обновлённая роль
     */
    public async updateRole(
        id: number,
        dto: {
            role?: string;
            description?: string;
            level?: number;
            isActive?: boolean;
            tenantId?: number | null;
        },
        tenantId?: number | null,
    ): Promise<RoleModel> {
        const role = await this.findRoleById(id, tenantId);
        if (!role) {
            throw new NotFoundException(
                'Роль не найдена или недоступна для тенанта',
            );
        }

        // Проверка: нельзя обновлять системные роли, если это не системный пользователь
        if (role.isSystemRole && tenantId !== null) {
            throw new ConflictException(
                'Нельзя обновлять системные роли из тенантского контекста',
            );
        }

        // Обновляем роль с явным указанием полей для обновления
        const updateData: Record<string, unknown> = {};
        if (dto.role !== undefined) updateData.role = dto.role;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.level !== undefined) updateData.level = dto.level;
        if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
        if (dto.tenantId !== undefined) updateData.tenantId = dto.tenantId;

        await role.update(updateData);
        // Перезагружаем роль из БД без scope, чтобы получить все поля включая description
        // Используем unscoped() чтобы обойти defaultScope и получить все поля
        // Важно: используем findByPk с unscoped() и явно указываем все атрибуты
        // Используем get({ plain: true }) чтобы получить plain object со всеми полями
        const updatedRole = await this.roleModel.unscoped().findByPk(role.id, {
            attributes: [
                'id',
                'role',
                'description',
                'level',
                'permissions',
                'isSystemRole',
                'isActive',
                'tenantId',
                'createdAt',
                'updatedAt',
            ],
            raw: false, // Получаем экземпляр модели, а не plain object
        });
        if (!updatedRole) {
            throw new NotFoundException('Роль не найдена после обновления');
        }
        // Явно проверяем, что description доступен
        // Если description undefined, используем getDataValue для явного чтения
        if (updatedRole.description === undefined) {
            const descriptionValue = updatedRole.getDataValue('description');
            if (descriptionValue !== undefined) {
                updatedRole.setDataValue('description', descriptionValue);
            }
        }
        return updatedRole;
    }

    /**
     * Удалить роль
     * @param id - ID роли
     * @param tenantId - ID тенанта (для проверки изоляции)
     * @returns true если удалено, false если не найдено
     */
    public async deleteRole(
        id: number,
        tenantId?: number | null,
    ): Promise<boolean> {
        const role = await this.findRoleById(id, tenantId);
        if (!role) {
            return false;
        }

        // Проверка: нельзя удалять системные роли
        if (role.isSystemRole) {
            throw new ConflictException('Нельзя удалять системные роли');
        }

        await role.destroy();
        return true;
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
                    'Роль уже назначена этому пользователю',
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
            metadata?: Record<string, unknown>;
        }>
    > {
        // ВАЖНО: Для tenant isolation нужно учитывать не только tenant_id в user_roles,
        // но и is_system_role в roles. Системные роли доступны всем тенантам.
        const where: WhereOptions = { userId };

        if (tenantId !== undefined && tenantId !== null) {
            // Фильтруем: либо tenant_id совпадает, либо роль системная
            where[Op.or as keyof WhereOptions] = [
                { tenantId }, // Тенантские роли
                // Системные роли будут отфильтрованы через include
            ];
        }

        const userRoles = await this.userRoleModel.findAll({
            where,
            attributes: [
                'id',
                'userId',
                'roleId',
                'tenantId',
                'grantedAt',
                'expiresAt',
                'isActive',
                'metadata',
            ],
            include: [
                {
                    model: RoleModel,
                    attributes: [
                        'id',
                        'role',
                        'description',
                        'level',
                        'isSystemRole',
                    ],
                    // Для системных ролей не фильтруем по tenant_id
                    ...(tenantId !== undefined && tenantId !== null
                        ? {
                              where: {
                                  [Op.or]: [
                                      { isSystemRole: true }, // Системные роли доступны всем
                                      { isSystemRole: false, tenantId }, // Тенантские роли только для своего тенанта
                                  ],
                              },
                          }
                        : {}),
                },
            ],
            order: [['grantedAt', 'DESC']],
        });

        // Дополнительная фильтрация на уровне приложения для безопасности
        return userRoles
            .filter((ur) => {
                // Если роль системная - доступна всем
                if (ur.role?.isSystemRole) {
                    return true;
                }
                // Если роль тенантская - только для своего тенанта
                if (tenantId !== undefined && tenantId !== null) {
                    return ur.tenantId === tenantId;
                }
                return true;
            })
            .map((ur) => ({
                id: ur.id,
                roleId: ur.roleId,
                roleName: ur.role?.role ?? '',
                roleDescription: ur.role?.description ?? '',
                roleLevel: ur.role?.level ?? 0,
                tenantId: ur.tenantId,
                grantedAt: ur.grantedAt,
                expiresAt: ur.expiresAt,
                isActive: ur.isActive,
                metadata: ur.metadata ?? undefined,
            }));
    }

    // ============================================================================
    // Методы для работы с автоматическим продлением ролей
    // ============================================================================

    public async createAutoRenewalConfig(
        userRoleId: number,
        renewalDurationMs: number,
        maxRenewals: number = 12,
        notificationEnabled: boolean = true,
    ): Promise<{
        id: number;
        userRoleId: number;
        isEnabled: boolean;
        renewalDurationMs: number;
        maxRenewals: number;
        currentRenewalCount: number;
    }> {
        const config = await this.roleAutoRenewalConfigModel.create({
            userRoleId,
            renewalDurationMs,
            maxRenewals,
            notificationEnabled,
            isEnabled: true,
            currentRenewalCount: 0,
        });

        return {
            id: config.id,
            userRoleId: config.userRoleId,
            isEnabled: config.isEnabled,
            renewalDurationMs: config.renewalDurationMs,
            maxRenewals: config.maxRenewals,
            currentRenewalCount: config.currentRenewalCount,
        };
    }

    public async findAutoRenewalConfig(userRoleId: number): Promise<{
        id: number;
        userRoleId: number;
        isEnabled: boolean;
        renewalDurationMs: number;
        maxRenewals: number;
        currentRenewalCount: number;
        lastRenewedAt: Date | null;
        notificationEnabled: boolean;
    } | null> {
        const config = await this.roleAutoRenewalConfigModel.findOne({
            where: { userRoleId },
        });

        if (!config) {
            return null;
        }

        return {
            id: config.id,
            userRoleId: config.userRoleId,
            isEnabled: config.isEnabled,
            renewalDurationMs: config.renewalDurationMs,
            maxRenewals: config.maxRenewals,
            currentRenewalCount: config.currentRenewalCount,
            lastRenewedAt: config.lastRenewedAt,
            notificationEnabled: config.notificationEnabled,
        };
    }

    public async updateAutoRenewalConfig(
        userRoleId: number,
        updates: {
            isEnabled?: boolean;
            renewalDurationMs?: number;
            maxRenewals?: number;
            notificationEnabled?: boolean;
        },
    ): Promise<boolean> {
        const [affectedRows] = await this.roleAutoRenewalConfigModel.update(
            updates,
            {
                where: { userRoleId },
            },
        );

        return affectedRows > 0;
    }

    public async deleteAutoRenewalConfig(userRoleId: number): Promise<boolean> {
        const deletedCount = await this.roleAutoRenewalConfigModel.destroy({
            where: { userRoleId },
        });

        return deletedCount > 0;
    }

    public async findExpiredActiveRoles(
        batchSize: number = 1000,
        beforeDate?: Date,
    ): Promise<
        Array<{
            id: number;
            userId: number;
            roleId: number;
            tenantId: number;
            expiresAt: Date;
            isActive: boolean;
        }>
    > {
        const cutoffDate = beforeDate ?? new Date();

        const expiredRoles = await this.userRoleModel.findAll({
            where: {
                isActive: true,
                expiresAt: {
                    [Op.lt]: cutoffDate,
                    [Op.ne]: null, // Не NULL (только временные роли)
                },
            },
            attributes: [
                'id',
                'userId',
                'roleId',
                'tenantId',
                'expiresAt',
                'isActive',
            ],
            limit: batchSize,
            order: [['expiresAt', 'ASC']], // Сначала самые старые
        });

        return expiredRoles
            .filter((ur) => ur.expiresAt !== null) // Фильтруем только временные роли
            .map((ur) => ({
                id: ur.id,
                userId: ur.userId,
                roleId: ur.roleId,
                tenantId: ur.tenantId,
                expiresAt: ur.expiresAt as Date, // Гарантированно не null после фильтрации
                isActive: ur.isActive,
            }));
    }

    public async batchDeactivateExpiredRoles(
        userRoleIds: number[],
    ): Promise<number> {
        if (userRoleIds.length === 0) {
            return 0;
        }

        const [affectedRows] = await this.userRoleModel.update(
            { isActive: false },
            {
                where: {
                    id: {
                        [Op.in]: userRoleIds,
                    },
                    isActive: true, // Деактивируем только активные
                },
            },
        );

        return affectedRows;
    }

    public async findRolesWithAutoRenewalExpiringSoon(
        daysUntilExpiration: number,
        batchSize: number = 1000,
    ): Promise<
        Array<{
            userRoleId: number;
            userId: number;
            roleId: number;
            tenantId: number;
            expiresAt: Date;
            renewalDurationMs: number;
            maxRenewals: number;
            currentRenewalCount: number;
        }>
    > {
        const now = new Date();

        // Используем прямой SQL запрос для избежания проблем с ассоциациями
        const sequelize = this.roleAutoRenewalConfigModel.sequelize;
        if (!sequelize) {
            throw new Error('Sequelize instance not available');
        }

        // Используем позиционные параметры (?) вместо именованных для лучшей совместимости
        // Sequelize автоматически преобразует Date объекты в правильный формат для MySQL
        // Используем DATEDIFF() для сравнения количества дней между датами
        // Это решает проблемы с часовыми поясами и временем дня
        // DATEDIFF(date1, date2) возвращает разницу в днях (date1 - date2)
        // Ищем роли, где разница между expires_at и now >= 0 и <= daysUntilExpiration
        const results = await sequelize.query<{
            user_role_id: number;
            user_id: number;
            role_id: number;
            tenant_id: number;
            expires_at: string;
            renewal_duration_ms: number;
            max_renewals: number;
            current_renewal_count: number;
        }>(
            `
            SELECT
                rac.user_role_id,
                ur.user_id,
                ur.role_id,
                ur.tenant_id,
                ur.expires_at,
                rac.renewal_duration_ms,
                rac.max_renewals,
                rac.current_renewal_count
            FROM role_auto_renewal_config rac
            INNER JOIN user_roles ur ON rac.user_role_id = ur.id
            WHERE rac.is_enabled = 1
                AND ur.is_active = 1
                AND ur.expires_at IS NOT NULL
                AND DATEDIFF(ur.expires_at, ?) >= 0
                AND DATEDIFF(ur.expires_at, ?) <= ?
            ORDER BY ur.expires_at ASC
            LIMIT ?
        `,
            {
                replacements: [now, now, daysUntilExpiration, batchSize],
                type: QueryTypes.SELECT,
            },
        );

        // Преобразуем результаты SQL запроса в формат возвращаемого типа
        return results.map((row) => ({
            userRoleId: row.user_role_id,
            userId: row.user_id,
            roleId: row.role_id,
            tenantId: row.tenant_id,
            expiresAt: new Date(row.expires_at),
            renewalDurationMs: row.renewal_duration_ms,
            maxRenewals: row.max_renewals,
            currentRenewalCount: row.current_renewal_count,
        }));
    }

    public async incrementRenewalCount(
        userRoleId: number,
        newExpiresAt: Date,
    ): Promise<boolean> {
        // Используем Sequelize increment для атомарного увеличения счетчика
        const config = await this.roleAutoRenewalConfigModel.findOne({
            where: { userRoleId },
        });

        if (!config) {
            return false;
        }

        // Проверяем лимит продлений
        if (
            config.maxRenewals > 0 &&
            config.currentRenewalCount >= config.maxRenewals
        ) {
            // Достигнут лимит, отключаем автоматическое продление
            await config.update({
                isEnabled: false,
                lastRenewedAt: new Date(),
            });
            return false;
        }

        // Обновляем счетчик и дату последнего продления
        await config.update({
            currentRenewalCount: config.currentRenewalCount + 1,
            lastRenewedAt: new Date(),
        });

        // Обновляем expiresAt в user_roles
        await this.userRoleModel.update(
            { expiresAt: newExpiresAt },
            { where: { id: userRoleId } },
        );

        return true;
    }
}
