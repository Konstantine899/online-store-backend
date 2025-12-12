import type { AuditAction, AuditLogModel } from '@app/domain/models';
import type { IAuditLogDiff } from '@app/infrastructure/services/audit/role-audit.service';

/**
 * Response для одного audit лога
 */
export class AuditLogResponse {
    declare readonly id: number;
    declare readonly entityType: string;
    declare readonly entityId: number;
    declare readonly action: AuditAction;
    declare readonly userId: number | null;
    declare readonly userName?: string | null;
    declare readonly userEmail?: string | null;
    declare readonly oldValues: Record<string, unknown> | null;
    declare readonly newValues: Record<string, unknown> | null;
    declare readonly ipAddress: string | null;
    declare readonly userAgent: string | null;
    declare readonly requestId: string | null;
    declare readonly tenantId: number | null;
    declare readonly createdAt: Date;
    declare readonly diff?: IAuditLogDiff;
}

/**
 * Response для пагинированного списка audit логов
 */
export class PaginatedAuditLogsResponse {
    declare readonly data: AuditLogResponse[];
    declare readonly meta: {
        totalCount: number;
        currentPage: number;
        lastPage: number;
        limit: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

/**
 * Маппер для преобразования AuditLogModel в AuditLogResponse
 */
export function mapAuditLogToResponse(
    auditLog: AuditLogModel,
    includeDiff: boolean = false,
    diff?: IAuditLogDiff,
): AuditLogResponse {
    return {
        id: auditLog.id,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        action: auditLog.action,
        userId: auditLog.userId,
        userName:
            auditLog.user?.firstName && auditLog.user?.lastName
                ? `${auditLog.user.firstName} ${auditLog.user.lastName}`
                : (auditLog.user?.email ?? null),
        userEmail: auditLog.user?.email ?? null,
        oldValues: auditLog.oldValues,
        newValues: auditLog.newValues,
        ipAddress: auditLog.ipAddress,
        userAgent: auditLog.userAgent,
        requestId: auditLog.requestId,
        tenantId: auditLog.tenantId,
        createdAt: auditLog.createdAt,
        ...(includeDiff && diff ? { diff } : {}),
    };
}
