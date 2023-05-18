import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserModel } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleService } from '../role/role.service';
import { UserRepository } from './user.repository';
import { AddRoleDto } from './dto/add-role.dto';
import { RemoveRoleDto } from './dto/remove-role.dto';

@Injectable()
export class UserService {
  constructor(
	private readonly userRepository: UserRepository,
	private roleService: RoleService,
  ) {}

  public async createUser(dto: CreateUserDto): Promise<UserModel> {
	const findEmail = await this.userRepository.findUserByEmail(dto.email);
	if (findEmail) {
		throw new BadRequestException(
		`Пользователь с таким email: ${dto.email} уже существует`,
		);
	}
	const user = await this.userRepository.createUser(dto);
	const role = await this.roleService.getRole('USER');
	if (!role) {
		this.notFound('Роль USER не найдена в БД');
	}
	await user.$set('roles', [role.id]); // #set перезаписываю поле только в БД
	user.roles = [role]; // Добавляю roles в сам объект user
	await user.save();
	return this.userRepository.findRegisteredUser(user.id);
  }

  public async findAuthenticatedUser(userId: number): Promise<UserModel> {
	return this.userRepository.findAuthenticatedUser(userId);
  }

  public async getProfileUser(id: number): Promise<UserModel> {
	const user = await this.userRepository.findProfileUser(id);
	if (!user) {
		this.notFound('Профиль пользователя не найден в БД');
	}
	return user;
  }

  public async findUserByEmail(email: string): Promise<UserModel> {
	return this.userRepository.findUserByEmail(email);
  }

  public async getListUsers(): Promise<UserModel[]> {
	const listUsers = this.userRepository.findListUsers();
	if (!listUsers) { this.notFound(`Список пользователей пуст`); }
	return listUsers;
  }

  public async updateUser(id: number, dto: CreateUserDto): Promise<UserModel> {
	const user = await this.userRepository.updateUser(id, dto);
	const role = await this.roleService.getRole('USER');
	/* #set Потому что обновляется весь объект. Ищу роль пользователя и при обновлении перезаписываю поле*/
	await user.$set('roles', [role.id]);
	user.roles = [role];
	return user;
  }

  public async removeUser(id: number): Promise<number> {
	const user = await this.getProfileUser(id);
	if (!user) {
		throw new NotFoundException(`Пользователь не найден`);
	}
	return this.userRepository.removeUser(user.id);
  }

  public async addRole(dto: AddRoleDto): Promise<unknown> {
	const user = await this.userRepository.findUserById(dto.userId);
	if (!user) {
		this.notFound(`Пользователь не найден в БД`);
	}
	const foundRole = await this.roleService.getRole(dto.role);
	if (!foundRole) {
		this.notFound(`Роль не найдена в БД`);
	}
	const addedRole = await user.$add('role', foundRole.id);
	if (!addedRole) {
		this.conflictException(
		`Данному пользователю уже присвоена роль ${foundRole.role}`,
		);
	}
	return addedRole;
  }

  public async removeRole(dto: RemoveRoleDto): Promise<number> {
	const user = await this.userRepository.findUserById(dto.userId);
	if (!user) {
		this.notFound(`Пользователь не найден в БД`);
	}
	const foundRole = await this.roleService.getRole(dto.role);
	if (foundRole.role === 'USER') {
		this.forbiddenException('Удаление роли USER запрещено');
	}
	const removedRole: number = await user.$remove('role', foundRole.id);
	if (!removedRole) {
		this.notFound(
		`Роль ${foundRole.role} не принадлежит данному пользователю`,
		);
	}
	return removedRole;
  }

  private notFound(message: string): void {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message,
	});
  }

  private conflictException(message: string): void {
	throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message,
	});
  }

  private forbiddenException(message: string): void {
	throw new ForbiddenException({
		status: HttpStatus.FORBIDDEN,
		message,
	});
  }
}
