import { CreateUserDto } from '../../../infrastructure/dto/user/create-user.dto';
import { CreateUserResponse } from '../../../infrastructure/responses/user/create-user.response';
import { UserModel } from '@app/domain/models';
import { GetUserResponse } from '../../../infrastructure/responses/user/get-user-response';
import { CheckResponse } from '../../../infrastructure/responses/auth/check-response';
import { GetListUsersResponse } from '../../../infrastructure/responses/user/get-list-users.response';
import { UpdateUserResponse } from '../../../infrastructure/responses/user/update-user-response';
import { RemoveUserResponse } from '../../../infrastructure/responses/user/remove-user.response';
import { AddRoleDto } from '../../../infrastructure/dto/user/add-role.dto';
import { AddRoleResponse } from '../../../infrastructure/responses/user/add-role.response';
import { RemoveRoleDto } from '../../../infrastructure/dto/user/remove-role.dto';
import { RemoveUserRoleResponse } from '../../../infrastructure/responses/user/remove-user-role-response';

export interface IUserService {
    createUser(dto: CreateUserDto): Promise<CreateUserResponse>;

    findAuthenticatedUser(userId: number): Promise<UserModel>;

    getUser(id: number): Promise<GetUserResponse>;

    checkUserAuth(id: number): Promise<CheckResponse>;

    findUserByEmail(email: string): Promise<UserModel>;

    getListUsers(): Promise<GetListUsersResponse[]>;

    updateUser(id: number, dto: CreateUserDto): Promise<UpdateUserResponse>;

    removeUser(id: number): Promise<RemoveUserResponse>;

    addRole(dto: AddRoleDto): Promise<AddRoleResponse>;

    removeUserRole(dto: RemoveRoleDto): Promise<RemoveUserRoleResponse>;
}
