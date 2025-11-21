import type {
    AssignPermissionDto,
    AssignRoleDto,
    CreateRoleDto,
    RevokePermissionDto,
    RevokeRoleDto,
} from '@app/infrastructure/dto';
import type {
    AssignPermissionResponse,
    AssignRoleResponse,
    CreateRoleResponse,
    GetListRoleResponse,
    GetRoleHierarchyResponse,
    GetRoleLevelResponse,
    GetRolePermissionsResponse,
    GetRoleResponse,
    GetUserRolesResponse,
    RevokePermissionResponse,
    RevokeRoleResponse,
} from '@app/infrastructure/responses';

export interface IRoleService {
    createRole(dto: CreateRoleDto): Promise<CreateRoleResponse>;

    getRole(role: string): Promise<GetRoleResponse>;

    getListRole(): Promise<GetListRoleResponse[]>;

    assignPermission(
        dto: AssignPermissionDto,
        tenantId: number | null,
    ): Promise<AssignPermissionResponse>;

    revokePermission(
        dto: RevokePermissionDto,
        tenantId: number | null,
    ): Promise<RevokePermissionResponse>;

    getRolePermissions(
        roleId: number,
        tenantId: number | null,
    ): Promise<GetRolePermissionsResponse>;

    assignRoleToUser(
        dto: AssignRoleDto,
        tenantId: number | null,
        userRoles: string[],
    ): Promise<AssignRoleResponse>;

    revokeRoleFromUser(
        dto: RevokeRoleDto,
        tenantId: number | null,
        userRoles: string[],
    ): Promise<RevokeRoleResponse>;

    getUserRoles(
        userId: number,
        tenantId: number | null,
    ): Promise<GetUserRolesResponse>;

    getRoleHierarchy(): Promise<GetRoleHierarchyResponse>;

    getRoleLevel(role: string): Promise<GetRoleLevelResponse>;
}
