import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from '@app/domain/models';
import { CreateUserDto } from '@app/infrastructure/dto';
import { hash } from 'bcrypt';
import {
    CreateUserResponse,
    GetListUsersResponse,
    GetUserResponse,
    UpdateUserResponse,
    GetPaginatedUsersResponse
} from '@app/infrastructure/responses';
import { IUserRepository } from '@app/domain/repositories';
import { MetaData } from '@app/infrastructure/paginate'; 

@Injectable()
export class UserRepository implements IUserRepository {
    private static readonly BCRYPT_ROUNDS = 10;
    private static readonly USER_FIELDS = ['email', 'password', 'phone'] as const;
    
    constructor(@InjectModel(UserModel) private userModel: typeof UserModel) {}

    private pickAllowedFromCreate(dto: CreateUserDto): { email: string; password: string } {
        const { email, password } = dto;
        return { email, password };
    }

    public async createUser(dto: CreateUserDto): Promise<UserModel> {
        const allowedFields = this.pickAllowedFromCreate(dto);
        const hashedPassword = await hash(allowedFields.password!, UserRepository.BCRYPT_ROUNDS);
        
        return this.userModel.create({
            email: allowedFields.email,
            password: hashedPassword,
        });
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

        return this.userModel
            .scope('withRoles')
            .findByPk(user.id) as Promise<UpdateUserResponse>;
    }

    //  Используем scope forAuth
    public async findUserForAuth(userId: number): Promise<UserModel | null> {
        return this.userModel.scope('forAuth').findByPk(userId);
    }

    // Используем scope withRoles
    public async findUser(id: number): Promise<GetUserResponse> {
        return this.userModel
            .scope('withRoles')
            .findByPk(id) as Promise<GetUserResponse>;
    }

    // Используется в модуле Rating и Order
    public async findUserByPkId(userId: number): Promise<UserModel> {
        return this.userModel.findByPk(userId, {
            attributes: ['id', 'email'],
        }) as Promise<UserModel>;
    }

    // Используем scope withRoles
    public async findRegisteredUser(
        userId: number,
    ): Promise<CreateUserResponse> {
        return this.userModel
            .scope('withRoles')
            .findByPk(userId) as Promise<UserModel>;
    }

    //  Используем scope forAuth
    public async findAuthenticatedUser(userId: number): Promise<UserModel> {
        const user = await this.findUserForAuth(userId);
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }
        return user;
    }

    public async findUserByEmail(email: string): Promise<UserModel> {
        return this.userModel.findOne({
            where: { email },
            attributes: ['id', 'email', 'password'], // Включаем пароль для аутентификации
        }) as Promise<UserModel>;
    }

    // Новый метод для работы с refresh токенами
    public async findUserWithTokens(userId: number): Promise<UserModel> {
        const user = await this.userModel.scope('withTokens').findByPk(userId);
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }
        return user;
    }

    // Новый метод для загрузки пользователя с заказами
    public async findUserWithOrders(userId: number): Promise<UserModel> {
        const user = await this.userModel.scope('withOrders').findByPk(userId);
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }
        return user;
    }

    // Новый метод для загрузки пользователя с продуктами
    public async findUserWithProducts(userId: number): Promise<UserModel> {
        const user = await this.userModel
            .scope('withProducts')
            .findByPk(userId);
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }
        return user;
    }

    public async findListUsersPaginated(page: number, limit: number): Promise<GetPaginatedUsersResponse> {
        const offset = (page - 1) * limit;
        
        const result = await this.userModel.findAndCountAll({
            attributes: { exclude: ['password'] },
            limit,
            offset,
            order: [['created_at', 'DESC']], // Сортировка по дате создания
        });

        const totalCount = result.count;
        const lastPage = Math.ceil(totalCount / limit);
        const nextPage = page < lastPage ? page + 1 : 0;
        const previousPage = page > 1 ? page - 1 : 0;

        const meta: MetaData = {
            totalCount,
            lastPage,
            currentPage: page,
            nextPage,
            previousPage,
            limit,
        };

        return {
            data: result.rows as GetListUsersResponse[],
            meta,
        };
    }

    public async removeUser(id: number): Promise<number> {
        return this.userModel.destroy({ where: { id } });
    }
}
