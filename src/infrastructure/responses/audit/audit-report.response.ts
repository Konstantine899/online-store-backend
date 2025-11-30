import { AuditAction, AuditLogModel } from '@app/domain/models';
import { IAuditLogDiff } from '@app/infrastructure/services/audit/role-audit.service';

/**
 * Response для сводного отчёта по audit логам
 */
export class AuditSummaryResponse {
    declare readonly totalOperations: number;
    declare readonly operationsByAction: Record<AuditAction, number>;
    declare readonly operationsByEntityType: Record<string, number>;
    declare readonly topUsers: Array<{
        userId: number;
        userName: string | null;
        userEmail: string | null;
        operationsCount: number;
    }>;
    declare readonly dateRange: {
        start: string;
        end: string;
    };
    declare readonly tenantId?: number | null;
}

/**
 * Response для timeline роли
 */
export class AuditTimelineResponse {
    declare readonly roleId: number;
    declare readonly roleName: string;
    declare readonly events: Array<{
        id: number;
        action: AuditAction;
        performedBy: {
            userId: number | null;
            userName: string | null;
            userEmail: string | null;
        };
        timestamp: string;
        changes: IAuditLogDiff;
        ipAddress: string | null;
        requestId: string | null;
    }>;
}

/**
 * Response для отчёта об активности пользователя
 */
export class UserActivityReportResponse {
    declare readonly userId: number;
    declare readonly userName: string | null;
    declare readonly userEmail: string | null;
    declare readonly totalOperations: number;
    declare readonly operationsByAction: Record<AuditAction, number>;
    declare readonly rolesModified: Array<{
        roleId: number;
        roleName: string;
        operationsCount: number;
    }>;
    declare readonly dateRange: {
        start: string;
        end: string;
    };
}

