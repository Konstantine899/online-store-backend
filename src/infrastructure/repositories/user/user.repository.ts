import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from '@app/domain/models';
import {
    CreateUserDto,
    UpdateUserDto,
    UpdateUserProfileDto,
} from '@app/infrastructure/dto';
import { hash } from 'bcrypt';
import {
    CreateUserResponse,
    GetListUsersResponse,
    GetUserResponse,
    UpdateUserResponse,
    GetPaginatedUsersResponse
} from '@app/infrastructure/responses';
import { IUserRepository } from '@app/domain/repositories';
import { MetaData } from '@app/infrastructure/paginate'; 
import { UpdateUserFlagsDto } from '@app/infrastructure/dto/user/update-user-flags.dto';
import { UpdateUserPreferencesDto } from '@app/infrastructure/dto/user/update-user-preferences.dto';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class UserRepository implements IUserRepository {
    private static readonly BCRYPT_ROUNDS = 10;
    private static readonly USER_FIELDS = ['email', 'password', 'phone'] as const;
    
    constructor(
        @InjectModel(UserModel) private userModel: typeof UserModel,
    ) {}

    private pickAllowedFromCreate(dto: CreateUserDto): {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
    } {
        const { email, password, firstName, lastName } = dto;
        return { email, password, firstName, lastName };
    }

    public async createUser(dto: CreateUserDto): Promise<UserModel> {
        const allowedFields = this.pickAllowedFromCreate(dto);
        const hashedPassword = await hash(
            allowedFields.password!,
            UserRepository.BCRYPT_ROUNDS,
        );

        return this.userModel.create({
            email: allowedFields.email,
            password: hashedPassword,
            firstName: allowedFields.firstName,
            lastName: allowedFields.lastName,
        });
    }

    public async updateUser(
        user: UserModel,
        dto: UpdateUserDto,
    ): Promise<UpdateUserResponse> {
        const updates: Partial<UserModel> = {} as Partial<UserModel>;
        if (dto.email !== undefined)
            updates.email = dto.email as unknown as string;
        if (dto.password !== undefined)
            updates.password = await hash(
                dto.password,
                UserRepository.BCRYPT_ROUNDS,
            );
        if (dto.firstName !== undefined)
            updates.firstName = dto.firstName as unknown as string;
        if (dto.lastName !== undefined)
            updates.lastName = dto.lastName as unknown as string;
        await user.update(updates);

        return this.userModel
            .scope('withRoles')
            .findByPk(user.id) as Promise<UpdateUserResponse>;
    }

    public async updateUserProfile(
        user: UserModel,
        dto: UpdateUserProfileDto,
    ): Promise<UpdateUserResponse> {
        const updates: Partial<UserModel> = {} as Partial<UserModel>;
        if (dto.firstName !== undefined)
            updates.firstName = dto.firstName as unknown as string;
        if (dto.lastName !== undefined)
            updates.lastName = dto.lastName as unknown as string;
        await user.update(updates);

        return this.userModel
            .scope('withRoles')
            .findByPk(user.id) as Promise<UpdateUserResponse>;
    }

    //  Используем scope forAuth
    public async findUserForAuth(userId: number): Promise<UserModel | null> {
        return this.userModel.scope('forAuth').findByPk(userId);
    }

    // Используем scope withRoles
    public async findUser(id: number): Promise<GetUserResponse> {
        return this.userModel
            .scope('withRoles')
            .findByPk(id) as Promise<GetUserResponse>;
    }

    // Используется в модуле Rating и Order
    public async findUserByPkId(userId: number): Promise<UserModel> {
        return this.userModel.findByPk(userId, {
            attributes: ['id', 'email'],
        }) as Promise<UserModel>;
    }

    // Используем scope withRoles
    public async findRegisteredUser(
        userId: number,
    ): Promise<CreateUserResponse> {
        return this.userModel
            .scope('withRoles')
            .findByPk(userId) as Promise<UserModel>;
    }

    //  Используем scope forAuth
    public async findAuthenticatedUser(userId: number): Promise<UserModel> {
        const user = await this.findUserForAuth(userId);
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }
        return user;
    }

    public async findUserByEmail(email: string): Promise<UserModel> {
        return this.userModel.findOne({
            where: { email },
            attributes: ['id', 'email', 'password'], // Включаем пароль для аутентификации
        }) as Promise<UserModel>;
    }

    // Новый метод для работы с refresh токенами
    public async findUserWithTokens(userId: number): Promise<UserModel> {
        const user = await this.userModel.scope('withTokens').findByPk(userId);
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }
        return user;
    }

    // Новый метод для загрузки пользователя с заказами
    public async findUserWithOrders(userId: number): Promise<UserModel> {
        const user = await this.userModel.scope('withOrders').findByPk(userId);
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }
        return user;
    }

    // Новый метод для загрузки пользователя с продуктами
    public async findUserWithProducts(userId: number): Promise<UserModel> {
        const user = await this.userModel
            .scope('withProducts')
            .findByPk(userId);
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }
        return user;
    }

    public async findListUsersPaginated(page: number, limit: number): Promise<GetPaginatedUsersResponse> {
        const offset = (page - 1) * limit;
        
        const result = await this.userModel.findAndCountAll({
            attributes: { exclude: ['password'] },
            limit,
            offset,
            order: [['created_at', 'DESC']], // Сортировка по дате создания
        });

        const totalCount = result.count;
        const lastPage = Math.ceil(totalCount / limit);
        const nextPage = page < lastPage ? page + 1 : 0;
        const previousPage = page > 1 ? page - 1 : 0;

        const meta: MetaData = {
            totalCount,
            lastPage,
            currentPage: page,
            nextPage,
            previousPage,
            limit,
        };

        return {
            data: result.rows as GetListUsersResponse[],
            meta,
        };
    }

    public async removeUser(id: number): Promise<number> {
        return this.userModel.destroy({ where: { id } });
    }

    public async updatePhone(userId: number, phone: string): Promise<UserModel> {
        await this.userModel.update(
            { phone },
            { where: { id: userId }, fields: ['phone'] },
        );
        return this.userModel.findByPk(userId, {
            attributes: ['id', 'email', 'phone'],
        }) as Promise<UserModel>;
    }

    public async updateFlags(userId: number, dto: UpdateUserFlagsDto): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({
            isActive: dto.isActive ?? (user.get('isActive') as boolean),
            isNewsletterSubscribed: dto.isNewsletterSubscribed ?? (user.get('isNewsletterSubscribed') as boolean),
            isMarketingConsent: dto.isMarketingConsent ?? (user.get('isMarketingConsent') as boolean),
            isCookieConsent: dto.isCookieConsent ?? (user.get('isCookieConsent') as boolean),
            isProfileCompleted: dto.isProfileCompleted ?? (user.get('isProfileCompleted') as boolean),
            isVipCustomer: dto.isVipCustomer ?? (user.get('isVipCustomer') as boolean),
            isBetaTester: dto.isBetaTester ?? (user.get('isBetaTester') as boolean),
            isBlocked: dto.isBlocked ?? (user.get('isBlocked') as boolean),
            isVerified: dto.isVerified ?? (user.get('isVerified') as boolean),
            isPremium: dto.isPremium ?? (user.get('isPremium') as boolean),
            isEmailVerified: dto.isEmailVerified ?? (user.get('isEmailVerified') as boolean),
            isPhoneVerified: dto.isPhoneVerified ?? (user.get('isPhoneVerified') as boolean),
            isTermsAccepted: dto.isTermsAccepted ?? (user.get('isTermsAccepted') as boolean),
            isPrivacyAccepted: dto.isPrivacyAccepted ?? (user.get('isPrivacyAccepted') as boolean),
            isAgeVerified: dto.isAgeVerified ?? (user.get('isAgeVerified') as boolean),
            isTwoFactorEnabled: dto.isTwoFactorEnabled ?? (user.get('isTwoFactorEnabled') as boolean),
        });
        return user;
    }

    public async updatePreferences(userId: number, dto: UpdateUserPreferencesDto): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({
            themePreference: dto.themePreference ?? (user.get('themePreference') as string),
            defaultLanguage: dto.defaultLanguage ?? (user.get('defaultLanguage') as string),
            notificationPreferences: dto.notificationPreferences ?? (user.get('notificationPreferences') as unknown),
            translations: dto.translations ?? (user.get('translations') as unknown),
        });
        return user;
    }

    public async verifyEmail(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isEmailVerified: true, emailVerifiedAt: new Date() });
        return user;
    }

    public async verifyPhone(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isPhoneVerified: true, phoneVerifiedAt: new Date() });
        return user;
    }

    // Admin actions
    public async blockUser(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isBlocked: true, isActive: false });
        return user;
    }

    public async unblockUser(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isBlocked: false, isActive: true });
        return user;
    }

    public async suspendUser(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isSuspended: true, isActive: false });
        return user;
    }

    public async unsuspendUser(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isSuspended: false, isActive: true });
        return user;
    }

    public async softDeleteUser(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isDeleted: true, isActive: false });
        return user;
    }

    public async restoreUser(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isDeleted: false, isActive: true });
        return user;
    }

    public async upgradePremium(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isPremium: true });
        return user;
    }

    public async downgradePremium(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isPremium: false });
        return user;
    }

    public async setEmployee(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isEmployee: true });
        return user;
    }

    public async unsetEmployee(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isEmployee: false });
        return user;
    }

    public async setVip(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isVipCustomer: true });
        return user;
    }

    public async unsetVip(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isVipCustomer: false });
        return user;
    }

    public async setHighValue(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isHighValue: true });
        return user;
    }

    public async unsetHighValue(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isHighValue: false });
        return user;
    }

    public async setWholesale(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isWholesale: true });
        return user;
    }

    public async unsetWholesale(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isWholesale: false });
        return user;
    }

    public async setAffiliate(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isAffiliate: true });
        return user;
    }

    public async unsetAffiliate(userId: number): Promise<UserModel | null> {
        const user = await this.userModel.findByPk(userId);
        if (!user) return null;
        await user.update({ isAffiliate: false });
        return user;
    }

    // ===== Verification codes =====
    private hashCode(code: string): string {
        return createHash('sha256').update(code).digest('hex');
    }

    public async requestVerificationCode(userId: number, channel: 'email' | 'phone'): Promise<void> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) return;
        const code = randomBytes(3).toString('hex'); // 6 hex chars
        const codeHash = this.hashCode(code);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10m
        await sequelize.query(
            'INSERT INTO `user_verification_code` (`user_id`,`channel`,`code_hash`,`expires_at`,`attempts`,`created_at`,`updated_at`) VALUES (?,?,?,?,0,?,?)',
            { replacements: [userId, channel, codeHash, expiresAt, new Date(), new Date()] },
        );
        // TODO: отправка по каналу (email/SMS) — интегрировать почту/SMS провайдер
        // Для интеграции можно вернуть plaintext код через отдельный путь (dev only)
    }

    public async confirmVerificationCode(userId: number, channel: 'email' | 'phone', code: string): Promise<boolean> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) return false;
        const [[row]] = await sequelize.query(
            'SELECT `id`,`code_hash`,`expires_at`,`attempts` FROM `user_verification_code` WHERE `user_id` = ? AND `channel` = ? ORDER BY `created_at` DESC LIMIT 1',
            { replacements: [userId, channel] },
        );
        // rows can be RowDataPacket[]
        if (!row) return false;
        const { id, code_hash: storedHash, expires_at: expiresAt, attempts } = row as { id: number; code_hash: string; expires_at: string | Date; attempts: number };
        const now = new Date();
        if (new Date(expiresAt) < now || attempts >= 5) {
            return false;
        }
        const ok = this.hashCode(code) === storedHash;
        await sequelize.query(
            'UPDATE `user_verification_code` SET `attempts` = `attempts` + 1, `updated_at` = ? WHERE `id` = ? LIMIT 1',
            { replacements: [now, id] },
        );
        if (!ok) return false;
        if (channel === 'email') {
            await sequelize.query(
                'UPDATE `user` SET `is_email_verified` = 1, `email_verified_at` = ?, `updated_at` = ? WHERE `id` = ? LIMIT 1',
                { replacements: [now, now, userId] },
            );
        } else {
            await sequelize.query(
                'UPDATE `user` SET `is_phone_verified` = 1, `phone_verified_at` = ?, `updated_at` = ? WHERE `id` = ? LIMIT 1',
                { replacements: [now, now, userId] },
            );
        }
        return true;
    }

    async updateLastLoginAt(userId: number): Promise<void> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) {
            throw new Error('Sequelize instance not available');
        }

        const now = new Date();
        await sequelize.query(
            'UPDATE `user` SET `last_login_at` = ?, `updated_at` = ? WHERE `id` = ? LIMIT 1',
            { replacements: [now, now, userId] },
        );
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
        const sequelize = this.userModel.sequelize;
        if (!sequelize) {
            throw new Error('Sequelize instance not available');
        }

        const [totalUsers] = await sequelize.query(
            'SELECT COUNT(*) as count FROM `user` WHERE `is_deleted` = 0'
        );
        const [activeUsers] = await sequelize.query(
            'SELECT COUNT(*) as count FROM `user` WHERE `is_active` = 1 AND `is_blocked` = 0 AND `is_deleted` = 0'
        );
        const [blockedUsers] = await sequelize.query(
            'SELECT COUNT(*) as count FROM `user` WHERE `is_blocked` = 1 AND `is_deleted` = 0'
        );
        const [vipUsers] = await sequelize.query(
            'SELECT COUNT(*) as count FROM `user` WHERE `is_vip_customer` = 1 AND `is_deleted` = 0'
        );
        const [newsletterSubscribers] = await sequelize.query(
            'SELECT COUNT(*) as count FROM `user` WHERE `is_newsletter_subscribed` = 1 AND `is_deleted` = 0'
        );
        const [premiumUsers] = await sequelize.query(
            'SELECT COUNT(*) as count FROM `user` WHERE `is_premium` = 1 AND `is_deleted` = 0'
        );
        const [employees] = await sequelize.query(
            'SELECT COUNT(*) as count FROM `user` WHERE `is_employee` = 1 AND `is_deleted` = 0'
        );
        const [affiliates] = await sequelize.query(
            'SELECT COUNT(*) as count FROM `user` WHERE `is_affiliate` = 1 AND `is_deleted` = 0'
        );
        const [wholesaleUsers] = await sequelize.query(
            'SELECT COUNT(*) as count FROM `user` WHERE `is_wholesale` = 1 AND `is_deleted` = 0'
        );
        const [highValueUsers] = await sequelize.query(
            'SELECT COUNT(*) as count FROM `user` WHERE `is_high_value` = 1 AND `is_deleted` = 0'
        );

        return {
            totalUsers: (totalUsers as { count: number }[])[0]?.count || 0,
            activeUsers: (activeUsers as { count: number }[])[0]?.count || 0,
            blockedUsers: (blockedUsers as { count: number }[])[0]?.count || 0,
            vipUsers: (vipUsers as { count: number }[])[0]?.count || 0,
            newsletterSubscribers: (newsletterSubscribers as { count: number }[])[0]?.count || 0,
            premiumUsers: (premiumUsers as { count: number }[])[0]?.count || 0,
            employees: (employees as { count: number }[])[0]?.count || 0,
            affiliates: (affiliates as { count: number }[])[0]?.count || 0,
            wholesaleUsers: (wholesaleUsers as { count: number }[])[0]?.count || 0,
            highValueUsers: (highValueUsers as { count: number }[])[0]?.count || 0,
        };
    }
}
