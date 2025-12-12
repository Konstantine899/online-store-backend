import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response типы для analytics endpoints
 */

/**
 * Информация о роли в статистике
 */
export class RoleStatsInfo {
    @ApiProperty({ example: 1, description: 'ID роли' })
    declare readonly roleId: number;

    @ApiProperty({ example: 'TENANT_ADMIN', description: 'Название роли' })
    declare readonly roleName: string;

    @ApiProperty({
        example: 50,
        description: 'Количество пользователей с ролью',
    })
    declare readonly userCount: number;

    @ApiProperty({
        example: 45.5,
        description: 'Процент пользователей с этой ролью',
    })
    declare readonly percentage: number;
}

/**
 * Распределение ролей по уровням
 */
export class RolesByLevelInfo {
    @ApiProperty({ example: 50, description: 'Уровень роли (0-100)' })
    declare readonly level: number;

    @ApiProperty({
        example: 10,
        description: 'Количество ролей на этом уровне',
    })
    declare readonly count: number;

    @ApiPropertyOptional({
        example: 5.5,
        description: 'Среднее количество разрешений на роль (для иерархии)',
    })
    declare readonly averagePermissions?: number;
}

/**
 * Response для статистики использования ролей
 * GET /role/analytics/stats
 */
export class RoleUsageStatsResponse {
    @ApiProperty({ example: 25, description: 'Общее количество ролей' })
    declare readonly totalRoles: number;

    @ApiProperty({ example: 20, description: 'Количество активных ролей' })
    declare readonly activeRoles: number;

    @ApiProperty({ example: 5, description: 'Количество неактивных ролей' })
    declare readonly inactiveRoles: number;

    @ApiProperty({ example: 10, description: 'Количество системных ролей' })
    declare readonly systemRoles: number;

    @ApiProperty({
        example: 15,
        description: 'Количество tenant-specific ролей',
    })
    declare readonly tenantRoles: number;

    @ApiProperty({
        example: 8,
        description: 'Количество ролей с временным истечением',
    })
    declare readonly rolesWithExpiration: number;

    @ApiProperty({
        type: [RolesByLevelInfo],
        description: 'Распределение ролей по уровням',
    })
    declare readonly rolesByLevel: RolesByLevelInfo[];

    @ApiProperty({
        type: [RoleStatsInfo],
        description: 'Топ-10 наиболее используемых ролей',
    })
    declare readonly topUsedRoles: RoleStatsInfo[];
}

/**
 * Response для статистики конкретной роли
 * GET /role/analytics/stats/:roleId
 */
export class RoleUsageStatsByIdResponse {
    @ApiProperty({ example: 1, description: 'ID роли' })
    declare readonly roleId: number;

    @ApiProperty({ example: 'TENANT_ADMIN', description: 'Название роли' })
    declare readonly roleName: string;

    @ApiProperty({
        example: 50,
        description: 'Количество пользователей с ролью',
    })
    declare readonly userCount: number;

    @ApiProperty({
        example: 100,
        description: 'Общее количество пользователей',
    })
    declare readonly totalUsers: number;

    @ApiProperty({
        example: 50.0,
        description: 'Процент пользователей с этой ролью',
    })
    declare readonly percentage: number;

    @ApiPropertyOptional({
        example: 30.5,
        description:
            'Средняя длительность обладания ролью в днях (только для ролей с expiresAt)',
        nullable: true,
    })
    declare readonly averageDuration: number | null;

    @ApiProperty({
        example: 10,
        description: 'Количество автоматических назначений',
    })
    declare readonly autoAssignmentsCount: number;

    @ApiProperty({
        example: 40,
        description: 'Количество ручных назначений',
    })
    declare readonly manualAssignmentsCount: number;
}

/**
 * Информация о разрешении в статистике
 */
export class PermissionStatsInfo {
    @ApiProperty({ example: 'products', description: 'Ресурс' })
    declare readonly resource: string;

    @ApiProperty({ example: 'create', description: 'Действие' })
    declare readonly action: string;

    @ApiProperty({
        example: 5,
        description: 'Количество ролей с этим разрешением',
    })
    declare readonly roleCount: number;

    @ApiProperty({
        example: 45.5,
        description: 'Процент ролей с этим разрешением',
    })
    declare readonly percentage: number;
}

/**
 * Распределение разрешений по ресурсам
 */
export class PermissionDistributionByResourceInfo {
    @ApiProperty({ example: 'products', description: 'Ресурс' })
    declare readonly resource: string;

    @ApiProperty({ example: 10, description: 'Количество разрешений' })
    declare readonly count: number;
}

/**
 * Распределение разрешений по действиям
 */
export class PermissionDistributionByActionInfo {
    @ApiProperty({ example: 'create', description: 'Действие' })
    declare readonly action: string;

    @ApiProperty({ example: 10, description: 'Количество разрешений' })
    declare readonly count: number;
}

/**
 * Response для статистики разрешений
 * GET /role/analytics/permissions/stats
 */
export class PermissionUsageStatsResponse {
    @ApiProperty({
        example: 50,
        description: 'Общее количество уникальных разрешений',
    })
    declare readonly totalUniquePermissions: number;

    @ApiProperty({
        type: [PermissionStatsInfo],
        description: 'Топ-10 наиболее используемых разрешений',
    })
    declare readonly topUsedPermissions: PermissionStatsInfo[];

    @ApiProperty({
        type: [PermissionDistributionByResourceInfo],
        description: 'Распределение разрешений по ресурсам',
    })
    declare readonly permissionsByResource: PermissionDistributionByResourceInfo[];

    @ApiProperty({
        type: [PermissionDistributionByActionInfo],
        description: 'Распределение разрешений по действиям',
    })
    declare readonly permissionsByAction: PermissionDistributionByActionInfo[];

    @ApiProperty({
        type: 'array',
        description: 'Неиспользуемые разрешения',
        example: [],
        items: {
            type: 'object',
            properties: {
                resource: { type: 'string', example: 'products' },
                action: { type: 'string', example: 'create' },
            },
        },
    })
    declare readonly unusedPermissions: Array<{
        resource: string;
        action: string;
    }>;
}

/**
 * Response для статистики конкретного разрешения
 * GET /role/analytics/permissions/stats/:resource/:action
 */
export class PermissionUsageStatsByResourceAndActionResponse {
    @ApiProperty({ example: 'products', description: 'Ресурс' })
    declare readonly resource: string;

    @ApiProperty({ example: 'create', description: 'Действие' })
    declare readonly action: string;

    @ApiProperty({
        example: 5,
        description: 'Количество ролей с этим разрешением',
    })
    declare readonly roleCount: number;

    @ApiProperty({ example: 25, description: 'Общее количество ролей' })
    declare readonly totalRoles: number;

    @ApiProperty({
        example: 20.0,
        description: 'Процент ролей с этим разрешением',
    })
    declare readonly percentage: number;

    @ApiProperty({
        type: 'array',
        description: 'Список ролей с этим разрешением',
        items: {
            type: 'object',
            properties: {
                roleId: { type: 'number', example: 1 },
                roleName: { type: 'string', example: 'TENANT_ADMIN' },
            },
        },
    })
    declare readonly roles: Array<{
        roleId: number;
        roleName: string;
    }>;
}

/**
 * Информация о роли в операциях
 */
export class RoleOperationInfo {
    @ApiProperty({ example: 1, description: 'ID роли' })
    declare readonly roleId: number;

    @ApiProperty({ example: 'TENANT_ADMIN', description: 'Название роли' })
    declare readonly roleName: string;

    @ApiProperty({ example: 10, description: 'Количество операций' })
    declare readonly count: number;
}

/**
 * Операции по дням
 */
export class OperationsByDayInfo {
    @ApiProperty({
        example: '2024-12-01',
        description: 'Дата (YYYY-MM-DD)',
    })
    declare readonly date: string;

    @ApiProperty({ example: 5, description: 'Количество назначений' })
    declare readonly assignments: number;

    @ApiProperty({ example: 2, description: 'Количество отзывов' })
    declare readonly revocations: number;
}

/**
 * Response для статистики операций назначения/отзыва
 * GET /role/analytics/operations/stats
 */
export class RoleOperationsStatsResponse {
    @ApiProperty({ example: 100, description: 'Общее количество назначений' })
    declare readonly totalAssignments: number;

    @ApiProperty({ example: 50, description: 'Общее количество отзывов' })
    declare readonly totalRevocations: number;

    @ApiProperty({
        example: 2.0,
        description: 'Соотношение назначений к отзывам',
    })
    declare readonly assignmentToRevocationRatio: number;

    @ApiProperty({
        type: [RoleOperationInfo],
        description: 'Топ ролей по частоте назначения',
    })
    declare readonly topAssignedRoles: RoleOperationInfo[];

    @ApiProperty({
        type: [RoleOperationInfo],
        description: 'Топ ролей по частоте отзыва',
    })
    declare readonly topRevokedRoles: RoleOperationInfo[];

    @ApiProperty({
        type: [OperationsByDayInfo],
        description: 'Операции по дням',
    })
    declare readonly operationsByDay: OperationsByDayInfo[];
}

/**
 * Информация об автоматических назначениях по типам
 */
export class AutoAssignmentByTypeInfo {
    @ApiProperty({
        example: 'VIP',
        description: 'Тип автоматического назначения (VIP, WHOLESALE, etc.)',
    })
    declare readonly type: string;

    @ApiProperty({ example: 10, description: 'Общее количество' })
    declare readonly count: number;

    @ApiProperty({ example: 10, description: 'Количество успешных' })
    declare readonly successCount: number;

    @ApiProperty({ example: 0, description: 'Количество неудачных' })
    declare readonly failureCount: number;
}

/**
 * Причина неудачных назначений
 */
export class FailureReasonInfo {
    @ApiProperty({
        example: 'Role already assigned',
        description: 'Причина неудачи',
    })
    declare readonly reason: string;

    @ApiProperty({ example: 2, description: 'Количество неудач' })
    declare readonly count: number;
}

/**
 * Response для статистики автоматических назначений
 * GET /role/analytics/auto-assignments/stats
 */
export class AutoAssignmentStatsResponse {
    @ApiProperty({
        example: 50,
        description: 'Общее количество автоматических назначений',
    })
    declare readonly totalAutoAssignments: number;

    @ApiProperty({
        example: 48,
        description: 'Количество успешных автоматических назначений',
    })
    declare readonly successfulAutoAssignments: number;

    @ApiProperty({
        example: 2,
        description: 'Количество неудачных автоматических назначений',
    })
    declare readonly failedAutoAssignments: number;

    @ApiProperty({
        example: 96.0,
        description: 'Процент успешных назначений',
    })
    declare readonly successRate: number;

    @ApiProperty({
        type: [AutoAssignmentByTypeInfo],
        description: 'Автоматические назначения по типам',
    })
    declare readonly autoAssignmentsByType: AutoAssignmentByTypeInfo[];

    @ApiProperty({
        type: [FailureReasonInfo],
        description: 'Причины неудачных назначений',
    })
    declare readonly failureReasons: FailureReasonInfo[];
}

/**
 * Статистика продлений ролей
 */
export class RenewalStatsInfo {
    @ApiProperty({ example: 10, description: 'Общее количество продлений' })
    declare readonly totalRenewals: number;

    @ApiPropertyOptional({
        example: 30.5,
        description: 'Средняя длительность продления в днях',
        nullable: true,
    })
    declare readonly averageRenewalDuration: number | null;

    @ApiProperty({
        example: 2,
        description: 'Количество ролей, достигших лимита продлений',
    })
    declare readonly rolesReachedLimit: number;
}

/**
 * Response для статистики истечения ролей
 * GET /role/analytics/expiration/stats
 */
export class RoleExpirationStatsResponse {
    @ApiProperty({
        example: 20,
        description: 'Количество активных ролей с временным истечением',
    })
    declare readonly activeRolesWithExpiration: number;

    @ApiProperty({
        example: 5,
        description: 'Количество истекших ролей за период',
    })
    declare readonly expiredRolesCount: number;

    @ApiPropertyOptional({
        example: 30.5,
        description: 'Средняя длительность ролей перед истечением в днях',
        nullable: true,
    })
    declare readonly averageDurationBeforeExpiration: number | null;

    @ApiProperty({
        type: RenewalStatsInfo,
        description: 'Статистика продлений',
    })
    declare readonly renewalStats: RenewalStatsInfo;
}

/**
 * Информация о пустой роли
 */
export class EmptyRoleInfo {
    @ApiProperty({ example: 1, description: 'ID роли' })
    declare readonly roleId: number;

    @ApiProperty({ example: 'EMPTY_ROLE', description: 'Название роли' })
    declare readonly roleName: string;

    @ApiProperty({ example: 50, description: 'Уровень роли' })
    declare readonly level: number;
}

/**
 * Response для статистики иерархии ролей
 * GET /role/analytics/hierarchy/stats
 */
export class RoleHierarchyStatsResponse {
    @ApiProperty({
        type: [RolesByLevelInfo],
        description: 'Роли по уровням с средним количеством разрешений',
    })
    declare readonly rolesByLevel: RolesByLevelInfo[];

    @ApiProperty({
        type: [EmptyRoleInfo],
        description: 'Роли без разрешений (пустые роли)',
    })
    declare readonly emptyRoles: EmptyRoleInfo[];

    @ApiProperty({ example: 100, description: 'Максимальный уровень роли' })
    declare readonly maxLevel: number;

    @ApiProperty({ example: 0, description: 'Минимальный уровень роли' })
    declare readonly minLevel: number;
}

/**
 * Response для распределения ролей по тенантам
 * GET /role/analytics/distribution/by-tenant
 */
export class TenantDistributionInfo {
    @ApiProperty({ example: 1, description: 'ID тенанта' })
    declare readonly tenantId: number;

    @ApiProperty({ example: 25, description: 'Общее количество ролей' })
    declare readonly totalRoles: number;

    @ApiProperty({ example: 20, description: 'Количество активных ролей' })
    declare readonly activeRoles: number;

    @ApiProperty({
        type: 'array',
        description: 'Топ ролей для тенанта',
        items: {
            type: 'object',
            properties: {
                roleName: { type: 'string', example: 'TENANT_ADMIN' },
                userCount: { type: 'number', example: 50 },
            },
        },
    })
    declare readonly topRoles: Array<{
        roleName: string;
        userCount: number;
    }>;
}

/**
 * Response для агрегированного дашборда
 * GET /role/analytics/dashboard
 */
export class RoleAnalyticsDashboardResponse {
    @ApiProperty({
        description: 'Статистика ролей',
        type: Object,
        example: {
            totalRoles: 25,
            activeRoles: 20,
            systemRoles: 10,
            tenantRoles: 15,
        },
    })
    declare readonly roleStats: {
        totalRoles: number;
        activeRoles: number;
        systemRoles: number;
        tenantRoles: number;
    };

    @ApiProperty({
        description: 'Статистика разрешений',
        type: Object,
    })
    declare readonly permissionStats: {
        totalUniquePermissions: number;
        topUsedPermissions: PermissionStatsInfo[];
    };

    @ApiPropertyOptional({
        description: 'Статистика операций (если указан период)',
        type: Object,
    })
    declare readonly operationsStats?: {
        totalAssignments: number;
        totalRevocations: number;
        assignmentToRevocationRatio: number;
    };

    @ApiProperty({
        description: 'Статистика истечения ролей',
        type: Object,
    })
    declare readonly expirationStats: {
        activeRolesWithExpiration: number;
        expiredRolesCount: number;
    };

    @ApiProperty({
        description: 'Статистика иерархии ролей',
        type: Object,
    })
    declare readonly hierarchyStats: {
        maxLevel: number;
        minLevel: number;
        emptyRolesCount: number;
    };

    @ApiProperty({
        type: [RoleStatsInfo],
        description: 'Топ используемых ролей',
    })
    declare readonly topUsedRoles: RoleStatsInfo[];
}
