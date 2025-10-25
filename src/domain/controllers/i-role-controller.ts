import type { CreateRoleDto } from '@app/infrastructure/dto';
import type {
    CreateRoleResponse,
    GetRoleResponse,
    GetListRoleResponse,
} from '@app/infrastructure/responses';

export interface IRoleController {
    createRole(dto: CreateRoleDto): Promise<CreateRoleResponse>;

    getRole(role: string): Promise<GetRoleResponse>;

    getListRole(): Promise<GetListRoleResponse[]>;
}
