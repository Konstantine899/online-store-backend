import { InjectModel } from '@nestjs/sequelize';
import {
    BadRequestException,
    ConflictException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { UserModel } from '@app/domain/models';
import {
    CreateUserDto,
    AddRoleDto,
    RemoveRoleDto,
    UpdateUserDto,
    UpdateUserProfileDto,
} from '@app/infrastructure/dto';
import { RoleService } from '../role/role.service';
import { UserRepository } from '@app/infrastructure/repositories';
import {
    CreateUserResponse,
    GetUserResponse,
    UpdateUserResponse,
    RemoveUserResponse,
    AddRoleResponse,
    RemoveUserRoleResponse,
    CheckResponse,
    GetPaginatedUsersResponse,
} from '@app/infrastructure/responses';
import { IUserService } from '@app/domain/services';
import { compare, hash } from 'bcrypt';
import { UpdateUserFlagsDto } from '@app/infrastructure/dto/user/update-user-flags.dto';
import { UpdateUserPreferencesDto } from '@app/infrastructure/dto/user/update-user-preferences.dto';
import { CreateUserAddressDto } from '@app/infrastructure/dto/user-address/create-user-address.dto';
import { UpdateUserAddressDto } from '@app/infrastructure/dto/user-address/update-user-address.dto';
import { UpdateUserConsentsDto } from '@app/infrastructure/dto/user/update-user-consents.dto';
import { BulkUpdateConsentsDto } from '@app/infrastructure/dto/user/bulk-update-consents.dto';
import { UserAddressModel } from '@app/domain/models';
import { LoginHistoryService } from '../login-history/login-history.service';

@Injectable()
export class UserService implements IUserService {
    private static readonly ADMIN_EMAILS = ['kostay375298918971@gmail.com'] as const;
    private static readonly DEFAULT_ROLE = 'USER' as const;
    
    constructor(
        private readonly userRepository: UserRepository,
        private roleService: RoleService,
        @InjectModel(UserModel) private readonly userModel: typeof UserModel,
        private readonly loginHistoryService: LoginHistoryService,
    ) {}

    public async createUser(dto: CreateUserDto): Promise<CreateUserResponse> {
        const findEmail = await this.userRepository.findUserByEmail(dto.email);
        if (findEmail) {
            throw new BadRequestException(
                `Пользователь с таким email: ${dto.email} уже существует`,
            );
        }
        try {
            const role = await this.determineUserRole(dto.email) as UserModel['roles'][0];
            const user = await this.userRepository.createUser(dto);
            await this.linkUserRole(user.id, role.id);
            user.roles = [role];
            return this.userRepository.findRegisteredUser(user.id);
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'SequelizeUniqueConstraintError') {
                this.conflictException(`Пользователь с таким email: ${dto.email} уже существует`);
            }
            throw error;
        }
    }

    public async findAuthenticatedUser(userId: number): Promise<UserModel> {
        return this.userRepository.findAuthenticatedUser(userId);
    }

    public async getUser(id: number): Promise<GetUserResponse> {
        const foundUser = await this.userRepository.findUser(id);
        if (!foundUser) {
            this.notFound('Пользователь не найден В БД');
        }
        return foundUser;
    }

    public async checkUserAuth(id: number): Promise<CheckResponse> {
        const user = await this.userRepository.findUser(id);
        if (!user) {
            this.notFound('Профиль пользователя не найден в БД');
        }
        return user;
    }

    public async findUserByEmail(email: string): Promise<UserModel> {
        return this.userRepository.findUserByEmail(email);
    }

    public async getListUsers(page: number = 1, limit: number = 5): Promise<GetPaginatedUsersResponse> {
        const listUsers = await this.userRepository.findListUsersPaginated(page, limit);
        if (!listUsers.data.length) {
            this.notFound('Список пользователей пуст');
        }
        return listUsers;
    }

    public async updateUser(
        id: number,
        dto: UpdateUserDto,
    ): Promise<UpdateUserResponse> {
        const foundUser = await this.userRepository.findUser(id);
        if (!foundUser) {
            this.notFound(`Пользователь с id: ${id} не найден в БД`);
        }
        if (dto.email) {
            const foundEmail = await this.findUserByEmail(dto.email);
            if (foundEmail) {
                this.conflictException(
                    `Пользователь с таким email: ${dto.email} уже существует`,
                );
            }
        }
        let updatedUser: UpdateUserResponse;
        try {
            updatedUser = await this.userRepository.updateUser(
                foundUser,
                dto,
            );
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'SequelizeUniqueConstraintError') {
                this.conflictException(`Пользователь с таким email: ${dto.email} уже существует`);
            }
            throw error;
        }
        const role = await this.roleService.getRole('USER');
        /* #set Потому что обновляется весь объект. Ищу роль пользователя и при обновлении перезаписываю поле*/
        await updatedUser.$set('roles', [role.id]);
        updatedUser.roles = [role];
        return updatedUser;
    }

    public async removeUser(id: number): Promise<RemoveUserResponse> {
        const user = await this.userRepository.findUser(id);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        const roleId = await this.getRolesUser(user);
        await user.$remove('role', roleId!);
        await this.userRepository.removeUser(user.id);
        return {
            status: HttpStatus.OK,
            message: 'success',
        };
    }

    public async addRole(dto: AddRoleDto): Promise<AddRoleResponse> {
        const user = await this.userRepository.findUser(dto.userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        const foundRole = await this.roleService.getRole(dto.role);
        if (!foundRole) {
            this.notFound('Роль не найдена в БД');
        }
        const alreadyHas = await this.isUserRoleExists(user.id, foundRole.id);
        if (alreadyHas) {
            this.conflictException(`Данному пользователю уже присвоена роль ${foundRole.role}`);
        }
        await this.linkUserRole(user.id, foundRole.id);
        return this.userRepository.findUser(user.id);
    }

    public async removeUserRole(
        dto: RemoveRoleDto,
    ): Promise<RemoveUserRoleResponse> {
        const user = await this.userRepository.findUser(dto.userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        const role = await this.roleService.getRole(dto.role);
        if (!role) {
            this.notFound('Роль не найдена в БД');
        }
        await this.unlinkUserRole(user.id, role.id);
        return {
            status: HttpStatus.OK,
            message: 'success',
        };
    }
    async updatePhone(userId: number, phone: string): Promise<UserModel> {
        try {
            const user = await this.userRepository.updatePhone(userId, phone);
            if (!user) {
                throw new NotFoundException('Пользователь не найден');
            }
            return user;
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.name === 'SequelizeValidationError') {
                    throw new BadRequestException(['Неверный формат номера телефона']);
                }
                if (error.name === 'SequelizeUniqueConstraintError') {
                    this.conflictException('Такой номер телефона уже используется');
                }
            }
            throw error;
        }
    }

    async updateProfile(
        userId: number,
        dto: UpdateUserProfileDto,
    ): Promise<UpdateUserResponse> {
        const user = await this.userRepository.findUser(userId);
        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        try {
            return await this.userRepository.updateUserProfile(user, dto);
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'SequelizeValidationError') {
                throw new BadRequestException(['Некорректные данные профиля']);
            }
            throw error;
        }
    }

    public async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findUserByPkId(userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        const userWithPassword = await this.userRepository.findUserByEmail(user.email);
        const isMatch = await compare(oldPassword, userWithPassword.password);
        if (!isMatch) {
            this.badRequest('Текущий пароль указан неверно');
        }
        const hashed = await hash(newPassword, 10);
        await userWithPassword.update({ password: hashed });
    }

    public async updateFlags(userId: number, dto: UpdateUserFlagsDto): Promise<UserModel> {
        const user = await this.userRepository.updateFlags(userId, dto);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        return user as UserModel;
    }

    public async updatePreferences(userId: number, dto: UpdateUserPreferencesDto): Promise<UserModel> {
        const user = await this.userRepository.updatePreferences(userId, dto);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        return user as UserModel;
    }

    public async verifyEmailFlag(userId: number): Promise<UserModel> {
        const user = await this.userRepository.verifyEmail(userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        return user as UserModel;
    }

    public async verifyPhoneFlag(userId: number): Promise<UserModel> {
        const user = await this.userRepository.verifyPhone(userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        return user as UserModel;
    }

    // Admin actions
    public async blockUser(userId: number): Promise<UserModel> {
        const user = await this.userRepository.blockUser(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async unblockUser(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unblockUser(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async suspendUser(userId: number): Promise<UserModel> {
        const user = await this.userRepository.suspendUser(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async unsuspendUser(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unsuspendUser(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async softDeleteUser(userId: number): Promise<UserModel> {
        const user = await this.userRepository.softDeleteUser(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async restoreUser(userId: number): Promise<UserModel> {
        const user = await this.userRepository.restoreUser(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async upgradePremium(userId: number): Promise<UserModel> {
        const user = await this.userRepository.upgradePremium(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async downgradePremium(userId: number): Promise<UserModel> {
        const user = await this.userRepository.downgradePremium(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async setEmployee(userId: number): Promise<UserModel> {
        const user = await this.userRepository.setEmployee(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async unsetEmployee(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unsetEmployee(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async setVip(userId: number): Promise<UserModel> {
        const user = await this.userRepository.setVip(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async unsetVip(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unsetVip(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async setHighValue(userId: number): Promise<UserModel> {
        const user = await this.userRepository.setHighValue(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async unsetHighValue(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unsetHighValue(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async setWholesale(userId: number): Promise<UserModel> {
        const user = await this.userRepository.setWholesale(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async unsetWholesale(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unsetWholesale(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async setAffiliate(userId: number): Promise<UserModel> {
        const user = await this.userRepository.setAffiliate(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    public async unsetAffiliate(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unsetAffiliate(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        return user as UserModel;
    }

    // ===== Self-service verification =====
    public async requestVerificationCode(userId: number, channel: 'email' | 'phone'): Promise<void> {
        await this.userRepository.requestVerificationCode(userId, channel);
    }

    public async confirmVerificationCode(userId: number, channel: 'email' | 'phone', code: string): Promise<void> {
        const ok = await this.userRepository.confirmVerificationCode(userId, channel, code);
        if (!ok) {
            this.badRequest('Неверный или просроченный код подтверждения');
        }
    }

//====================Другие методы===========================//
    protected async getRolesUser(user: UserModel): Promise<number | null> {
        const roles = user.roles.map((i) => i.role).join(',');
        const foundRole = await this.roleService.getRole(roles);
        if (!foundRole) {
            this.notFound('Роли пользователя не найдены в БД');
        }
        return foundRole.id;
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }

    private badRequest(message: string): void {
        throw new BadRequestException({
            status: HttpStatus.BAD_REQUEST,
            message,
        });
    }

    private conflictException(message: string): void {
        throw new ConflictException({
            status: HttpStatus.CONFLICT,
            message,
        });
    }

    private async determineUserRole(email: string): Promise<unknown> {
        if (UserService.ADMIN_EMAILS.includes(email as typeof UserService.ADMIN_EMAILS[number])) {
            let role = await this.roleService.getRole('ADMIN');
            if (!role) {
                role = await this.roleService.createRole({
                    role: 'ADMIN',
                    description: 'Администратор',
                });
            }
            return role;
        }
        
        let role = await this.roleService.getRole(UserService.DEFAULT_ROLE);
        if (!role) {
            role = await this.roleService.createRole({
                role: UserService.DEFAULT_ROLE,
                description: 'Пользователь',
            });
        }
        return role;
    }

    private async linkUserRole(userId: number, roleId: number): Promise<void> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) return;
        const now = new Date();
        await sequelize.query(
            'INSERT INTO `user_role` (`user_id`,`role_id`,`created_at`,`updated_at`) VALUES (?,?,?,?)',
            { replacements: [userId, roleId, now, now] },
        );
    }

    private async unlinkUserRole(userId: number, roleId: number): Promise<void> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) return;
        await sequelize.query(
            'DELETE FROM `user_role` WHERE `user_id` = ? AND `role_id` = ? LIMIT 1',
            { replacements: [userId, roleId] },
        );
    }

    private async isUserRoleExists(userId: number, roleId: number): Promise<boolean> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) return false;
        const [rows] = await sequelize.query(
            'SELECT 1 FROM `user_role` WHERE `user_id` = ? AND `role_id` = ? LIMIT 1',
            { replacements: [userId, roleId] },
        );
        // rows can be RowDataPacket[] in mysql2
        return Array.isArray(rows) && rows.length > 0;
    }

    /**
     * Обновляет время последнего входа пользователя и логирует успешный вход
     */
    async updateLastLoginAt(userId: number, ipAddress?: string, userAgent?: string): Promise<void> {
        try {
            // Обновляем last_login_at в таблице user
            await this.userRepository.updateLastLoginAt(userId);
            
            // Логируем успешный вход
            await this.loginHistoryService.logSuccessfulLogin(userId, ipAddress, userAgent);
        } catch (error) {
            // Не бросаем ошибку, чтобы не сломать процесс входа
            // Просто логируем проблему
            console.error(`Failed to update last login for user ${userId}:`, error);
        }
    }

    /**
     * Логирует неудачную попытку входа
     */
    async logFailedLogin(userId: number, failureReason: string, ipAddress?: string, userAgent?: string): Promise<void> {
        try {
            await this.loginHistoryService.logFailedLogin(userId, failureReason, ipAddress, userAgent);
        } catch (error) {
            // Не бросаем ошибку, чтобы не сломать процесс аутентификации
            console.error(`Failed to log failed login for user ${userId}:`, error);
        }
    }

    // ===== User Address Methods =====
    public async createUserAddress(userId: number, dto: CreateUserAddressDto): Promise<UserAddressModel> {
        return this.userRepository.createUserAddress(userId, dto);
    }

    public async getUserAddresses(userId: number): Promise<UserAddressModel[]> {
        return this.userRepository.getUserAddresses(userId);
    }

    public async getUserAddress(userId: number, addressId: number): Promise<UserAddressModel> {
        const address = await this.userRepository.getUserAddress(userId, addressId);
        if (!address) {
            this.notFound('Адрес не найден');
        }
        return address as UserAddressModel;
    }

    public async updateUserAddress(userId: number, addressId: number, dto: UpdateUserAddressDto): Promise<UserAddressModel> {
        const address = await this.userRepository.updateUserAddress(userId, addressId, dto);
        if (!address) {
            this.notFound('Адрес не найден');
        }
        return address as UserAddressModel;
    }

    public async deleteUserAddress(userId: number, addressId: number): Promise<void> {
        const deleted = await this.userRepository.deleteUserAddress(userId, addressId);
        if (!deleted) {
            this.notFound('Адрес не найден');
        }
    }

    public async setDefaultAddress(userId: number, addressId: number): Promise<UserAddressModel> {
        const address = await this.userRepository.setDefaultAddress(userId, addressId);
        if (!address) {
            this.notFound('Адрес не найден');
        }
        return address as UserAddressModel;
    }

    // ===== User Statistics Methods =====
    public async getUserStats(): Promise<{
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
    }> {
        return this.userRepository.getUserStats();
    }

    // ===== User Consents Methods =====
    public async updateUserConsents(userId: number, dto: UpdateUserConsentsDto): Promise<UserModel> {
        const user = await this.userRepository.updateUserConsents(userId, dto);
        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }
        return user as UserModel;
    }

    public async bulkUpdateConsents(dto: BulkUpdateConsentsDto): Promise<{ success: number; failed: number }> {
        return this.userRepository.bulkUpdateConsents(dto.updates);
    }

    public async getConsentStats(): Promise<{
        newsletterSubscribers: number;
        marketingConsent: number;
        cookieConsent: number;
        termsAccepted: number;
        privacyAccepted: number;
    }> {
        return this.userRepository.getConsentStats();
    }
}
