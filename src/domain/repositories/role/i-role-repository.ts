import type { RoleModel } from '@app/domain/models';
import type { CreateRoleDto } from '@app/infrastructure/dto';
import type {
    CreateRoleResponse,
    GetListRoleResponse,
    GetRoleResponse,
} from '@app/infrastructure/responses';

export interface IRoleRepository {
    createRole(dto: CreateRoleDto): Promise<CreateRoleResponse>;

    findRole(role: string): Promise<GetRoleResponse>;

    findListRole(): Promise<GetListRoleResponse[]>;

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
}
