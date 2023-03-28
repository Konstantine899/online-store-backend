import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { RoleModel } from './role.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleRepository } from './role.repository';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  public async create(dto: CreateRoleDto): Promise<RoleModel> {
	return this.roleRepository.createRole(dto);
  }

  public async findRole(role: string): Promise<RoleModel> {
	const userRole = await this.roleRepository.findRole(role);
	if (!userRole) {
		throw new NotFoundException('Роль пользователя не найдена');
	}
	return userRole;
  }

  public async getAllRoles(): Promise<RoleModel[]> {
	const roles = await this.roleRepository.getAllRoles();
	if (!roles) {
		throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message: `Роли пользователя не найдены`,
		});
	}
	return roles;
  }
}
