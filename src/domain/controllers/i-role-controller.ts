import type { CreateRoleDto, UpdateRoleDto } from '@app/infrastructure/dto';
import type {
    CreateRoleResponse,
    DeleteRoleResponse,
    GetListRoleResponse,
    GetRoleResponse,
    UpdateRoleResponse,
} from '@app/infrastructure/responses';

export interface IRoleController {
    createRole(dto: CreateRoleDto): Promise<CreateRoleResponse>;

    getRole(role: string): Promise<GetRoleResponse>;

    getListRole(): Promise<GetListRoleResponse[]>;

    updateRole(id: number, dto: UpdateRoleDto): Promise<UpdateRoleResponse>;

    deleteRole(id: number): Promise<DeleteRoleResponse>;
}
