import { CreateRoleDto } from '../../../infrastructure/dto/role/create-role.dto';
import { CreateRoleResponse } from '../../../infrastructure/responses/role/create-role.response';
import { GetRoleResponse } from '../../../infrastructure/responses/role/get-role.response';
import { GetListRoleResponse } from '../../../infrastructure/responses/role/get-list-role.response';

export interface IRoleService {
    createRole(dto: CreateRoleDto): Promise<CreateRoleResponse>;

    getRole(role: string): Promise<GetRoleResponse>;

    getListRole(): Promise<GetListRoleResponse[]>;
}
