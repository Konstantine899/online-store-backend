/**
 * Интерфейс для аналитики ролей и разрешений
 *
 * Предоставляет методы для получения статистики и метрик:
 * - Использование ролей
 * - Использование разрешений
 * - Операции назначения/отзыва ролей
 * - Автоматические назначения
 * - Истечение ролей
 * - Иерархия ролей
 */
export interface IRoleAnalyticsRepository {
    /**
     * Получить метрики использования ролей
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns Статистика использования ролей
     */
    getRoleUsageMetrics(tenantId: number | null): Promise<{
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
    }>;

    /**
     * Получить метрики использования конкретной роли
     * @param roleId - ID роли
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns Статистика по конкретной роли
     */
    getRoleUsageMetricsById(
        roleId: number,
        tenantId: number | null,
    ): Promise<{
        roleId: number;
        roleName: string;
        userCount: number;
        totalUsers: number;
        percentage: number;
        averageDuration: number | null; // Средняя длительность обладания ролью в днях
        autoAssignmentsCount: number;
        manualAssignmentsCount: number;
    } | null>;

    /**
     * Получить метрики использования разрешений
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns Статистика использования разрешений
     */
    getPermissionUsageMetrics(tenantId: number | null): Promise<{
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
    }>;

    /**
     * Получить метрики использования конкретного разрешения
     * @param resource - Ресурс
     * @param action - Действие
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns Статистика по конкретному разрешению
     */
    getPermissionUsageMetricsByResourceAndAction(
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
    } | null>;

    /**
     * Получить метрики операций назначения/отзыва ролей из audit_logs
     * @param startDate - Начальная дата
     * @param endDate - Конечная дата
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns Статистика операций
     */
    getRoleOperationsMetrics(
        startDate: Date,
        endDate: Date,
        tenantId: number | null,
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
    }>;

    /**
     * Получить метрики автоматических назначений из audit_logs
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns Статистика автоматических назначений
     */
    getAutoAssignmentMetrics(tenantId: number | null): Promise<{
        totalAutoAssignments: number;
        successfulAutoAssignments: number;
        failedAutoAssignments: number;
        successRate: number;
        autoAssignmentsByType: Array<{
            type: string; // 'VIP', 'WHOLESALE', etc.
            count: number;
            successCount: number;
            failureCount: number;
        }>;
        failureReasons: Array<{
            reason: string;
            count: number;
        }>;
    }>;

    /**
     * Получить метрики истечения ролей из role_auto_renewal_config и user_roles
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns Статистика истечения ролей
     */
    getExpirationMetrics(tenantId: number | null): Promise<{
        activeRolesWithExpiration: number;
        expiredRolesCount: number;
        averageDurationBeforeExpiration: number | null; // Средняя длительность в днях
        renewalStats: {
            totalRenewals: number;
            averageRenewalDuration: number | null; // Средняя длительность продления в днях
            rolesReachedLimit: number;
        };
    }>;

    /**
     * Получить метрики иерархии ролей
     * @param tenantId - ID тенанта (null для всех тенантов)
     * @returns Статистика иерархии
     */
    getHierarchyMetrics(tenantId: number | null): Promise<{
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
    }>;

    /**
     * Получить распределение ролей по тенантам (только для SUPER_ADMIN)
     * @returns Статистика по тенантам
     */
    getDistributionByTenant(): Promise<Array<{
        tenantId: number;
        totalRoles: number;
        activeRoles: number;
        topRoles: Array<{
            roleName: string;
            userCount: number;
        }>;
    }>>;
}

