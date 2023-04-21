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

  public async create(dto: CreateUserDto): Promise<UserModel> {
	const findEmail = await this.userRepository.findUserByEmail(dto.email);
	if (findEmail) {
		throw new BadRequestException(
		`Пользователь с таким email: ${dto.email} уже существует`,
		);
	}
	const user = await this.userRepository.createUser(dto);
	const role = await this.roleService.findRole('USER');
	if (!role) {
		this.notFound('Роль пользователя не найдена');
	}
	await user.$set('roles', [role.id]); // #set перезаписываю поле только в БД
	user.roles = [role]; // Добавляю roles в сам объект user
	return user.save();
  }

  public async findUserById(id: number): Promise<UserModel> {
	const user = this.userRepository.findUserById(id);
	if (!user) {
		this.notFound('Пользователь не найден');
	}
	return user;
  }

  public async findUserByEmail(email: string): Promise<UserModel> {
	return this.userRepository.findUserByEmail(email);
  }

  public async findAllUsers(): Promise<UserModel[]> {
	return this.userRepository.findAllUsers();
  }

  public async update(id: number, dto: CreateUserDto): Promise<UserModel> {
	const user = await this.userRepository.updateUser(id, dto);
	const role = await this.roleService.findRole('USER');
	await user.$set('roles', [role.id]); // #set перезаписываю поле
	user.roles = [role];
	return user;
  }

  public async remove(id: number): Promise<boolean> {
	await this.userRepository.removeUser(id);
	return true;
  }

  public async addRole(dto: AddRoleDto): Promise<UserModel> {
	const user = await this.userRepository.findUserById(dto.userId);
	const foundRole = await this.roleService.findRole(dto.role);
	const addedRole = await user.$add('role', foundRole.id);
	if (!addedRole) {
		throw new ConflictException({
		status: HttpStatus.CONFLICT,
		message: `Данному пользователю уже присвоена роль ${foundRole.role}`,
		});
	}
	return this.userRepository.findUserById(user.id);
  }

  public async removeRole(dto: RemoveRoleDto): Promise<UserModel> {
	const user = await this.userRepository.findUserById(dto.userId);
	if (!user) {
		this.notFound(`Пользователь не найден`);
	}
	const foundRole = await this.roleService.findRole(dto.role);
	if (foundRole.role === 'USER') {
		throw new ForbiddenException({
		status: HttpStatus.FORBIDDEN,
		message: 'Удаление роли USER запрещено',
		});
	}
	const removedRole = await user.$remove('role', foundRole.id);
	if (!removedRole) {
		this.notFound(
		`Роль ${foundRole.role} не принадлежит данному пользователю`,
		);
	}
	return this.userRepository.findUserById(user.id);
  }

  private notFound(message: string): void {
	throw new NotFoundException({
		status: HttpStatus.NOT_FOUND,
		message,
	});
  }
}
