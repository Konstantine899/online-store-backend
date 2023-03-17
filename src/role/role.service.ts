import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleModel } from './role.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleRepository } from './role.repository';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async create(dto: CreateRoleDto): Promise<RoleModel> {
    return await this.roleRepository.createRole(dto);
  }

  async findRole(role: string): Promise<RoleModel> {
    const userRole = await this.roleRepository.findRole(role);
    if (!userRole) {
      throw new NotFoundException('Роль пользователя не найдена');
    }
    return userRole;
  }
}
