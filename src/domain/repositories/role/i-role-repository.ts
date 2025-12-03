import type { RoleModel } from '@app/domain/models';
import type { CreateRoleDto } from '@app/infrastructure/dto';
import type {
    CreateRoleResponse,
    GetListRoleResponse,
    GetRoleResponse,
} from '@app/infrastructure/responses';

export interface IRoleRepository {
    createRole(dto: CreateRoleDto): Promise<CreateRoleResponse>;

    findRole(role: string, tenantId?: number | null): Promise<GetRoleResponse>;

    findListRole(tenantId?: number | null): Promise<GetListRoleResponse[]>;

    findRoleById(
        id: number,
        tenantId?: number | null,
    ): Promise<RoleModel | null>;

    findRoleByName(role: string): Promise<RoleModel | null>;

    findAllRolesGrouped(): Promise<RoleModel[]>;

    createRolePermission(
        roleId: number,
        resource: string,
        action: string,
        conditions?: Record<string, unknown>,
    ): Promise<{
        id: number;
        roleId: number;
        resource: string;
        action: string;
    }>;

    deleteRolePermission(
        roleId: number,
        resource: string,
        action: string,
    ): Promise<boolean>;

    findRolePermissions(roleId: number): Promise<
        Array<{
            id: number;
            resource: string;
            action: string;
            conditions: Record<string, unknown> | null;
        }>
    >;

    assignRoleToUser(
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
    }>;

    revokeRoleFromUser(
        userId: number,
        roleId: number,
        tenantId: number,
    ): Promise<boolean>;

    findUserRoles(
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
    >;

    updateRole(
        id: number,
        dto: {
            role?: string;
            description?: string;
            level?: number;
            isActive?: boolean;
            tenantId?: number | null;
        },
        tenantId?: number | null,
    ): Promise<RoleModel>;

    deleteRole(id: number, tenantId?: number | null): Promise<boolean>;

    // ============================================================================
    // Методы для работы с автоматическим продлением ролей
    // ============================================================================

    /**
     * Создать конфигурацию автоматического продления для роли
     */
    createAutoRenewalConfig(
        userRoleId: number,
        renewalDurationMs: number,
        maxRenewals?: number,
        notificationEnabled?: boolean,
    ): Promise<{
        id: number;
        userRoleId: number;
        isEnabled: boolean;
        renewalDurationMs: number;
        maxRenewals: number;
        currentRenewalCount: number;
    }>;

    /**
     * Найти конфигурацию автоматического продления по userRoleId
     */
    findAutoRenewalConfig(
        userRoleId: number,
    ): Promise<{
        id: number;
        userRoleId: number;
        isEnabled: boolean;
        renewalDurationMs: number;
        maxRenewals: number;
        currentRenewalCount: number;
        lastRenewedAt: Date | null;
        notificationEnabled: boolean;
    } | null>;

    /**
     * Обновить конфигурацию автоматического продления
     */
    updateAutoRenewalConfig(
        userRoleId: number,
        updates: {
            isEnabled?: boolean;
            renewalDurationMs?: number;
            maxRenewals?: number;
            notificationEnabled?: boolean;
        },
    ): Promise<boolean>;

    /**
     * Удалить конфигурацию автоматического продления
     */
    deleteAutoRenewalConfig(userRoleId: number): Promise<boolean>;

    /**
     * Найти истекшие активные роли (для деактивации)
     * @param batchSize - Максимальное количество ролей для обработки
     * @param beforeDate - Дата до которой искать истекшие роли (опционально, по умолчанию текущая дата)
     */
    findExpiredActiveRoles(
        batchSize?: number,
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
    >;

    /**
     * Batch деактивация истекших ролей
     * @param userRoleIds - Массив ID истекших ролей для деактивации
     */
    batchDeactivateExpiredRoles(userRoleIds: number[]): Promise<number>;

    /**
     * Найти роли с активной конфигурацией автоматического продления,
     * которые истекают в указанный период (для проверки необходимости продления)
     */
    findRolesWithAutoRenewalExpiringSoon(
        daysUntilExpiration: number,
        batchSize?: number,
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
    >;

    /**
     * Обновить счетчик продлений и дату последнего продления
     */
    incrementRenewalCount(
        userRoleId: number,
        newExpiresAt: Date,
    ): Promise<boolean>;
}
