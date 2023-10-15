import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';
import { RoleModel } from '../role/role.model';
import { CreateUserResponse } from './responses/create-user.response';
import { GetListUsersResponse } from './responses/get-list-users.response';
import { GetUserResponse } from './responses/get-user-response';
import { UpdateUserResponse } from './responses/update-user-response';

Injectable();

export class UserRepository {
    constructor(@InjectModel(UserModel) private userModel: typeof UserModel) {}

    public async createUser(dto: CreateUserDto): Promise<UserModel> {
        const user = new UserModel();
        user.email = dto.email;
        user.password = await hash(dto.password, 10);
        return user.save();
    }

    public async updateUser(
        user: UserModel,
        dto: CreateUserDto,
    ): Promise<UpdateUserResponse> {
        await user.update({
            ...dto,
            email: dto.email,
            password: await hash(dto.password, 10),
        });

        return this.userModel.findByPk(user.id, {
            attributes: { exclude: ['password'] },
            include: { model: RoleModel, through: { attributes: [] } },
            /*Так как при обновлении всего объекта пользователя я обновляю и его роль, то роли тоже возвращаю,
 кроме данных из связующей таблицы user-role*/
        });
    }

    public async findUser(id: number): Promise<GetUserResponse> {
        return this.userModel.findOne({
            where: { id },
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: RoleModel,
                    through: { attributes: [] },
                },
            ],
        });
    }

    // Используется в модуле Rating и Order
    public async findUserByPkId(userId: number): Promise<UserModel> {
        return this.userModel.findByPk(userId, {});
    }

    public async findRegisteredUser(
        userId: number,
    ): Promise<CreateUserResponse> {
        return this.userModel.findByPk(userId, {
            attributes: { exclude: ['password'] },
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
            attributes: { exclude: ['password'] },
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

    public async findListUsers(): Promise<GetListUsersResponse[]> {
        return this.userModel.findAll({
            attributes: { exclude: ['password'] },
        });
    }

    public async removeUser(id: number) {
        return this.userModel.destroy({ where: { id } });
    }
}
