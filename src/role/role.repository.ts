import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RoleModel } from './role.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreateRoleResponse } from './responses/create-role.response';
import { GetRoleResponse } from './responses/get-role.response';

@Injectable()
export class RoleRepository {
  constructor(@InjectModel(RoleModel) private roleModel: typeof RoleModel) {}

  public async createRole(dto: CreateRoleDto): Promise<CreateRoleResponse> {
	const role = await this.roleModel.create(dto);
	return this.roleModel.findByPk(role.id);
  }

  public async findRole(role: string): Promise<GetRoleResponse> {
	return this.roleModel.findOne({ where: { role } });
  }

  public async getAllRoles(): Promise<RoleModel[]> {
	return this.roleModel.findAll();
  }
}
