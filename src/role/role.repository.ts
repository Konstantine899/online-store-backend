import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RoleModel } from './role.model';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleRepository {
  constructor(@InjectModel(RoleModel) private roleModel: typeof RoleModel) {}

  public async createRole(dto: CreateRoleDto): Promise<RoleModel> {
	return this.roleModel.create(dto);
  }

  public async findRole(role: string): Promise<RoleModel> {
	return this.roleModel.findOne({ where: { role } });
  }

  public async getAllRoles(): Promise<RoleModel[]> {
	return this.roleModel.findAll();
  }
}
