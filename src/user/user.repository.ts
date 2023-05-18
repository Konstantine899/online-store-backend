import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';
import { RoleModel } from '../role/role.model';
import { OrderModel } from '../order/order.model';
import { OrderItemModel } from '../order-item/order-item.model';

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
	const user = await this.findUser(id);
	const findEmail = await this.findUserByEmail(dto.email);
	if (findEmail) {
		throw new BadRequestException(
		`Пользователь с таким email: ${dto.email} уже существует`,
		);
	}
	await user.update({
		...dto,
		email: dto.email,
		password: await hash(dto.password, 10),
	});

	return this.userModel.findByPk(user.id);
  }

  public async findUser(id: number): Promise<UserModel> {
	return this.userModel.findOne({
		where: { id },
		attributes: { exclude: [`password`] },
		include: [
		{
			model: RoleModel,
			through: { attributes: [] }, // this may not be needed
		},
		],
	});
  }

  public async findProfileUser(id: number): Promise<UserModel> {
	return this.userModel.findOne({
		where: { id },
		attributes: { exclude: [`password`] },
		include: [
		{
			model: OrderModel,
			include: [
			{
				model: OrderItemModel,
				as: `items`,
				attributes: ['name', 'price', 'quantity'],
			},
			],
		},
		],
	});
  }

  // Используется в модуле Rating и Order
  public async findUserByPkId(userId: number): Promise<UserModel> {
	return this.userModel.findByPk(userId, {});
  }

  public async findRegisteredUser(userId: number): Promise<UserModel> {
	return this.userModel.findByPk(userId, {
		attributes: { exclude: [`password`] },
		include: [
		{
			model: RoleModel,
			through: { attributes: [] }, // ограничиваю получение данных из промежуточной таблицы user-role
		},
		],
	});
  }

  public async findAuthenticatedUser(userId: number): Promise<UserModel> {
	return this.userModel.findByPk(userId, {
		attributes: { exclude: [`password`] },
		include: [
		{
			model: RoleModel,
			through: { attributes: [] }, // this may not be needed
		},
		],
	});
  }

  public async findUserByEmail(email: string): Promise<UserModel> {
	return this.userModel.findOne({
		where: { email },
	});
  }

  public async findListUsers() {
	return this.userModel.findAll({ attributes: { exclude: [`password`] } });
  }

  public async removeUser(id: number) {
	return this.userModel.destroy({ where: { id } });
  }
}
