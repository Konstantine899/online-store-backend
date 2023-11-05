import { CreateRoleDto } from '@app/infrastructure/dto';
import {
    CreateRoleResponse,
    GetRoleResponse,
    GetListRoleResponse,
} from '@app/infrastructure/responses';

export interface IRoleRepository {
    createRole(dto: CreateRoleDto): Promise<CreateRoleResponse>;

    findRole(role: string): Promise<GetRoleResponse>;

    findListRole(): Promise<GetListRoleResponse[]>;
}
