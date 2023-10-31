import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from '../../dto/role/create-role.dto';
import { RoleRepository } from '../../repositories/role/role.repository';
import { CreateRoleResponse } from '../../responses/role/create-role.response';
import { GetRoleResponse } from '../../responses/role/get-role.response';
import { GetListRoleResponse } from '../../responses/role/get-list-role.response';

interface IRoleService {
    createRole(dto: CreateRoleDto): Promise<CreateRoleResponse>;

    getRole(role: string): Promise<GetRoleResponse>;

    getListRole(): Promise<GetListRoleResponse[]>;
}

@Injectable()
export class RoleService implements IRoleService {
    constructor(private readonly roleRepository: RoleRepository) {}

    public async createRole(dto: CreateRoleDto): Promise<CreateRoleResponse> {
        return this.roleRepository.createRole(dto);
    }

    public async getRole(role: string): Promise<GetRoleResponse> {
        const foundRole = this.roleRepository.findRole(role);
        if (!foundRole) {
            this.notFound(`Роль ${role} не найдена`);
        }
        return foundRole;
    }

    public async getListRole(): Promise<GetListRoleResponse[]> {
        const roles = await this.roleRepository.findListRole();
        if (!roles) {
            this.notFound('Роли не найдены');
        }
        return roles;
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }
}
