import { CreateUserDto } from '@app/infrastructure/dto';
import { UserModel } from '@app/domain/models';
import { UpdateUserResponse } from '../../../infrastructure/responses/user/update-user-response';
import { GetUserResponse } from '../../../infrastructure/responses/user/get-user-response';
import { CreateUserResponse } from '../../../infrastructure/responses/user/create-user.response';
import { GetListUsersResponse } from '../../../infrastructure/responses/user/get-list-users.response';

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

    findListUsers(): Promise<GetListUsersResponse[]>;

    removeUser(id: number): Promise<number>;
}
