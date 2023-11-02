import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RoleModel } from '../../../domain/models/role.model';
import { CreateRoleDto } from '../../dto/role/create-role.dto';
import { CreateRoleResponse } from '../../responses/role/create-role.response';
import { GetRoleResponse } from '../../responses/role/get-role.response';
import { GetListRoleResponse } from '../../responses/role/get-list-role.response';
import { IRoleRepository } from '../../../domain/repositories/role/i-role-repository';

@Injectable()
export class RoleRepository implements IRoleRepository {
    constructor(@InjectModel(RoleModel) private roleModel: typeof RoleModel) {}

    public async createRole(dto: CreateRoleDto): Promise<CreateRoleResponse> {
        const role = await this.roleModel.create(dto);
        return this.roleModel.findByPk(role.id);
    }

    public async findRole(role: string): Promise<GetRoleResponse> {
        return this.roleModel.findOne({ where: { role } });
    }

    public async findListRole(): Promise<GetListRoleResponse[]> {
        return this.roleModel.findAll();
    }
}
