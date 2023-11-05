import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from '@app/infrastructure/dto';
import { RoleRepository } from '@app/infrastructure/repositories';
import {
    CreateRoleResponse,
    GetRoleResponse,
    GetListRoleResponse,
} from '@app/infrastructure/responses';
import { IRoleService } from '@app/domain/services';

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
