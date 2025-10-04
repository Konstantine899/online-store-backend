import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
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

// Типы для кэширования
type UserStats = {
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
};

@Injectable()
export class UserRepository implements IUserRepository {
    private static readonly BCRYPT_ROUNDS = 10;
    private static readonly USER_FIELDS = ['email', 'password', 'phone'] as const;
    
    // Кэш для часто запрашиваемых данных
    private readonly userCache = new Map<number, UserModel>();
    private readonly statsCache = new Map<string, UserStats>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 минут
    private readonly cacheTimestamps = new Map<string, number>();
    
    constructor(
        @InjectModel(UserModel) private userModel: typeof UserModel,
    ) {}

    // Методы кэширования
    private getCachedUser(userId: number): UserModel | null {
        const cached = this.userCache.get(userId);
        const timestamp = this.cacheTimestamps.get(`user_${userId}`);
        if (cached && timestamp && Date.now() - timestamp < this.CACHE_TTL) {
            return cached;
        }
        this.userCache.delete(userId);
        this.cacheTimestamps.delete(`user_${userId}`);
        return null;
    }

    private setCachedUser(userId: number, user: UserModel): void {
        this.userCache.set(userId, user);
        this.cacheTimestamps.set(`user_${userId}`, Date.now());
    }

    private getCachedStats(key: string): UserStats | null {
        const cached = this.statsCache.get(key);
        const timestamp = this.cacheTimestamps.get(`stats_${key}`);
        if (cached && timestamp && Date.now() - timestamp < this.CACHE_TTL) {
            return cached;
        }
        this.statsCache.delete(key);
        this.cacheTimestamps.delete(`stats_${key}`);
        return null;
    }

    private setCachedStats(key: string, data: UserStats): void {
        this.statsCache.set(key, data);
        this.cacheTimestamps.set(`stats_${key}`, Date.now());
    }

    private invalidateUserCache(userId: number): void {
        this.userCache.delete(userId);
        this.cacheTimestamps.delete(`user_${userId}`);
        // Очищаем кэш статистики при изменении пользователя
        this.statsCache.clear();
        Array.from(this.cacheTimestamps.keys())
            .filter(key => key.startsWith('stats_'))
            .forEach(key => this.cacheTimestamps.delete(key));
    }

    // Централизованные методы обработки ошибок
    private handleSequelizeError(error: unknown, context: string): void {
        if (error instanceof Error) {
            if (error.name === 'SequelizeValidationError') {
                throw new BadRequestException(`Некорректные данные: ${context}`);
            } else if (error.name === 'SequelizeUniqueConstraintError') {
                throw new ConflictException(`Конфликт данных: ${context}`);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new BadRequestException(`Нарушение связей: ${context}`);
            } else if (error.name === 'SequelizeConnectionError') {
                throw new BadRequestException(`Ошибка подключения к БД: ${context}`);
            }
        }
        throw error;
    }

    private ensureUserExists(user: UserModel | null, context: string = 'операция'): UserModel {
        if (!user) {
            throw new NotFoundException(`Пользователь не найден для ${context}`);
        }
        return user;
    }

    // Батчевые операции для массовых обновлений
    public async batchUpdateFlags(userIds: number[], updates: Partial<UpdateUserFlagsDto>): Promise<number> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) {
            throw new Error('Sequelize instance not available');
        }

        const transaction = await sequelize.transaction();
        try {
            const updateFields: string[] = [];
            const updateValues: (string | number | boolean | Date | null)[] = [];

            // Строим динамический запрос
            Object.entries(updates).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateFields.push(`\`${key}\` = ?`);
                    // Для сложных объектов используем JSON.stringify
                    const serializedValue = typeof value === 'object' && value !== null 
                        ? JSON.stringify(value) 
                        : value;
                    updateValues.push(serializedValue as string | number | boolean | Date | null);
                }
            });

            if (updateFields.length === 0) {
                await transaction.rollback();
                return 0;
            }

            updateValues.push(...userIds);
            const query = `
                UPDATE \`user\` 
                SET ${updateFields.join(', ')}, \`updated_at\` = ?
                WHERE \`id\` IN (${userIds.map(() => '?').join(',')})
            `;

            const [affectedRows] = await sequelize.query(query, {
                replacements: [new Date(), ...updateValues],
                transaction
            });

            // Инвалидируем кэш для всех затронутых пользователей
            userIds.forEach(userId => this.invalidateUserCache(userId));

            await transaction.commit();
            return Array.isArray(affectedRows) ? affectedRows.length : 0;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    public async batchUpdatePreferences(userIds: number[], updates: Partial<UpdateUserPreferencesDto>): Promise<number> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) {
            throw new Error('Sequelize instance not available');
        }

        const transaction = await sequelize.transaction();
        try {
            const updateFields: string[] = [];
            const updateValues: (string | number | boolean | Date | null)[] = [];

            // Строим динамический запрос
            Object.entries(updates).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateFields.push(`\`${key}\` = ?`);
                    // Для сложных объектов используем JSON.stringify
                    const serializedValue = typeof value === 'object' && value !== null 
                        ? JSON.stringify(value) 
                        : value;
                    updateValues.push(serializedValue as string | number | boolean | Date | null);
                }
            });

            if (updateFields.length === 0) {
                await transaction.rollback();
                return 0;
            }

            updateValues.push(...userIds);
            const query = `
                UPDATE \`user\` 
                SET ${updateFields.join(', ')}, \`updated_at\` = ?
                WHERE \`id\` IN (${userIds.map(() => '?').join(',')})
            `;

            const [affectedRows] = await sequelize.query(query, {
                replacements: [new Date(), ...updateValues],
                transaction
            });

            // Инвалидируем кэш для всех затронутых пользователей
            userIds.forEach(userId => this.invalidateUserCache(userId));

            await transaction.commit();
            return Array.isArray(affectedRows) ? affectedRows.length : 0;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

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
        try {
            const allowedFields = this.pickAllowedFromCreate(dto);
            const hashedPassword = await hash(
                allowedFields.password!,
                UserRepository.BCRYPT_ROUNDS,
            );

            const user = await this.userModel.create({
                email: allowedFields.email,
                password: hashedPassword,
                firstName: allowedFields.firstName,
                lastName: allowedFields.lastName,
            });
            
            // Кэшируем нового пользователя
            this.setCachedUser(user.id, user);
            
            return user;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'создание пользователя');
            throw error;
        }
    }

    public async updateUser(
        user: UserModel,
        dto: UpdateUserDto,
    ): Promise<UpdateUserResponse> {
        try {
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

            // Инвалидируем кэш пользователя
            this.invalidateUserCache(user.id);

            return this.userModel
                .scope('withRoles')
                .findByPk(user.id) as Promise<UpdateUserResponse>;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'обновление пользователя');
            throw error;
        }
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

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(user.id);

        return this.userModel
            .scope('withRoles')
            .findByPk(user.id) as Promise<UpdateUserResponse>;
    }

    //  Используем scope forAuth
    public async findUserForAuth(userId: number): Promise<UserModel | null> {
        return this.userModel.scope('forAuth').findByPk(userId);
    }

    // Используем scope withRoles с кэшированием
    public async findUser(id: number): Promise<GetUserResponse> {
        // Проверяем кэш
        const cached = this.getCachedUser(id);
        if (cached) {
            return cached as GetUserResponse;
        }

        // Получаем данные из БД
        const user = await this.userModel
            .scope('withRoles')
            .findByPk(id) as GetUserResponse;
        
        // Кэшируем результат
        if (user) {
            this.setCachedUser(id, user as UserModel);
        }
        
        return user;
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
        const sequelize = this.userModel.sequelize;
        if (!sequelize) {
            throw new Error('Sequelize instance not available');
        }

        const transaction = await sequelize.transaction();
        try {
            // Удаляем связанные записи в транзакции
            await sequelize.query(
                'DELETE FROM `user_role` WHERE `user_id` = ?',
                { replacements: [id], transaction }
            );
            
            const result = await this.userModel.destroy({ 
                where: { id },
                transaction
            });
            
            // Инвалидируем кэш
            this.invalidateUserCache(id);
            
            await transaction.commit();
            return result;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
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
        // Оптимизированное обновление: прямое обновление без предварительного поиска
        const updates: Partial<UserModel> = {};
        
        // Добавляем только измененные поля
        if (dto.isActive !== undefined) updates.isActive = dto.isActive;
        if (dto.isNewsletterSubscribed !== undefined) updates.isNewsletterSubscribed = dto.isNewsletterSubscribed;
        if (dto.isMarketingConsent !== undefined) updates.isMarketingConsent = dto.isMarketingConsent;
        if (dto.isCookieConsent !== undefined) updates.isCookieConsent = dto.isCookieConsent;
        if (dto.isProfileCompleted !== undefined) updates.isProfileCompleted = dto.isProfileCompleted;
        if (dto.isVipCustomer !== undefined) updates.isVipCustomer = dto.isVipCustomer;
        if (dto.isBetaTester !== undefined) updates.isBetaTester = dto.isBetaTester;
        if (dto.isBlocked !== undefined) updates.isBlocked = dto.isBlocked;
        if (dto.isVerified !== undefined) updates.isVerified = dto.isVerified;
        if (dto.isPremium !== undefined) updates.isPremium = dto.isPremium;
        if (dto.isEmailVerified !== undefined) updates.isEmailVerified = dto.isEmailVerified;
        if (dto.isPhoneVerified !== undefined) updates.isPhoneVerified = dto.isPhoneVerified;
        if (dto.isTermsAccepted !== undefined) updates.isTermsAccepted = dto.isTermsAccepted;
        if (dto.isPrivacyAccepted !== undefined) updates.isPrivacyAccepted = dto.isPrivacyAccepted;
        if (dto.isAgeVerified !== undefined) updates.isAgeVerified = dto.isAgeVerified;
        if (dto.isTwoFactorEnabled !== undefined) updates.isTwoFactorEnabled = dto.isTwoFactorEnabled;

        if (Object.keys(updates).length === 0) {
            // Если нет изменений, возвращаем пользователя
            return this.userModel.findByPk(userId);
        }

        // Прямое обновление с возвратом обновленной записи
        const [affectedRows] = await this.userModel.update(updates, {
            where: { id: userId },
            returning: true,
        });

        if (affectedRows > 0) {
            // Инвалидируем кэш пользователя
            this.invalidateUserCache(userId);
            return this.userModel.findByPk(userId);
        }
        
        return null;
    }

    public async updatePreferences(userId: number, dto: UpdateUserPreferencesDto): Promise<UserModel | null> {
        // Оптимизированное обновление: прямое обновление без предварительного поиска
        const updates: Partial<UserModel> = {};
        
        // Добавляем только измененные поля
        if (dto.themePreference !== undefined) updates.themePreference = dto.themePreference;
        if (dto.defaultLanguage !== undefined) updates.defaultLanguage = dto.defaultLanguage;
        if (dto.notificationPreferences !== undefined) updates.notificationPreferences = dto.notificationPreferences;
        if (dto.translations !== undefined) updates.translations = dto.translations;

        if (Object.keys(updates).length === 0) {
            // Если нет изменений, возвращаем пользователя
            return this.userModel.findByPk(userId);
        }

        // Прямое обновление с возвратом обновленной записи
        const [affectedRows] = await this.userModel.update(updates, {
            where: { id: userId },
            returning: true,
        });

        return affectedRows > 0 ? this.userModel.findByPk(userId) : null;
    }

    public async verifyEmail(userId: number): Promise<UserModel | null> {
        // Оптимизированное обновление: прямое обновление без предварительного поиска
        const [affectedRows] = await this.userModel.update(
            { isEmailVerified: true, emailVerifiedAt: new Date() },
            { where: { id: userId }, returning: true }
        );
        return affectedRows > 0 ? this.userModel.findByPk(userId) : null;
    }

    public async verifyPhone(userId: number): Promise<UserModel | null> {
        // Оптимизированное обновление: прямое обновление без предварительного поиска
        const [affectedRows] = await this.userModel.update(
            { isPhoneVerified: true, phoneVerifiedAt: new Date() },
            { where: { id: userId }, returning: true }
        );
        return affectedRows > 0 ? this.userModel.findByPk(userId) : null;
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
    public async getUserStats(): Promise<UserStats> {
        // Проверяем кэш статистики
        const cached = this.getCachedStats('user_stats');
        if (cached) {
            return cached;
        }

        const sequelize = this.userModel.sequelize;
        if (!sequelize) {
            throw new Error('Sequelize instance not available');
        }

        // Оптимизированный запрос: один запрос вместо 10 отдельных
        const [results] = await sequelize.query(`
            SELECT 
                COUNT(*) as totalUsers,
                SUM(CASE WHEN is_active = 1 AND is_blocked = 0 AND is_deleted = 0 THEN 1 ELSE 0 END) as activeUsers,
                SUM(CASE WHEN is_blocked = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as blockedUsers,
                SUM(CASE WHEN is_vip_customer = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as vipUsers,
                SUM(CASE WHEN is_newsletter_subscribed = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as newsletterSubscribers,
                SUM(CASE WHEN is_premium = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as premiumUsers,
                SUM(CASE WHEN is_employee = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as employees,
                SUM(CASE WHEN is_affiliate = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as affiliates,
                SUM(CASE WHEN is_wholesale = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as wholesaleUsers,
                SUM(CASE WHEN is_high_value = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as highValueUsers
            FROM user
            WHERE is_deleted = 0
        `);

        const stats = (results as Array<{
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
        }>)[0];

        const result = {
            totalUsers: stats.totalUsers || 0,
            activeUsers: stats.activeUsers || 0,
            blockedUsers: stats.blockedUsers || 0,
            vipUsers: stats.vipUsers || 0,
            newsletterSubscribers: stats.newsletterSubscribers || 0,
            premiumUsers: stats.premiumUsers || 0,
            employees: stats.employees || 0,
            affiliates: stats.affiliates || 0,
            wholesaleUsers: stats.wholesaleUsers || 0,
            highValueUsers: stats.highValueUsers || 0,
        };

        // Кэшируем результат
        this.setCachedStats('user_stats', result);
        
        return result;
    }
}
