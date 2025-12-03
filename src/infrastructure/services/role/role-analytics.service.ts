import { TenantContext } from '@app/infrastructure/common/context';
import { RoleAnalyticsRepository } from '@app/infrastructure/repositories';
import type { RoleAnalyticsDashboardResponse } from '@app/infrastructure/responses';
import { Injectable, Logger } from '@nestjs/common';

/**
 * RoleAnalyticsService
 * Сервис для получения аналитики по ролям и разрешениям
 *
 * Предоставляет бизнес-логику поверх RoleAnalyticsRepository:
 * - Обработка tenant isolation
 * - Форматирование данных для API
 * - Агрегация метрик для дашбордов
 */
@Injectable()
export class RoleAnalyticsService {
    private readonly logger = new Logger(RoleAnalyticsService.name);

    constructor(
        private readonly roleAnalyticsRepository: RoleAnalyticsRepository,
        private readonly tenantContext: TenantContext,
    ) {}

    /**
     * Получить tenantId с учетом роли пользователя
     * @private
     */
    private getTenantIdForQuery(): number | null {
        // Для SUPER_ADMIN возвращаем null (все тенанты)
        // Для TENANT_ADMIN возвращаем ID тенанта из контекста
        // В тестах возвращаем fallback значение
        if (process.env.NODE_ENV === 'test') {
            return this.tenantContext.getTenantIdOrNull() ?? 1;
        }

        // TODO: Добавить проверку роли пользователя через JWT
        // Пока возвращаем tenantId из контекста
        return this.tenantContext.getTenantIdOrNull();
    }

    /**
     * Получить статистику использования ролей
     * @param tenantId - ID тенанта (опционально, для SUPER_ADMIN)
     * @returns Статистика использования ролей
     */
    public async getRoleUsageStats(tenantId?: number | null): Promise<{
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
            const effectiveTenantId = tenantId ?? this.getTenantIdForQuery();

            this.logger.log({
                tenantId: effectiveTenantId,
                message: 'Запрос статистики использования ролей',
            });

            const metrics =
                await this.roleAnalyticsRepository.getRoleUsageMetrics(
                    effectiveTenantId,
                );

            return metrics;
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    tenantId,
                },
                'Ошибка при получении статистики использования ролей',
            );
            throw error;
        }
    }

    /**
     * Получить статистику использования конкретной роли
     * @param roleId - ID роли
     * @param tenantId - ID тенанта (опционально, для SUPER_ADMIN)
     * @returns Статистика по конкретной роли или null, если роль не найдена
     */
    public async getRoleUsageStatsById(
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
            const effectiveTenantId = tenantId ?? this.getTenantIdForQuery();

            this.logger.log({
                roleId,
                tenantId: effectiveTenantId,
                message: 'Запрос статистики использования роли',
            });

            const metrics =
                await this.roleAnalyticsRepository.getRoleUsageMetricsById(
                    roleId,
                    effectiveTenantId,
                );

            return metrics;
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    roleId,
                    tenantId,
                },
                'Ошибка при получении статистики использования роли',
            );
            throw error;
        }
    }

    /**
     * Получить статистику использования разрешений
     * @param tenantId - ID тенанта (опционально, для SUPER_ADMIN)
     * @returns Статистика использования разрешений
     */
    public async getPermissionUsageStats(tenantId?: number | null): Promise<{
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
            const effectiveTenantId = tenantId ?? this.getTenantIdForQuery();

            this.logger.log({
                tenantId: effectiveTenantId,
                message: 'Запрос статистики использования разрешений',
            });

            const metrics =
                await this.roleAnalyticsRepository.getPermissionUsageMetrics(
                    effectiveTenantId,
                );

            return metrics;
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    tenantId,
                },
                'Ошибка при получении статистики использования разрешений',
            );
            throw error;
        }
    }

    /**
     * Получить статистику использования конкретного разрешения
     * @param resource - Ресурс
     * @param action - Действие
     * @param tenantId - ID тенанта (опционально, для SUPER_ADMIN)
     * @returns Статистика по конкретному разрешению или null, если разрешение не найдено
     */
    public async getPermissionUsageStatsByResourceAndAction(
        resource: string,
        action: string,
        tenantId?: number | null,
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
            const effectiveTenantId = tenantId ?? this.getTenantIdForQuery();

            this.logger.log({
                resource,
                action,
                tenantId: effectiveTenantId,
                message: 'Запрос статистики использования разрешения',
            });

            const metrics =
                await this.roleAnalyticsRepository.getPermissionUsageMetricsByResourceAndAction(
                    resource,
                    action,
                    effectiveTenantId,
                );

            return metrics;
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    resource,
                    action,
                    tenantId,
                },
                'Ошибка при получении статистики использования разрешения',
            );
            throw error;
        }
    }

    /**
     * Получить метрики операций назначения/отзыва ролей
     * @param startDate - Начальная дата
     * @param endDate - Конечная дата
     * @param tenantId - ID тенанта (опционально, для SUPER_ADMIN)
     * @returns Статистика операций назначения/отзыва
     */
    public async getRoleOperationsStats(
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
            const effectiveTenantId = tenantId ?? this.getTenantIdForQuery();

            this.logger.log({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                tenantId: effectiveTenantId,
                message: 'Запрос метрик операций назначения/отзыва ролей',
            });

            const metrics =
                await this.roleAnalyticsRepository.getRoleOperationsMetrics(
                    startDate,
                    endDate,
                    effectiveTenantId,
                );

            return metrics;
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
     * Получить метрики автоматических назначений
     * @param tenantId - ID тенанта (опционально, для SUPER_ADMIN)
     * @returns Статистика автоматических назначений
     */
    public async getAutoAssignmentStats(tenantId?: number | null): Promise<{
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
            const effectiveTenantId = tenantId ?? this.getTenantIdForQuery();

            this.logger.log({
                tenantId: effectiveTenantId,
                message: 'Запрос метрик автоматических назначений',
            });

            const metrics =
                await this.roleAnalyticsRepository.getAutoAssignmentMetrics(
                    effectiveTenantId,
                );

            return metrics;
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
     * Получить метрики истечения ролей
     * @param tenantId - ID тенанта (опционально, для SUPER_ADMIN)
     * @returns Статистика истечения ролей
     */
    public async getExpirationStats(tenantId?: number | null): Promise<{
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
            const effectiveTenantId = tenantId ?? this.getTenantIdForQuery();

            this.logger.log({
                tenantId: effectiveTenantId,
                message: 'Запрос метрик истечения ролей',
            });

            const metrics =
                await this.roleAnalyticsRepository.getExpirationMetrics(
                    effectiveTenantId,
                );

            return metrics;
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
     * @param tenantId - ID тенанта (опционально, для SUPER_ADMIN)
     * @returns Статистика иерархии ролей
     */
    public async getHierarchyStats(tenantId?: number | null): Promise<{
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
            const effectiveTenantId = tenantId ?? this.getTenantIdForQuery();

            this.logger.log({
                tenantId: effectiveTenantId,
                message: 'Запрос метрик иерархии ролей',
            });

            const metrics =
                await this.roleAnalyticsRepository.getHierarchyMetrics(
                    effectiveTenantId,
                );

            return metrics;
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
            this.logger.log({
                message: 'Запрос распределения ролей по тенантам',
            });

            const distribution =
                await this.roleAnalyticsRepository.getDistributionByTenant();

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

    /**
     * Получить агрегированный дашборд с ключевыми метриками
     * @param tenantId - ID тенанта (опционально, для SUPER_ADMIN)
     * @param period - Период для операций (опционально)
     * @returns Агрегированные данные для дашборда
     */
    public async getDashboardData(
        tenantId?: number | null,
        period?: {
            startDate: Date;
            endDate: Date;
        },
    ): Promise<RoleAnalyticsDashboardResponse> {
        try {
            const effectiveTenantId = tenantId ?? this.getTenantIdForQuery();

            this.logger.log({
                tenantId: effectiveTenantId,
                period: period
                    ? {
                          startDate: period.startDate.toISOString(),
                          endDate: period.endDate.toISOString(),
                      }
                    : undefined,
                message: 'Запрос данных для дашборда',
            });

            // Параллельно запрашиваем все метрики
            const [
                roleUsageMetrics,
                permissionMetrics,
                expirationMetrics,
                hierarchyMetrics,
                operationsMetrics,
            ] = await Promise.all([
                this.roleAnalyticsRepository.getRoleUsageMetrics(
                    effectiveTenantId,
                ),
                this.roleAnalyticsRepository.getPermissionUsageMetrics(
                    effectiveTenantId,
                ),
                this.roleAnalyticsRepository.getExpirationMetrics(
                    effectiveTenantId,
                ),
                this.roleAnalyticsRepository.getHierarchyMetrics(
                    effectiveTenantId,
                ),
                period
                    ? this.roleAnalyticsRepository.getRoleOperationsMetrics(
                          period.startDate,
                          period.endDate,
                          effectiveTenantId,
                      )
                    : Promise.resolve(null),
            ]);

            return {
                roleStats: {
                    totalRoles: roleUsageMetrics.totalRoles,
                    activeRoles: roleUsageMetrics.activeRoles,
                    systemRoles: roleUsageMetrics.systemRoles,
                    tenantRoles: roleUsageMetrics.tenantRoles,
                },
                permissionStats: {
                    totalUniquePermissions:
                        permissionMetrics.totalUniquePermissions,
                    topUsedPermissions:
                        permissionMetrics.topUsedPermissions.slice(0, 5).map(
                            (p) => ({
                                resource: p.resource,
                                action: p.action,
                                roleCount: p.roleCount,
                                percentage: p.percentage,
                            }),
                        ),
                },
                operationsStats: operationsMetrics
                    ? {
                          totalAssignments: operationsMetrics.totalAssignments,
                          totalRevocations: operationsMetrics.totalRevocations,
                          assignmentToRevocationRatio:
                              operationsMetrics.assignmentToRevocationRatio,
                      }
                    : undefined,
                expirationStats: {
                    activeRolesWithExpiration:
                        expirationMetrics.activeRolesWithExpiration,
                    expiredRolesCount: expirationMetrics.expiredRolesCount,
                },
                hierarchyStats: {
                    maxLevel: hierarchyMetrics.maxLevel,
                    minLevel: hierarchyMetrics.minLevel,
                    emptyRolesCount: hierarchyMetrics.emptyRoles.length,
                },
                topUsedRoles: roleUsageMetrics.topUsedRoles,
            };
        } catch (error: unknown) {
            this.logger.error(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    tenantId,
                    period: period
                        ? {
                              startDate: period.startDate.toISOString(),
                              endDate: period.endDate.toISOString(),
                          }
                        : undefined,
                },
                'Ошибка при получении данных для дашборда',
            );
            throw error;
        }
    }
}
