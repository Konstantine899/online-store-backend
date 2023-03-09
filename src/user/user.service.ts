import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleService } from '../role/role.service';

@Injectable()
export class UserService {
  constructor(
	@InjectModel(UserModel) private userRepository: typeof UserModel,
	private roleService: RoleService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserModel> {
	const user = await this.userRepository.create(dto);
	const role = await this.roleService.findOne('USER');
	if (!user) {
		throw new HttpException(
		'Произошла не предвиденная ошибка',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
	await user.$set('roles', [role.id]); // #set перезаписываю поле
	return user;
  }

  async findOne(id: number): Promise<UserModel> {
	const user = await this.userRepository.findByPk(id);
	if (!user) {
		throw new NotFoundException('Не найдено');
	}
	return user;
  }

  async findAll(): Promise<UserModel[]> {
	const users = await this.userRepository.findAll({ include: { all: true } });
	if (!users) {
		throw new NotFoundException('Не найдено');
	}
	return users;
  }

  async update(id: number, dto: CreateUserDto): Promise<UserModel> {
	const user = await this.findOne(id);
	const role = await this.roleService.findOne('USER');
	const updateUser = await user.update({
		...dto,
		email: dto.email,
		password: dto.password,
	});
	if (!updateUser) {
		throw new HttpException(
		'Произошла не предвиденная ошибка',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
	await user.$set('roles', [role.id]); // #set перезаписываю поле
	return updateUser;
  }

  async remove(id: number): Promise<boolean> {
	await this.findOne(id);
	await this.userRepository.destroy({ where: { id } });
	return true;
  }
}
