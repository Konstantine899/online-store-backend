import { CreateUserDto } from '@app/infrastructure/dto';
import { UserModel } from '@app/domain/models';
import {
    UpdateUserResponse,
    GetUserResponse,
    CreateUserResponse,
    GetPaginatedUsersResponse,
} from '@app/infrastructure/responses';

export interface IUserRepository {
    createUser(dto: CreateUserDto): Promise<UserModel>;

    updateUser(
        user: UserModel,
        dto: CreateUserDto,
    ): Promise<UpdateUserResponse>;

    findUser(id: number): Promise<GetUserResponse>;

    findUserByPkId(userId: number): Promise<UserModel>;

    findRegisteredUser(userId: number): Promise<CreateUserResponse>;

    findAuthenticatedUser(userId: number): Promise<UserModel>;

    findUserByEmail(email: string): Promise<UserModel>;

    findListUsersPaginated(
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse>;

    removeUser(id: number): Promise<number>;

    updatePhone(userId: number, phone: string): Promise<UserModel>;
}
