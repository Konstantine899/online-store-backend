import {
    CreateUserDto,
    AddRoleDto,
    RemoveRoleDto,
    UpdateUserDto,
} from '@app/infrastructure/dto';
import {
    CreateUserResponse,
    GetUserResponse,
    CheckResponse,
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

    getListUsers(
        page?: number,
        limit?: number,
    ): Promise<GetPaginatedUsersResponse>;

    updateUser(id: number, dto: UpdateUserDto): Promise<UpdateUserResponse>;

    removeUser(id: number): Promise<RemoveUserResponse>;

    addRole(dto: AddRoleDto): Promise<AddRoleResponse>;

    removeUserRole(dto: RemoveRoleDto): Promise<RemoveUserRoleResponse>;

    updatePhone(userId: number, phone: string): Promise<UserModel>;

    // User Statistics Methods
    getUserStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        blockedUsers: number;
        newsletterSubscribers: number;
    }>;
}
