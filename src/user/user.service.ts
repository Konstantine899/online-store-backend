import { Injectable, NotFoundException } from '@nestjs/common';
import { UserModel } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleService } from '../role/role.service';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
	private readonly userRepository: UserRepository,
	private roleService: RoleService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserModel> {
	const user = await this.userRepository.createUser(dto);
	const role = await this.roleService.findRole('USER');
	await user.$set('roles', [role.id]); // #set перезаписываю поле только в БД
	user.roles = [role]; // Добавляю roles в сам объект user
	return user.save();
  }

  async findUserById(id: number): Promise<UserModel | null> {
	const user = await this.userRepository.findUserById(id);
	if (!user) {
		throw new NotFoundException('Пользователь не найден');
	}
	return user;
  }

  async findUserByEmail(email: string): Promise<UserModel> {
	const userEmail = this.userRepository.findUserByEmail(email);
	if (!userEmail) {
		throw new NotFoundException('Такой email не найден');
	}
	return userEmail;
  }

  async findAllUsers(): Promise<UserModel[]> {
	const users = await this.userRepository.findAllUsers();
	if (!users) {
		throw new NotFoundException('Пользователи не найдены');
	}
	return users;
  }

  async update(id: number, dto: CreateUserDto): Promise<UserModel> {
	const user = await this.findUserById(id);
	const role = await this.roleService.findRole('USER');
	const updateUser = await user.update({
		...dto,
		email: dto.email,
		password: dto.password,
	});
	await user.$set('roles', [role.id]); // #set перезаписываю поле
	user.roles = [role];
	return updateUser.save();
  }

  async remove(id: number): Promise<boolean> {
	const userId = await this.findUserById(id);
	await this.userRepository.removeUser(userId.id);
	return true;
  }
}
