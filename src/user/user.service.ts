import { Injectable } from '@nestjs/common';
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
	const role = await this.roleService.findRole('ADMIN');
	await user.$set('roles', [role.id]); // #set перезаписываю поле только в БД
	user.roles = [role]; // Добавляю roles в сам объект user
	return user.save();
  }

  async findUserById(id: number): Promise<UserModel | null> {
	return this.userRepository.findUserById(id);
  }

  async findUserByEmail(email: string): Promise<UserModel> {
	return this.userRepository.findUserByEmail(email);
  }

  async findAllUsers(): Promise<UserModel[]> {
	return this.userRepository.findAllUsers();
  }

  async update(id: number, dto: CreateUserDto): Promise<UserModel> {
	const user = await this.userRepository.updateUser(id, dto);
	const role = await this.roleService.findRole('USER');
	await user.$set('roles', [role.id]); // #set перезаписываю поле
	user.roles = [role];
	return user;
  }

  async remove(id: number): Promise<boolean> {
	await this.userRepository.removeUser(id);
	return true;
  }
}
