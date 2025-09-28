import {
    CreateUserDto,
    AddRoleDto,
    RemoveRoleDto,
} from '@app/infrastructure/dto';
import {
    CreateUserResponse,
    GetListUsersResponse,
    GetUserResponse,
    UpdateUserResponse,
    RemoveUserResponse,
    AddRoleResponse,
    RemoveUserRoleResponse,
    GetPaginatedUsersResponse,
} from '@app/infrastructure/responses';

export interface IUserController {
    createUser(dto: CreateUserDto): Promise<CreateUserResponse>;

    getListUsers(): Promise<GetPaginatedUsersResponse>;

    getUser(id: number): Promise<GetUserResponse>;

    updateUser(id: number, dto: CreateUserDto): Promise<UpdateUserResponse>;

    removeUser(id: number): Promise<RemoveUserResponse>;

    addRole(dto: AddRoleDto): Promise<AddRoleResponse>;

    removeRole(dto: RemoveRoleDto): Promise<RemoveUserRoleResponse>;
}
