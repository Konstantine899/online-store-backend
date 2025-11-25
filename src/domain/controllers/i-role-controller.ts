import type { CreateRoleDto, UpdateRoleDto } from '@app/infrastructure/dto';
import type {
    CreateRoleResponse,
    DeleteRoleResponse,
    GetListRoleResponse,
    GetRoleResponse,
    UpdateRoleResponse,
} from '@app/infrastructure/responses';
import type { Request } from 'express';

export interface IRoleController {
    createRole(dto: CreateRoleDto): Promise<CreateRoleResponse>;

    getRole(role: string, request: Request): Promise<GetRoleResponse>;

    getListRole(request: Request): Promise<GetListRoleResponse[]>;

    updateRole(
        id: number,
        dto: UpdateRoleDto,
        request: Request,
    ): Promise<UpdateRoleResponse>;

    deleteRole(id: number, request: Request): Promise<DeleteRoleResponse>;
}
