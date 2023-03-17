import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';

Injectable();

export class UserRepository {
  constructor(
    @InjectModel(UserModel) private userRepository: typeof UserModel,
  ) {}

  public async createUser(dto: CreateUserDto): Promise<UserModel> {
    return await this.userRepository.create(dto);
  }

  public async findUserById(id: number): Promise<UserModel> {
    return await this.userRepository.findByPk(id);
  }

  public async findUserByEmail(email: string): Promise<UserModel> {
    return await this.userRepository.findOne({
      where: { email },
      include: { all: true },
    });
  }

  public async findAllUsers() {
    return await this.userRepository.findAll({ include: { all: true } });
  }

  public async removeUser(id: number) {
    return await this.userRepository.destroy({ where: { id } });
  }
}
