import { UserModel } from '@app/domain/models';
import { CreateUserDto } from '@app/infrastructure/dto';
import { UpdateUserFlagsDto } from '@app/infrastructure/dto/user/update-user-flags.dto';
import { UpdateUserPreferencesDto } from '@app/infrastructure/dto/user/update-user-preferences.dto';
import {
    CreateUserResponse,
    GetPaginatedUsersResponse,
    GetUserResponse,
    UpdateUserResponse,
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

    updateFlags(
        userId: number,
        dto: UpdateUserFlagsDto,
    ): Promise<UserModel | null>;
    updatePreferences(
        userId: number,
        dto: UpdateUserPreferencesDto,
    ): Promise<UserModel | null>;
    verifyEmail(userId: number): Promise<UserModel | null>;
    verifyPhone(userId: number): Promise<UserModel | null>;

    // User Statistics Methods
    getUserStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        blockedUsers: number;
        newsletterSubscribers: number;
    }>;
}
