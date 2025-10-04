import { CreateUserDto } from '@app/infrastructure/dto';
import { UserModel } from '@app/domain/models';
import {
    UpdateUserResponse,
    GetUserResponse,
    CreateUserResponse,
    GetPaginatedUsersResponse,
} from '@app/infrastructure/responses';
import { UpdateUserFlagsDto } from '@app/infrastructure/dto/user/update-user-flags.dto';
import { UpdateUserPreferencesDto } from '@app/infrastructure/dto/user/update-user-preferences.dto';
import { CreateUserAddressDto } from '@app/infrastructure/dto/user-address/create-user-address.dto';
import { UpdateUserAddressDto } from '@app/infrastructure/dto/user-address/update-user-address.dto';
import { UpdateUserConsentsDto } from '@app/infrastructure/dto/user/update-user-consents.dto';
import { BulkConsentUpdate } from '@app/infrastructure/dto/user/bulk-update-consents.dto';
import { UserAddressModel } from '@app/domain/models';

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

    updateFlags(userId: number, dto: UpdateUserFlagsDto): Promise<UserModel | null>;
    updatePreferences(userId: number, dto: UpdateUserPreferencesDto): Promise<UserModel | null>;
    verifyEmail(userId: number): Promise<UserModel | null>;
    verifyPhone(userId: number): Promise<UserModel | null>;

    // User Address Methods
    createUserAddress(userId: number, dto: CreateUserAddressDto): Promise<UserAddressModel>;
    getUserAddresses(userId: number): Promise<UserAddressModel[]>;
    getUserAddress(userId: number, addressId: number): Promise<UserAddressModel | null>;
    updateUserAddress(userId: number, addressId: number, dto: UpdateUserAddressDto): Promise<UserAddressModel | null>;
    deleteUserAddress(userId: number, addressId: number): Promise<boolean>;
    setDefaultAddress(userId: number, addressId: number): Promise<UserAddressModel | null>;

    // User Statistics Methods
    getUserStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        blockedUsers: number;
        vipUsers: number;
        newsletterSubscribers: number;
        premiumUsers: number;
        employees: number;
        affiliates: number;
        wholesaleUsers: number;
        highValueUsers: number;
    }>;

    // ===== User Consents Methods =====
    updateUserConsents(userId: number, dto: UpdateUserConsentsDto): Promise<UserModel | null>;
    bulkUpdateConsents(updates: BulkConsentUpdate[]): Promise<{ success: number; failed: number }>;
    getConsentStats(): Promise<{
        newsletterSubscribers: number;
        marketingConsent: number;
        cookieConsent: number;
        termsAccepted: number;
        privacyAccepted: number;
    }>;
}
