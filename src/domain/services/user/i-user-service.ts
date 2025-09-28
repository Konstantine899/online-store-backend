import {
    CreateUserDto,
    AddRoleDto,
    RemoveRoleDto,
} from '@app/infrastructure/dto';
import {
    CreateUserResponse,
    GetUserResponse,
    CheckResponse,
    GetListUsersResponse,
    UpdateUserResponse,
    RemoveUserResponse,
    AddRoleResponse,
    RemoveUserRoleResponse,
    GetPaginatedUsersResponse,
} from '@app/infrastructure/responses';
import { UserModel } from '@app/domain/models';

export interface IUserService {
    createUser(dto: CreateUserDto): Promise<CreateUserResponse>;

    findAuthenticatedUser(userId: number): Promise<UserModel>;

    getUser(id: number): Promise<GetUserResponse>;

    checkUserAuth(id: number): Promise<CheckResponse>;

    findUserByEmail(email: string): Promise<UserModel>;

    getListUsers(page?: number, limit?: number): Promise<GetPaginatedUsersResponse>;

    updateUser(id: number, dto: CreateUserDto): Promise<UpdateUserResponse>;

    removeUser(id: number): Promise<RemoveUserResponse>;

    addRole(dto: AddRoleDto): Promise<AddRoleResponse>;

    removeUserRole(dto: RemoveRoleDto): Promise<RemoveUserRoleResponse>;
}
