import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { RoleModel } from './role.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleRepository } from './role.repository';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  public async createRole(dto: CreateRoleDto): Promise<RoleModel> {
	return this.roleRepository.createRole(dto);
  }

  public async getRole(role: string): Promise<RoleModel> {
	const foundRole = this.roleRepository.findRole(role);
	if (!foundRole) {
		this.notFound(`Роль ${role} не найдена`);
	}
	return foundRole;
  }

  public async getListRoles(): Promise<RoleModel[]> {
	const roles = await this.roleRepository.getAllRoles();
	if (!roles) {
		this.notFound(`Роли не найдены`);
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
