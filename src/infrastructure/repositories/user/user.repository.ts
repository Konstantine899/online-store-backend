import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from '@app/domain/models';
import { CreateUserDto, UpdateUserDto } from '@app/infrastructure/dto';
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

@Injectable()
export class UserRepository implements IUserRepository {
    private static readonly BCRYPT_ROUNDS = 10;
    private static readonly USER_FIELDS = ['email', 'password', 'phone'] as const;
    
    constructor(@InjectModel(UserModel) private userModel: typeof UserModel) {}

    private pickAllowedFromCreate(dto: CreateUserDto): { email: string; password: string } {
        const { email, password } = dto;
        return { email, password };
    }

    public async createUser(dto: CreateUserDto): Promise<UserModel> {
        const allowedFields = this.pickAllowedFromCreate(dto);
        const hashedPassword = await hash(allowedFields.password!, UserRepository.BCRYPT_ROUNDS);
        
        return this.userModel.create({
            email: allowedFields.email,
            password: hashedPassword,
        });
    }

    public async updateUser(
        user: UserModel,
        dto: UpdateUserDto,
    ): Promise<UpdateUserResponse> {
        const updates: Partial<UserModel> = {} as Partial<UserModel>;
        if (dto.email !== undefined) updates.email = dto.email as unknown as string;
        if (dto.password !== undefined) updates.password = await hash(dto.password, UserRepository.BCRYPT_ROUNDS);
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
}
