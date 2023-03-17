import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RoleModel } from './role.model';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectModel(RoleModel) private roleRepository: typeof RoleModel,
  ) {}

  public async createRole(dto: CreateRoleDto): Promise<RoleModel> {
    return await this.roleRepository.create(dto);
  }

  public async findRole(role: string): Promise<RoleModel> {
    return await this.roleRepository.findOne({ where: { role } });
  }
}