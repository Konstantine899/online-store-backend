import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { RoleModel } from './role.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleRepository } from './role.repository';
import { CreateRoleResponse } from './responses/create-role.response';
import { GetRoleResponse } from './responses/get-role.response';

@Injectable()
export class RoleService {
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
