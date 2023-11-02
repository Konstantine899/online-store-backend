import { CreateUserDto } from '../../infrastructure/dto/user/create-user.dto';
import { CreateUserResponse } from '../../infrastructure/responses/user/create-user.response';
import { GetListUsersResponse } from '../../infrastructure/responses/user/get-list-users.response';
import { GetUserResponse } from '../../infrastructure/responses/user/get-user-response';
import { UpdateUserResponse } from '../../infrastructure/responses/user/update-user-response';
import { RemoveUserResponse } from '../../infrastructure/responses/user/remove-user.response';
import { AddRoleDto } from '../../infrastructure/dto/user/add-role.dto';
import { AddRoleResponse } from '../../infrastructure/responses/user/add-role.response';
import { RemoveRoleDto } from '../../infrastructure/dto/user/remove-role.dto';
import { RemoveUserRoleResponse } from '../../infrastructure/responses/user/remove-user-role-response';

export interface IUserController {
    createUser(dto: CreateUserDto): Promise<CreateUserResponse>;

    getListUsers(): Promise<GetListUsersResponse[]>;

    getUser(id: number): Promise<GetUserResponse>;

    updateUser(id: number, dto: CreateUserDto): Promise<UpdateUserResponse>;

    removeUser(id: number): Promise<RemoveUserResponse>;

    addRole(dto: AddRoleDto): Promise<AddRoleResponse>;

    removeRole(dto: RemoveRoleDto): Promise<RemoveUserRoleResponse>;
}
