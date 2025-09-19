import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RoleModel } from '@app/domain/models';
import { CreateRoleDto } from '@app/infrastructure/dto';
import {
    CreateRoleResponse,
    GetRoleResponse,
    GetListRoleResponse,
} from '@app/infrastructure/responses';
import { IRoleRepository } from '@app/domain/repositories';

@Injectable()
export class RoleRepository implements IRoleRepository {
    constructor(@InjectModel(RoleModel) private roleModel: typeof RoleModel) {}

    public async createRole(dto: CreateRoleDto): Promise<CreateRoleResponse> {
        const role = await this.roleModel.create(dto as any);
        return this.roleModel.findByPk(role.id) as Promise<CreateRoleResponse>;
    }

    public async findRole(role: string): Promise<GetRoleResponse> {
        return this.roleModel.findOne({ where: { role } }) as Promise<GetRoleResponse>;
    }

    public async findListRole(): Promise<GetListRoleResponse[]> {
        return this.roleModel.findAll();
    }
}
