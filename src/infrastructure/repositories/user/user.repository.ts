import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel, RoleModel } from '@app/domain/models';
import { CreateUserDto } from '@app/infrastructure/dto';
import { hash } from 'bcrypt';
import {
    CreateUserResponse,
    GetListUsersResponse,
    GetUserResponse,
    UpdateUserResponse,
} from '@app/infrastructure/responses';
import { IUserRepository } from '@app/domain/repositories';

@Injectable()
export class UserRepository implements IUserRepository {
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
            include: {
                model: RoleModel,
                through: { attributes: [] },
            },
            /*Так как при обновлении всего объекта пользователя я обновляю и его роль, то роли тоже возвращаю,
кроме данных из связующей таблицы user-role*/
        }) as Promise<UpdateUserResponse>;
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
        }) as Promise<GetUserResponse>;
    }

    // Используется в модуле Rating и Order
    public async findUserByPkId(userId: number): Promise<UserModel> {
        return this.userModel.findByPk(userId, {}) as Promise<UserModel>;
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
        }) as Promise<UserModel>;
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
        }) as Promise<UserModel>;
    }

    public async findUserByEmail(email: string): Promise<UserModel> {
        return this.userModel.findOne({
            where: { email },
        }) as Promise<UserModel>;
    }

    public async findListUsers(): Promise<GetListUsersResponse[]> {
        return this.userModel.findAll({
            attributes: { exclude: ['password'] },
        });
    }

    public async removeUser(id: number): Promise<number> {
        return this.userModel.destroy({ where: { id } });
    }
}
