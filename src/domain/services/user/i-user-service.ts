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
import { UserModel, UserAddressModel } from '@app/domain/models';
import { CreateUserAddressDto } from '@app/infrastructure/dto/user-address/create-user-address.dto';
import { UpdateUserAddressDto } from '@app/infrastructure/dto/user-address/update-user-address.dto';
import { UpdateUserConsentsDto } from '@app/infrastructure/dto/user/update-user-consents.dto';
import { BulkUpdateConsentsDto } from '@app/infrastructure/dto/user/bulk-update-consents.dto';

export interface IUserService {
    createUser(dto: CreateUserDto): Promise<CreateUserResponse>;

    findAuthenticatedUser(userId: number): Promise<UserModel>;

    getUser(id: number): Promise<GetUserResponse>;

    checkUserAuth(id: number): Promise<CheckResponse>;

    findUserByEmail(email: string): Promise<UserModel>;

    getListUsers(page?: number, limit?: number): Promise<GetPaginatedUsersResponse>;

    updateUser(id: number, dto: UpdateUserDto): Promise<UpdateUserResponse>;

    removeUser(id: number): Promise<RemoveUserResponse>;

    addRole(dto: AddRoleDto): Promise<AddRoleResponse>;

    removeUserRole(dto: RemoveRoleDto): Promise<RemoveUserRoleResponse>;

    updatePhone(userId: number, phone: string): Promise<UserModel>;

    // User Address Methods
    createUserAddress(userId: number, dto: CreateUserAddressDto): Promise<UserAddressModel>;
    getUserAddresses(userId: number): Promise<UserAddressModel[]>;
    getUserAddress(userId: number, addressId: number): Promise<UserAddressModel>;
    updateUserAddress(userId: number, addressId: number, dto: UpdateUserAddressDto): Promise<UserAddressModel>;
    deleteUserAddress(userId: number, addressId: number): Promise<void>;
    setDefaultAddress(userId: number, addressId: number): Promise<UserAddressModel>;

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
    updateUserConsents(userId: number, dto: UpdateUserConsentsDto): Promise<UserModel>;
    bulkUpdateConsents(dto: BulkUpdateConsentsDto): Promise<{ success: number; failed: number }>;
    getConsentStats(): Promise<{
        newsletterSubscribers: number;
        marketingConsent: number;
        cookieConsent: number;
        termsAccepted: number;
        privacyAccepted: number;
    }>;
}
