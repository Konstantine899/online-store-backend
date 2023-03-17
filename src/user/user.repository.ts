import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';

Injectable();
export class UserRepository {
  constructor(
    @InjectModel(UserModel) private userRepository: typeof UserModel,
  ) {}

  public async createUser(dto: CreateUserDto): Promise<UserModel> {
    const findEmail = await this.findUserByEmail(dto.email);
    if (findEmail) {
      throw new BadRequestException(
        `Пользователь с таким email: ${dto.email} уже существует`,
      );
    }
    const user = new UserModel();
    user.email = dto.email;
    user.password = await hash(dto.password, 10);
    return user.save();
  }

  public async findUserById(id: number): Promise<UserModel> {
    return this.userRepository.findByPk(id);
  }

  public async findUserByEmail(email: string): Promise<UserModel> {
    return this.userRepository.findOne({
      where: { email },
      include: { all: true },
    });
  }

  public async findAllUsers() {
    return this.userRepository.findAll({ include: { all: true } });
  }

  public async removeUser(id: number) {
    return this.userRepository.destroy({ where: { id } });
  }
}
