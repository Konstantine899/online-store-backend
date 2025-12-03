import {
    AuditLogModel,
    RoleAutoRenewalConfigModel,
    RoleModel,
    UserRoleModel,
} from '@app/domain/models';
import { IRoleAnalyticsRepository } from '@app/domain/repositories';
import { TenantContext } from '@app/infrastructure/common/context';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes } from 'sequelize';

/**
 * RoleAnalyticsRepository
 * Репозиторий для получения аналитики по ролям и разрешениям
 *
 * Использует SQL агрегацию для эффективной обработки больших объемов данных.
 * Все методы учитывают tenant isolation - TENANT_ADMIN видит только данные своего тенанта.
 *
 * Методы:
 * - getRoleUsageMetrics: метрики использования ролей (общая статистика)
 * - getRoleUsageMetricsById: метрики использования конкретной роли
 * - getPermissionUsageMetrics: метрики использования разрешений
 * - getRoleOperationsMetrics: метрики операций назначения/отзыва (из audit_logs)
 * - getAutoAssignmentMetrics: метрики автоматических назначений
 * - getExpirationMetrics: метрики истечения ролей
 * - getHierarchyMetrics: метрики иерархии ролей
 * - getDistributionByTenant: распределение ролей по тенантам
 */
@Injectable()
export class RoleAnalyticsRepository implements IRoleAnalyticsRepository {
    private readonly logger = new Logger(RoleAnalyticsRepository.name);

    constructor(
        @InjectModel(RoleModel) private roleModel: typeof RoleModel,
        @InjectModel(UserRoleModel) private userRoleModel: typeof UserRoleModel,
        @InjectModel(RoleAutoRenewalConfigModel)
        private roleAutoRenewalConfigModel: typeof RoleAutoRenewalConfigModel,
        @InjectModel(AuditLogModel)
        private auditLogModel: typeof AuditLogModel,
        private readonly tenantContext: TenantContext,
    ) {}

    /**
     * Получить tenantId с поддержкой test режима
     * @private
     */
    private getTenantIdSafe(): number | null {
        if (process.env.NODE_ENV === 'test') {
            return this.tenantContext.getTenantIdOrNull() ?? 1;
        }
        return this.tenantContext.getTenantIdOrNull();
    }

    /**
     * Получить метрики использования ролей (общая статистика)
     * @param tenantId - ID тенанта (опционально, для SUPER_ADMIN)
     * @returns метрики использования ролей
     */
    public async getRoleUsageMetrics(tenantId?: number | null): Promise<{
        totalRoles: number;
        activeRoles: number;
        inactiveRoles: number;
        systemRoles: number;
        tenantRoles: number;
        rolesWithExpiration: number;
        rolesByLevel: Array<{ level: number; count: number }>;
        topUsedRoles: Array<{
            roleId: number;
            roleName: string;
            userCount: number;
            percentage: number;
        }>;
    }> {
        try {
            const effectiveTenantId = tenantId ?? this.getTenantIdSafe();
            const sequelize = this.roleModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            const startTime = Date.now();
            this.logger.log({
                tenantId: effectiveTenantId,
                message: 'Запрос метрик использования ролей',
            });

            // Общая статистика ролей
            const [roleStats] = await sequelize.query<{
                totalRoles: number;
                activeRoles: number;
                inactiveRoles: number;
                systemRoles: number;
                tenantRoles: number;
            }>(
                `
                SELECT
                    COUNT(*) as totalRoles,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeRoles,
                    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactiveRoles,
                    SUM(CASE WHEN is_system_role = 1 THEN 1 ELSE 0 END) as systemRoles,
                    SUM(CASE WHEN is_system_role = 0 THEN 1 ELSE 0 END) as tenantRoles
                FROM role
                WHERE (? IS NULL OR tenant_id = ? OR is_system_role = 1)
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // Количество ролей с временным истечением (есть expiresAt в user_roles)
            const [expirationStats] = await sequelize.query<{
                rolesWithExpiration: number;
            }>(
                `
                SELECT COUNT(DISTINCT ur.role_id) as rolesWithExpiration
                FROM user_roles ur
                INNER JOIN role r ON ur.role_id = r.id
                WHERE ur.expires_at IS NOT NULL
                    AND ur.is_active = 1
                    AND (? IS NULL OR r.tenant_id = ? OR r.is_system_role = 1)
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // Распределение ролей по уровням
            const rolesByLevel = await sequelize.query<{
                level: number;
                count: number;
            }>(
                `
                SELECT
                    level,
                    COUNT(*) as count
                FROM role
                WHERE (? IS NULL OR tenant_id = ? OR is_system_role = 1)
                GROUP BY level
                ORDER BY level ASC
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // Общее количество пользователей для расчета процентов
            const [totalUsersResult] = await sequelize.query<{
                totalUsers: number;
            }>(
                `
                SELECT COUNT(DISTINCT id) as totalUsers
                FROM user
                WHERE is_deleted = 0
                    AND (? IS NULL OR tenant_id = ?)
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            const totalUsers = Number(totalUsersResult?.totalUsers) || 0;

            // Топ-10 наиболее используемых ролей с процентами
            const topUsedRoles = await sequelize.query<{
                roleId: number;
                roleName: string;
                userCount: number;
            }>(
                `
                SELECT
                    r.id as roleId,
                    r.role as roleName,
                    COUNT(DISTINCT ur.user_id) as userCount
                FROM role r
                INNER JOIN user_roles ur ON r.id = ur.role_id
                INNER JOIN user u ON ur.user_id = u.id
                WHERE ur.is_active = 1
                    AND u.is_deleted = 0
                    AND (? IS NULL OR r.tenant_id = ? OR r.is_system_role = 1)
                    AND (? IS NULL OR u.tenant_id = ?)
                GROUP BY r.id, r.role
                ORDER BY userCount DESC
                LIMIT 10
            `,
                {
                    replacements: [
                        effectiveTenantId,
                        effectiveTenantId,
                        effectiveTenantId,
                        effectiveTenantId,
                    ],
                    type: QueryTypes.SELECT,
                },
            );

            const executionTime = Date.now() - startTime;
            this.logger.log({
                tenantId: effectiveTenantId,
                executionTimeMs: executionTime,
                message: 'Метрики использования ролей получены',
            });

            return {
                totalRoles: Number(roleStats?.totalRoles) || 0,
                activeRoles: Number(roleStats?.activeRoles) || 0,
                inactiveRoles: Number(roleStats?.inactiveRoles) || 0,
                systemRoles: Number(roleStats?.systemRoles) || 0,
                tenantRoles: Number(roleStats?.tenantRoles) || 0,
                rolesWithExpiration:
                    Number(expirationStats?.rolesWithExpiration) || 0,
                rolesByLevel: rolesByLevel.map((row) => ({
                    level: Number(row.level) || 0,
                    count: Number(row.count) || 0,
                })),
                topUsedRoles: topUsedRoles.map((row) => {
                    const userCount = Number(row.userCount) || 0;
                    const percentage =
                        totalUsers > 0
                            ? Number(
                                  ((userCount / totalUsers) * 100).toFixed(2),
                              )
                            : 0;
                    return {
                        roleId: Number(row.roleId) || 0,
                        roleName: row.roleName,
                        userCount,
                        percentage,
                    };
                }),
            };
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    tenantId,
                },
                'Ошибка при получении метрик использования ролей',
            );
            throw error;
        }
    }

    /**
     * Получить метрики использования конкретной роли
     * @param roleId - ID роли
     * @param tenantId - ID тенанта (опционально, для SUPER_ADMIN)
     * @returns метрики использования роли или null, если роль не найдена
     */
    public async getRoleUsageMetricsById(
        roleId: number,
        tenantId?: number | null,
    ): Promise<{
        roleId: number;
        roleName: string;
        userCount: number;
        totalUsers: number;
        percentage: number;
        averageDuration: number | null;
        autoAssignmentsCount: number;
        manualAssignmentsCount: number;
    } | null> {
        try {
            const effectiveTenantId = tenantId ?? this.getTenantIdSafe();
            const sequelize = this.roleModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            const startTime = Date.now();
            this.logger.log({
                roleId,
                tenantId: effectiveTenantId,
                message: 'Запрос метрик использования роли',
            });

            // Проверяем, что роль существует и доступна для тенанта
            const role = await this.roleModel.findOne({
                where: {
                    id: roleId,
                    ...(effectiveTenantId !== null
                        ? {
                              [Op.or]: [
                                  { tenantId: effectiveTenantId },
                                  { isSystemRole: true },
                              ],
                          }
                        : {}),
                },
            });

            if (!role) {
                return null;
            }

            // Количество пользователей с этой ролью
            const [userStats] = await sequelize.query<{
                userCount: number;
                totalUsers: number;
            }>(
                `
                SELECT
                    COUNT(DISTINCT ur.user_id) as userCount,
                    (SELECT COUNT(DISTINCT id) FROM user WHERE tenant_id = ? AND is_deleted = 0) as totalUsers
                FROM user_roles ur
                INNER JOIN user u ON ur.user_id = u.id
                WHERE ur.role_id = ?
                    AND ur.is_active = 1
                    AND u.is_deleted = 0
                    AND u.tenant_id = ?
            `,
                {
                    replacements: [
                        effectiveTenantId,
                        roleId,
                        effectiveTenantId,
                    ],
                    type: QueryTypes.SELECT,
                },
            );

            const userCount = Number(userStats?.userCount) || 0;
            const totalUsers = Number(userStats?.totalUsers) || 0;
            const userPercentage =
                totalUsers > 0 ? (userCount / totalUsers) * 100 : 0;

            // Средняя длительность обладания ролью (для ролей с expiresAt)
            const [durationStats] = await sequelize.query<{
                averageDurationDays: number | null;
            }>(
                `
                SELECT
                    AVG(DATEDIFF(COALESCE(ur.expires_at, NOW()), ur.granted_at)) as averageDurationDays
                FROM user_roles ur
                INNER JOIN user u ON ur.user_id = u.id
                WHERE ur.role_id = ?
                    AND ur.expires_at IS NOT NULL
                    AND u.tenant_id = ?
            `,
                {
                    replacements: [roleId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // Количество автоматических назначений (из audit_logs, где metadata содержит autoAssigned: true)
            const [autoAssignmentsResult] = await sequelize.query<{
                autoAssignmentsCount: number;
            }>(
                `
                SELECT COUNT(*) as autoAssignmentsCount
                FROM audit_logs al
                WHERE al.entity_type = 'user_role'
                    AND al.action = 'ASSIGN'
                    AND al.entity_id IN (
                        SELECT id FROM user_roles WHERE role_id = ? AND is_active = 1
                    )
                    AND JSON_EXTRACT(al.metadata, '$.autoAssigned') = true
                    AND (? IS NULL OR al.tenant_id = ?)
            `,
                {
                    replacements: [
                        roleId,
                        effectiveTenantId,
                        effectiveTenantId,
                    ],
                    type: QueryTypes.SELECT,
                },
            );

            const autoAssignmentsCount =
                Number(autoAssignmentsResult?.autoAssignmentsCount) || 0;

            // Количество ручных назначений (общее количество - автоматические)
            const manualAssignmentsCount = userCount - autoAssignmentsCount;

            const executionTime = Date.now() - startTime;
            this.logger.log({
                roleId,
                tenantId: effectiveTenantId,
                executionTimeMs: executionTime,
                message: 'Метрики использования роли получены',
            });

            return {
                roleId,
                roleName: role.role,
                userCount,
                totalUsers,
                percentage: Number(userPercentage.toFixed(2)),
                averageDuration:
                    durationStats?.averageDurationDays !== null
                        ? Number(durationStats.averageDurationDays)
                        : null,
                autoAssignmentsCount,
                manualAssignmentsCount,
            };
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    roleId,
                    tenantId,
                },
                'Ошибка при получении метрик использования роли',
            );
            throw error;
        }
    }

    /**
     * Получить метрики использования разрешений
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns метрики использования разрешений
     */
    public async getPermissionUsageMetrics(tenantId: number | null): Promise<{
        totalUniquePermissions: number;
        topUsedPermissions: Array<{
            resource: string;
            action: string;
            roleCount: number;
            percentage: number;
        }>;
        permissionsByResource: Array<{
            resource: string;
            count: number;
        }>;
        permissionsByAction: Array<{
            action: string;
            count: number;
        }>;
        unusedPermissions: Array<{
            resource: string;
            action: string;
        }>;
    }> {
        try {
            const effectiveTenantId = tenantId ?? this.getTenantIdSafe();
            const sequelize = this.roleModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            const startTime = Date.now();
            this.logger.log({
                tenantId: effectiveTenantId,
                message: 'Запрос метрик использования разрешений',
            });

            // Общее количество уникальных разрешений
            const [totalResult] = await sequelize.query<{
                totalUniquePermissions: number;
                totalRoles: number;
            }>(
                `
                SELECT
                    COUNT(DISTINCT CONCAT(rp.resource, ':', rp.action)) as totalUniquePermissions,
                    COUNT(DISTINCT rp.role_id) as totalRoles
                FROM role_permissions rp
                INNER JOIN role r ON rp.role_id = r.id
                WHERE (? IS NULL OR r.tenant_id = ? OR r.is_system_role = 1)
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            const totalUniquePermissions =
                Number(totalResult?.totalUniquePermissions) || 0;
            const totalRoles = Number(totalResult?.totalRoles) || 0;

            // Топ-10 наиболее используемых разрешений
            const topUsedPermissions = await sequelize.query<{
                resource: string;
                action: string;
                roleCount: number;
            }>(
                `
                SELECT
                    rp.resource,
                    rp.action,
                    COUNT(DISTINCT rp.role_id) as roleCount
                FROM role_permissions rp
                INNER JOIN role r ON rp.role_id = r.id
                WHERE (? IS NULL OR r.tenant_id = ? OR r.is_system_role = 1)
                GROUP BY rp.resource, rp.action
                ORDER BY roleCount DESC
                LIMIT 10
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // Распределение разрешений по ресурсам
            const permissionsByResource = await sequelize.query<{
                resource: string;
                count: number;
            }>(
                `
                SELECT
                    rp.resource,
                    COUNT(DISTINCT CONCAT(rp.resource, ':', rp.action)) as count
                FROM role_permissions rp
                INNER JOIN role r ON rp.role_id = r.id
                WHERE (? IS NULL OR r.tenant_id = ? OR r.is_system_role = 1)
                GROUP BY rp.resource
                ORDER BY count DESC
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // Распределение разрешений по действиям
            const permissionsByAction = await sequelize.query<{
                action: string;
                count: number;
            }>(
                `
                SELECT
                    rp.action,
                    COUNT(DISTINCT CONCAT(rp.resource, ':', rp.action)) as count
                FROM role_permissions rp
                INNER JOIN role r ON rp.role_id = r.id
                WHERE (? IS NULL OR r.tenant_id = ? OR r.is_system_role = 1)
                GROUP BY rp.action
                ORDER BY count DESC
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // Неиспользуемые разрешения (разрешения, которые не используются ни в одной роли)
            // Примечание: это требует знания всех возможных разрешений в системе
            // Для упрощения возвращаем пустой массив, так как нет справочника всех разрешений
            const unusedPermissions: Array<{
                resource: string;
                action: string;
            }> = [];

            const executionTime = Date.now() - startTime;
            this.logger.log({
                tenantId: effectiveTenantId,
                executionTimeMs: executionTime,
                message: 'Метрики использования разрешений получены',
            });

            return {
                totalUniquePermissions,
                topUsedPermissions: topUsedPermissions.map((row) => {
                    const roleCount = Number(row.roleCount) || 0;
                    const percentage =
                        totalRoles > 0
                            ? Number(
                                  ((roleCount / totalRoles) * 100).toFixed(2),
                              )
                            : 0;
                    return {
                        resource: row.resource,
                        action: row.action,
                        roleCount,
                        percentage,
                    };
                }),
                permissionsByResource: permissionsByResource.map((row) => ({
                    resource: row.resource,
                    count: Number(row.count) || 0,
                })),
                permissionsByAction: permissionsByAction.map((row) => ({
                    action: row.action,
                    count: Number(row.count) || 0,
                })),
                unusedPermissions,
            };
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    tenantId,
                },
                'Ошибка при получении метрик использования разрешений',
            );
            throw error;
        }
    }

    /**
     * Получить метрики использования конкретного разрешения
     * @param resource - Ресурс
     * @param action - Действие
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns метрики использования разрешения или null, если разрешение не найдено
     */
    public async getPermissionUsageMetricsByResourceAndAction(
        resource: string,
        action: string,
        tenantId: number | null,
    ): Promise<{
        resource: string;
        action: string;
        roleCount: number;
        totalRoles: number;
        percentage: number;
        roles: Array<{
            roleId: number;
            roleName: string;
        }>;
    } | null> {
        try {
            const effectiveTenantId = tenantId ?? this.getTenantIdSafe();
            const sequelize = this.roleModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            const startTime = Date.now();
            this.logger.log({
                resource,
                action,
                tenantId: effectiveTenantId,
                message: 'Запрос метрик использования разрешения',
            });

            // Проверяем, существует ли такое разрешение
            const [permissionExists] = await sequelize.query<{
                exists: number;
            }>(
                `
                SELECT COUNT(*) as exists
                FROM role_permissions rp
                INNER JOIN role r ON rp.role_id = r.id
                WHERE rp.resource = ? AND rp.action = ?
                    AND (? IS NULL OR r.tenant_id = ? OR r.is_system_role = 1)
            `,
                {
                    replacements: [
                        resource,
                        action,
                        effectiveTenantId,
                        effectiveTenantId,
                    ],
                    type: QueryTypes.SELECT,
                },
            );

            if (Number(permissionExists?.exists) === 0) {
                return null;
            }

            // Общее количество ролей
            const [totalRolesResult] = await sequelize.query<{
                totalRoles: number;
            }>(
                `
                SELECT COUNT(*) as totalRoles
                FROM role
                WHERE (? IS NULL OR tenant_id = ? OR is_system_role = 1)
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            const totalRoles = Number(totalRolesResult?.totalRoles) || 0;

            // Роли, использующие это разрешение
            const roles = await sequelize.query<{
                roleId: number;
                roleName: string;
            }>(
                `
                SELECT DISTINCT
                    r.id as roleId,
                    r.role as roleName
                FROM role_permissions rp
                INNER JOIN role r ON rp.role_id = r.id
                WHERE rp.resource = ? AND rp.action = ?
                    AND (? IS NULL OR r.tenant_id = ? OR r.is_system_role = 1)
            `,
                {
                    replacements: [
                        resource,
                        action,
                        effectiveTenantId,
                        effectiveTenantId,
                    ],
                    type: QueryTypes.SELECT,
                },
            );

            const roleCount = roles.length;
            const percentage =
                totalRoles > 0
                    ? Number(((roleCount / totalRoles) * 100).toFixed(2))
                    : 0;

            const executionTime = Date.now() - startTime;
            this.logger.log({
                resource,
                action,
                tenantId: effectiveTenantId,
                executionTimeMs: executionTime,
                message: 'Метрики использования разрешения получены',
            });

            return {
                resource,
                action,
                roleCount,
                totalRoles,
                percentage,
                roles: roles.map((row) => ({
                    roleId: Number(row.roleId) || 0,
                    roleName: row.roleName,
                })),
            };
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    resource,
                    action,
                    tenantId,
                },
                'Ошибка при получении метрик использования разрешения',
            );
            throw error;
        }
    }

    /**
     * Получить метрики операций назначения/отзыва ролей из audit_logs
     * @param startDate - Начальная дата
     * @param endDate - Конечная дата
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns Статистика операций назначения/отзыва
     */
    public async getRoleOperationsMetrics(
        startDate: Date,
        endDate: Date,
        tenantId?: number | null,
    ): Promise<{
        totalAssignments: number;
        totalRevocations: number;
        assignmentToRevocationRatio: number;
        topAssignedRoles: Array<{
            roleId: number;
            roleName: string;
            count: number;
        }>;
        topRevokedRoles: Array<{
            roleId: number;
            roleName: string;
            count: number;
        }>;
        operationsByDay: Array<{
            date: string;
            assignments: number;
            revocations: number;
        }>;
    }> {
        try {
            const effectiveTenantId = tenantId ?? this.getTenantIdSafe();
            const sequelize = this.auditLogModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            const startTime = Date.now();
            this.logger.log({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                tenantId: effectiveTenantId,
                message: 'Запрос метрик операций назначения/отзыва ролей',
            });

            // Общее количество назначений и отзывов
            const [operationStats] = await sequelize.query<{
                totalAssignments: number;
                totalRevocations: number;
            }>(
                `
                SELECT
                    SUM(CASE WHEN action = 'ASSIGN' THEN 1 ELSE 0 END) as totalAssignments,
                    SUM(CASE WHEN action = 'REVOKE' THEN 1 ELSE 0 END) as totalRevocations
                FROM audit_logs
                WHERE entity_type = 'user_role'
                    AND action IN ('ASSIGN', 'REVOKE')
                    AND created_at >= ?
                    AND created_at <= ?
                    AND (? IS NULL OR tenant_id = ?)
            `,
                {
                    replacements: [
                        startDate,
                        endDate,
                        effectiveTenantId,
                        effectiveTenantId,
                    ],
                    type: QueryTypes.SELECT,
                },
            );

            const totalAssignments =
                Number(operationStats?.totalAssignments) || 0;
            const totalRevocations =
                Number(operationStats?.totalRevocations) || 0;
            const assignmentToRevocationRatio =
                totalRevocations > 0
                    ? Number((totalAssignments / totalRevocations).toFixed(2))
                    : totalAssignments > 0
                      ? 999.99 // Все назначения, нет отзывов
                      : 0;

            // Топ ролей по частоте назначения
            const topAssignedRoles = await sequelize.query<{
                roleId: number;
                roleName: string;
                count: number;
            }>(
                `
                SELECT
                    r.id as roleId,
                    r.role as roleName,
                    COUNT(*) as count
                FROM audit_logs al
                INNER JOIN user_roles ur ON al.entity_id = ur.id
                INNER JOIN role r ON ur.role_id = r.id
                WHERE al.entity_type = 'user_role'
                    AND al.action = 'ASSIGN'
                    AND al.created_at >= ?
                    AND al.created_at <= ?
                    AND (? IS NULL OR al.tenant_id = ?)
                GROUP BY r.id, r.role
                ORDER BY count DESC
                LIMIT 10
            `,
                {
                    replacements: [
                        startDate,
                        endDate,
                        effectiveTenantId,
                        effectiveTenantId,
                    ],
                    type: QueryTypes.SELECT,
                },
            );

            // Топ ролей по частоте отзыва
            const topRevokedRoles = await sequelize.query<{
                roleId: number;
                roleName: string;
                count: number;
            }>(
                `
                SELECT
                    r.id as roleId,
                    r.role as roleName,
                    COUNT(*) as count
                FROM audit_logs al
                INNER JOIN user_roles ur ON al.entity_id = ur.id
                INNER JOIN role r ON ur.role_id = r.id
                WHERE al.entity_type = 'user_role'
                    AND al.action = 'REVOKE'
                    AND al.created_at >= ?
                    AND al.created_at <= ?
                    AND (? IS NULL OR al.tenant_id = ?)
                GROUP BY r.id, r.role
                ORDER BY count DESC
                LIMIT 10
            `,
                {
                    replacements: [
                        startDate,
                        endDate,
                        effectiveTenantId,
                        effectiveTenantId,
                    ],
                    type: QueryTypes.SELECT,
                },
            );

            // Операции по дням
            const operationsByDay = await sequelize.query<{
                date: string;
                assignments: number;
                revocations: number;
            }>(
                `
                SELECT
                    DATE(created_at) as date,
                    SUM(CASE WHEN action = 'ASSIGN' THEN 1 ELSE 0 END) as assignments,
                    SUM(CASE WHEN action = 'REVOKE' THEN 1 ELSE 0 END) as revocations
                FROM audit_logs
                WHERE entity_type = 'user_role'
                    AND action IN ('ASSIGN', 'REVOKE')
                    AND created_at >= ?
                    AND created_at <= ?
                    AND (? IS NULL OR tenant_id = ?)
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `,
                {
                    replacements: [
                        startDate,
                        endDate,
                        effectiveTenantId,
                        effectiveTenantId,
                    ],
                    type: QueryTypes.SELECT,
                },
            );

            const executionTime = Date.now() - startTime;
            this.logger.log({
                tenantId: effectiveTenantId,
                executionTimeMs: executionTime,
                message: 'Метрики операций назначения/отзыва ролей получены',
            });

            return {
                totalAssignments,
                totalRevocations,
                assignmentToRevocationRatio,
                topAssignedRoles: topAssignedRoles.map((row) => ({
                    roleId: Number(row.roleId) || 0,
                    roleName: row.roleName,
                    count: Number(row.count) || 0,
                })),
                topRevokedRoles: topRevokedRoles.map((row) => ({
                    roleId: Number(row.roleId) || 0,
                    roleName: row.roleName,
                    count: Number(row.count) || 0,
                })),
                operationsByDay: operationsByDay.map((row) => ({
                    date: row.date,
                    assignments: Number(row.assignments) || 0,
                    revocations: Number(row.revocations) || 0,
                })),
            };
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    tenantId,
                },
                'Ошибка при получении метрик операций назначения/отзыва ролей',
            );
            throw error;
        }
    }

    /**
     * Получить метрики автоматических назначений из audit_logs
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns Статистика автоматических назначений
     */
    public async getAutoAssignmentMetrics(tenantId?: number | null): Promise<{
        totalAutoAssignments: number;
        successfulAutoAssignments: number;
        failedAutoAssignments: number;
        successRate: number;
        autoAssignmentsByType: Array<{
            type: string;
            count: number;
            successCount: number;
            failureCount: number;
        }>;
        failureReasons: Array<{
            reason: string;
            count: number;
        }>;
    }> {
        try {
            const effectiveTenantId = tenantId ?? this.getTenantIdSafe();
            const sequelize = this.auditLogModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            const startTime = Date.now();
            this.logger.log({
                tenantId: effectiveTenantId,
                message: 'Запрос метрик автоматических назначений',
            });

            // Общее количество автоматических назначений (где metadata содержит autoAssigned: true)
            const [autoAssignmentStats] = await sequelize.query<{
                totalAutoAssignments: number;
            }>(
                `
                SELECT COUNT(*) as totalAutoAssignments
                FROM audit_logs
                WHERE entity_type = 'user_role'
                    AND action = 'ASSIGN'
                    AND JSON_EXTRACT(metadata, '$.autoAssigned') = true
                    AND (? IS NULL OR tenant_id = ?)
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            const totalAutoAssignments =
                Number(autoAssignmentStats?.totalAutoAssignments) || 0;

            // Успешные автоматические назначения (назначения, которые есть в user_roles)
            // Для упрощения считаем все автоматические назначения успешными,
            // так как они попадают в audit_logs только при успешном назначении
            const successfulAutoAssignments = totalAutoAssignments;
            const failedAutoAssignments = 0; // Неудачные назначения не попадают в audit_logs
            const successRate =
                totalAutoAssignments > 0
                    ? Number(
                          (
                              (successfulAutoAssignments /
                                  totalAutoAssignments) *
                              100
                          ).toFixed(2),
                      )
                    : 0;

            // Автоматические назначения по типам (из metadata.reason: 'total_spent', 'order_count')
            const autoAssignmentsByTypeRaw = await sequelize.query<{
                reason: string;
                count: number;
            }>(
                `
                SELECT
                    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.reason')), 'unknown') as reason,
                    COUNT(*) as count
                FROM audit_logs
                WHERE entity_type = 'user_role'
                    AND action = 'ASSIGN'
                    AND JSON_EXTRACT(metadata, '$.autoAssigned') = true
                    AND (? IS NULL OR tenant_id = ?)
                GROUP BY reason
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            const autoAssignmentsByType = autoAssignmentsByTypeRaw.map(
                (row) => {
                    const type =
                        row.reason === 'total_spent'
                            ? 'VIP'
                            : row.reason === 'order_count'
                              ? 'WHOLESALE'
                              : row.reason || 'UNKNOWN';
                    return {
                        type,
                        count: Number(row.count) || 0,
                        successCount: Number(row.count) || 0, // Все успешные
                        failureCount: 0, // Неудачные не попадают в audit_logs
                    };
                },
            );

            // Причины неудачных назначений (из metadata.errorReason)
            // Примечание: неудачные назначения обычно не попадают в audit_logs,
            // но если они там есть, извлекаем причины
            const failureReasonsRaw = await sequelize.query<{
                errorReason: string;
                count: number;
            }>(
                `
                SELECT
                    JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.errorReason')) as errorReason,
                    COUNT(*) as count
                FROM audit_logs
                WHERE entity_type = 'user_role'
                    AND action = 'ASSIGN'
                    AND JSON_EXTRACT(metadata, '$.autoAssigned') = true
                    AND JSON_EXTRACT(metadata, '$.errorReason') IS NOT NULL
                    AND (? IS NULL OR tenant_id = ?)
                GROUP BY errorReason
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            const failureReasons = failureReasonsRaw
                .filter((row) => row.errorReason)
                .map((row) => ({
                    reason: row.errorReason || 'unknown',
                    count: Number(row.count) || 0,
                }));

            const executionTime = Date.now() - startTime;
            this.logger.log({
                tenantId: effectiveTenantId,
                executionTimeMs: executionTime,
                message: 'Метрики автоматических назначений получены',
            });

            return {
                totalAutoAssignments,
                successfulAutoAssignments,
                failedAutoAssignments,
                successRate,
                autoAssignmentsByType,
                failureReasons,
            };
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    tenantId,
                },
                'Ошибка при получении метрик автоматических назначений',
            );
            throw error;
        }
    }

    /**
     * Получить метрики истечения ролей из role_auto_renewal_config и user_roles
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns Статистика истечения ролей
     */
    public async getExpirationMetrics(tenantId?: number | null): Promise<{
        activeRolesWithExpiration: number;
        expiredRolesCount: number;
        averageDurationBeforeExpiration: number | null;
        renewalStats: {
            totalRenewals: number;
            averageRenewalDuration: number | null;
            rolesReachedLimit: number;
        };
    }> {
        try {
            const effectiveTenantId = tenantId ?? this.getTenantIdSafe();
            const sequelize = this.userRoleModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            const startTime = Date.now();
            this.logger.log({
                tenantId: effectiveTenantId,
                message: 'Запрос метрик истечения ролей',
            });

            // Активные роли с временным истечением
            const [activeExpirationStats] = await sequelize.query<{
                activeRolesWithExpiration: number;
            }>(
                `
                SELECT COUNT(DISTINCT ur.id) as activeRolesWithExpiration
                FROM user_roles ur
                INNER JOIN user u ON ur.user_id = u.id
                WHERE ur.expires_at IS NOT NULL
                    AND ur.is_active = 1
                    AND u.is_deleted = 0
                    AND (? IS NULL OR u.tenant_id = ?)
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // Истекшие роли (expires_at < NOW() и is_active = 0)
            const [expiredStats] = await sequelize.query<{
                expiredRolesCount: number;
            }>(
                `
                SELECT COUNT(*) as expiredRolesCount
                FROM user_roles ur
                INNER JOIN user u ON ur.user_id = u.id
                WHERE ur.expires_at IS NOT NULL
                    AND ur.expires_at < NOW()
                    AND ur.is_active = 0
                    AND u.is_deleted = 0
                    AND (? IS NULL OR u.tenant_id = ?)
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // Средняя длительность ролей перед истечением (в днях)
            const [durationStats] = await sequelize.query<{
                averageDurationDays: number | null;
            }>(
                `
                SELECT
                    AVG(DATEDIFF(ur.expires_at, ur.granted_at)) as averageDurationDays
                FROM user_roles ur
                INNER JOIN user u ON ur.user_id = u.id
                WHERE ur.expires_at IS NOT NULL
                    AND u.is_deleted = 0
                    AND (? IS NULL OR u.tenant_id = ?)
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // Статистика продлений
            const [renewalStats] = await sequelize.query<{
                totalRenewals: number;
                averageRenewalDurationDays: number | null;
                rolesReachedLimit: number;
            }>(
                `
                SELECT
                    SUM(rac.current_renewal_count) as totalRenewals,
                    AVG(rac.renewal_duration_ms / 86400000) as averageRenewalDurationDays,
                    SUM(CASE WHEN rac.max_renewals > 0 AND rac.current_renewal_count >= rac.max_renewals THEN 1 ELSE 0 END) as rolesReachedLimit
                FROM role_auto_renewal_config rac
                INNER JOIN user_roles ur ON rac.user_role_id = ur.id
                INNER JOIN user u ON ur.user_id = u.id
                WHERE rac.is_enabled = 1
                    AND u.is_deleted = 0
                    AND (? IS NULL OR u.tenant_id = ?)
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            const executionTime = Date.now() - startTime;
            this.logger.log({
                tenantId: effectiveTenantId,
                executionTimeMs: executionTime,
                message: 'Метрики истечения ролей получены',
            });

            return {
                activeRolesWithExpiration:
                    Number(activeExpirationStats?.activeRolesWithExpiration) ||
                    0,
                expiredRolesCount: Number(expiredStats?.expiredRolesCount) || 0,
                averageDurationBeforeExpiration:
                    durationStats?.averageDurationDays !== null
                        ? Number(durationStats.averageDurationDays.toFixed(2))
                        : null,
                renewalStats: {
                    totalRenewals: Number(renewalStats?.totalRenewals) || 0,
                    averageRenewalDuration:
                        renewalStats?.averageRenewalDurationDays !== null
                            ? Number(
                                  renewalStats.averageRenewalDurationDays.toFixed(
                                      2,
                                  ),
                              )
                            : null,
                    rolesReachedLimit:
                        Number(renewalStats?.rolesReachedLimit) || 0,
                },
            };
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    tenantId,
                },
                'Ошибка при получении метрик истечения ролей',
            );
            throw error;
        }
    }

    /**
     * Получить метрики иерархии ролей
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns Статистика иерархии ролей
     */
    public async getHierarchyMetrics(tenantId?: number | null): Promise<{
        rolesByLevel: Array<{
            level: number;
            count: number;
            averagePermissions: number;
        }>;
        emptyRoles: Array<{
            roleId: number;
            roleName: string;
            level: number;
        }>;
        maxLevel: number;
        minLevel: number;
    }> {
        try {
            const effectiveTenantId = tenantId ?? this.getTenantIdSafe();
            const sequelize = this.roleModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            const startTime = Date.now();
            this.logger.log({
                tenantId: effectiveTenantId,
                message: 'Запрос метрик иерархии ролей',
            });

            // Роли по уровням с средним количеством разрешений
            const rolesByLevel = await sequelize.query<{
                level: number;
                count: number;
                averagePermissions: number;
            }>(
                `
                SELECT
                    r.level,
                    COUNT(DISTINCT r.id) as count,
                    COALESCE(AVG(permission_count.permission_count), 0) as averagePermissions
                FROM role r
                LEFT JOIN (
                    SELECT
                        role_id,
                        COUNT(*) as permission_count
                    FROM role_permissions
                    GROUP BY role_id
                ) permission_count ON r.id = permission_count.role_id
                WHERE (? IS NULL OR r.tenant_id = ? OR r.is_system_role = 1)
                GROUP BY r.level
                ORDER BY r.level ASC
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // Пустые роли (без разрешений)
            const emptyRoles = await sequelize.query<{
                roleId: number;
                roleName: string;
                level: number;
            }>(
                `
                SELECT
                    r.id as roleId,
                    r.role as roleName,
                    r.level
                FROM role r
                LEFT JOIN role_permissions rp ON r.id = rp.role_id
                WHERE rp.role_id IS NULL
                    AND (? IS NULL OR r.tenant_id = ? OR r.is_system_role = 1)
                GROUP BY r.id, r.role, r.level
                ORDER BY r.level ASC, r.role ASC
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // Минимальный и максимальный уровень
            const [levelStats] = await sequelize.query<{
                maxLevel: number;
                minLevel: number;
            }>(
                `
                SELECT
                    MAX(level) as maxLevel,
                    MIN(level) as minLevel
                FROM role
                WHERE (? IS NULL OR tenant_id = ? OR is_system_role = 1)
            `,
                {
                    replacements: [effectiveTenantId, effectiveTenantId],
                    type: QueryTypes.SELECT,
                },
            );

            const executionTime = Date.now() - startTime;
            this.logger.log({
                tenantId: effectiveTenantId,
                executionTimeMs: executionTime,
                message: 'Метрики иерархии ролей получены',
            });

            return {
                rolesByLevel: rolesByLevel.map((row) => ({
                    level: Number(row.level) || 0,
                    count: Number(row.count) || 0,
                    averagePermissions: Number(
                        row.averagePermissions.toFixed(2),
                    ),
                })),
                emptyRoles: emptyRoles.map((row) => ({
                    roleId: Number(row.roleId) || 0,
                    roleName: row.roleName,
                    level: Number(row.level) || 0,
                })),
                maxLevel: Number(levelStats?.maxLevel) || 0,
                minLevel: Number(levelStats?.minLevel) || 0,
            };
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    tenantId,
                },
                'Ошибка при получении метрик иерархии ролей',
            );
            throw error;
        }
    }

    /**
     * Получить распределение ролей по тенантам (только для SUPER_ADMIN)
     * @returns Статистика по тенантам
     */
    public async getDistributionByTenant(): Promise<
        Array<{
            tenantId: number;
            totalRoles: number;
            activeRoles: number;
            topRoles: Array<{
                roleName: string;
                userCount: number;
            }>;
        }>
    > {
        try {
            const sequelize = this.roleModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            const startTime = Date.now();
            this.logger.log({
                message: 'Запрос распределения ролей по тенантам',
            });

            // Статистика по тенантам
            const tenantStats = await sequelize.query<{
                tenantId: number;
                totalRoles: number;
                activeRoles: number;
            }>(
                `
                SELECT
                    COALESCE(tenant_id, 0) as tenantId,
                    COUNT(*) as totalRoles,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeRoles
                FROM role
                WHERE is_system_role = 0
                GROUP BY tenant_id
                ORDER BY tenant_id ASC
            `,
                {
                    type: QueryTypes.SELECT,
                },
            );

            // Для каждого тенанта получаем топ ролей
            const distribution = await Promise.all(
                tenantStats.map(async (tenantStat) => {
                    const tenantId = Number(tenantStat.tenantId) || 0;

                    // Топ ролей для тенанта
                    const topRoles = await sequelize.query<{
                        roleName: string;
                        userCount: number;
                    }>(
                        `
                        SELECT
                            r.role as roleName,
                            COUNT(DISTINCT ur.user_id) as userCount
                        FROM role r
                        INNER JOIN user_roles ur ON r.id = ur.role_id
                        INNER JOIN user u ON ur.user_id = u.id
                        WHERE ur.is_active = 1
                            AND u.is_deleted = 0
                            AND (r.tenant_id = ? OR (r.tenant_id IS NULL AND r.is_system_role = 1))
                            AND u.tenant_id = ?
                        GROUP BY r.role
                        ORDER BY userCount DESC
                        LIMIT 5
                    `,
                        {
                            replacements: [tenantId, tenantId],
                            type: QueryTypes.SELECT,
                        },
                    );

                    return {
                        tenantId,
                        totalRoles: Number(tenantStat.totalRoles) || 0,
                        activeRoles: Number(tenantStat.activeRoles) || 0,
                        topRoles: topRoles.map((row) => ({
                            roleName: row.roleName,
                            userCount: Number(row.userCount) || 0,
                        })),
                    };
                }),
            );

            const executionTime = Date.now() - startTime;
            this.logger.log({
                executionTimeMs: executionTime,
                message: 'Распределение ролей по тенантам получено',
            });

            return distribution;
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                },
                'Ошибка при получении распределения ролей по тенантам',
            );
            throw error;
        }
    }
}
