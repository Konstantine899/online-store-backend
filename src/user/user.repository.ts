import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';

Injectable();
export class UserRepository {
  constructor(@InjectModel(UserModel) private userModel: typeof UserModel) {}

  public async createUser(dto: CreateUserDto): Promise<UserModel> {
	const user = new UserModel();
	user.email = dto.email;
	user.password = await hash(dto.password, 10);
	return user.save();
  }

  public async updateUser(id: number, dto: CreateUserDto): Promise<UserModel> {
	const user = await this.findUserById(id);
	const findEmail = await this.findUserByEmail(dto.email);
	if (findEmail) {
		throw new BadRequestException(
		`Пользователь с таким email: ${dto.email} уже существует`,
		);
	}
	return user.update({
		...dto,
		email: dto.email,
		password: await hash(dto.password, 10),
	});
  }

  public async findUserById(id: number): Promise<UserModel> {
	return this.userModel.findOne({
		where: { id },
		attributes: { exclude: [`updatedAt`, `createdAt`] },
	});
  }

  // Используется в модуле Rating
  public async findUserByPkId(userId: number): Promise<UserModel> {
	return this.userModel.findByPk(userId, {
		attributes: { exclude: [`updatedAt`, `createdAt`] },
	});
  }

  public async findUserByEmail(email: string): Promise<UserModel> {
	return this.userModel.findOne({
		where: { email },
		include: { all: true },
	});
  }

  public async findListUsers() {
	return this.userModel.findAll();
  }

  public async removeUser(id: number) {
	const user = await this.findUserById(id);
	if (!user) {
		throw new NotFoundException(`Пользователь не найден`);
	}
	return this.userModel.destroy({ where: { id: user.id } });
  }
}
