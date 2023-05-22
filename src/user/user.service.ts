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

  public async getUser(id: number): Promise<UserModel> {
	const foundUser = await this.userRepository.findUser(id);
	if (!foundUser) {
		this.notFound(`Пользователь не найден В БД`);
	}
	return foundUser;
  }

  public async loginCheck(id: number): Promise<UserModel> {
	const user = await this.userRepository.findUser(id);
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
	if (!listUsers) {
		this.notFound(`Список пользователей пуст`);
	}
	return listUsers;
  }

  public async updateUser(id: number, dto: CreateUserDto): Promise<UserModel> {
	const foundUser = await this.userRepository.findUser(id);
	if (!foundUser) {
		this.notFound(`Пользователь с id: ${id} не найден в БД`);
	}
	const foundEmail = await this.findUserByEmail(dto.email);
	if (foundEmail) {
		this.badRequest(
		`Пользователь с таким email: ${dto.email} уже существует`,
		);
	}
	const updatedUser = await this.userRepository.updateUser(foundUser, dto);
	const role = await this.roleService.getRole('USER');
	/* #set Потому что обновляется весь объект. Ищу роль пользователя и при обновлении перезаписываю поле*/
	await updatedUser.$set('roles', [role.id]);
	updatedUser.roles = [role];
	return updatedUser;
  }

  public async removeUser(id: number): Promise<number> {
	const user = await this.userRepository.findUser(id);
	if (!user) {
		this.notFound(`Пользователь не найден в БД`);
	}
	return this.userRepository.removeUser(user.id);
  }

  public async addRole(dto: AddRoleDto): Promise<unknown> {
	const user = await this.userRepository.findUser(dto.userId);
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
	const user = await this.userRepository.findUser(dto.userId);
	if (!user) {
		this.notFound(`Пользователь не найден в БД`);
	}
	const foundRole = await this.roleService.getRole(dto.role);
	if (!foundRole) {
		this.notFound(`Роль ${dto.role} не найдена в БД`);
	}
	if (foundRole.role === 'USER') {
		this.forbiddenException('Удаление роли USER запрещено');
	}
	return user.$remove('role', foundRole.id);
  }

  private notFound(message: string): void {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message,
	});
  }

  private badRequest(message: string): void {
	throw new BadRequestException({ status: HttpStatus.BAD_REQUEST, message });
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
