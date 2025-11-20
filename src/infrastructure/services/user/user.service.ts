import { UserModel } from '@app/domain/models';
import { IUserService } from '@app/domain/services';
import {
    createLogger,
    maskPII,
} from '@app/infrastructure/common/utils/logging';
import {
    AddRoleDto,
    CreateUserDto,
    RemoveRoleDto,
    UpdateConsentsDto,
    UpdateUserDto,
    UpdateUserProfileDto,
    UpdateUserStatusDto,
} from '@app/infrastructure/dto';
import { UpdateUserFlagsDto } from '@app/infrastructure/dto/user/update-user-flags.dto';
import { UpdateUserPreferencesDto } from '@app/infrastructure/dto/user/update-user-preferences.dto';
import {
    RefreshTokenRepository,
    UserRepository,
} from '@app/infrastructure/repositories';
import {
    AddRoleResponse,
    CheckResponse,
    CreateUserResponse,
    GetPaginatedUsersResponse,
    GetUserResponse,
    RemoveUserResponse,
    RemoveUserRoleResponse,
    UpdateUserResponse,
} from '@app/infrastructure/responses';
import {
    BadRequestException,
    ConflictException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { compare, hash } from 'bcrypt';
import { LoginHistoryService } from '../login-history/login-history.service';
import { RoleService } from '../role/role.service';

@Injectable()
export class UserService implements IUserService {
    private readonly logger = createLogger('UserService');

    private static readonly ADMIN_EMAILS = [
        'kostay375298918971@gmail.com',
    ] as const;
    private static readonly DEFAULT_ROLE = 'CUSTOMER' as const;

    // Оптимизированный кэш для часто запрашиваемых данных
    private readonly userCache = new Map<
        number,
        { user: UserModel; timestamp: number }
    >();
    private readonly roleCache = new Map<
        string,
        {
            role: { id: number; role: string; description: string };
            timestamp: number;
        }
    >();
    private readonly statsCache = new Map<
        string,
        { data: unknown; timestamp: number }
    >();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 минут
    private readonly STATS_CACHE_TTL = 10 * 60 * 1000; // 10 минут для статистики

    constructor(
        private readonly userRepository: UserRepository,
        private roleService: RoleService,
        @InjectModel(UserModel) private readonly userModel: typeof UserModel,
        private readonly loginHistoryService: LoginHistoryService,
        private readonly refreshTokenRepository: RefreshTokenRepository,
    ) {}

    // Оптимизированные методы кэширования
    private getCachedUser(userId: number): UserModel | null {
        const cached = this.userCache.get(userId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.user;
        }
        this.userCache.delete(userId);
        return null;
    }

    private setCachedUser(userId: number, user: UserModel): void {
        this.userCache.set(userId, { user, timestamp: Date.now() });
    }

    private getCachedRole(
        roleName: string,
    ): { id: number; role: string; description: string } | null {
        const cached = this.roleCache.get(roleName);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.role;
        }
        this.roleCache.delete(roleName);
        return null;
    }

    private setCachedRole(
        roleName: string,
        role: { id: number; role: string; description: string },
    ): void {
        this.roleCache.set(roleName, { role, timestamp: Date.now() });
    }

    private getCachedStats<T>(key: string): T | null {
        const cached = this.statsCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.STATS_CACHE_TTL) {
            return cached.data as T;
        }
        this.statsCache.delete(key);
        return null;
    }

    private setCachedStats<T>(key: string, data: T): void {
        this.statsCache.set(key, { data, timestamp: Date.now() });
    }

    private invalidateUserCache(userId: number): void {
        this.userCache.delete(userId);
        // Очищаем статистику при изменении пользователя
        this.statsCache.clear();
    }

    private invalidateRoleCache(): void {
        this.roleCache.clear();
    }

    // Метод для очистки устаревшего кэша
    private cleanupExpiredCache(): void {
        const now = Date.now();

        // Очищаем устаревший кэш пользователей
        for (const [userId, cached] of this.userCache.entries()) {
            if (now - cached.timestamp > this.CACHE_TTL) {
                this.userCache.delete(userId);
            }
        }

        // Очищаем устаревший кэш ролей
        for (const [roleName, cached] of this.roleCache.entries()) {
            if (now - cached.timestamp > this.CACHE_TTL) {
                this.roleCache.delete(roleName);
            }
        }

        // Очищаем устаревший кэш статистики
        for (const [key, cached] of this.statsCache.entries()) {
            if (now - cached.timestamp > this.STATS_CACHE_TTL) {
                this.statsCache.delete(key);
            }
        }
    }

    // Оптимизированный метод получения роли с кэшированием
    private async getRoleWithCache(
        roleName: string,
    ): Promise<{ id: number; role: string; description: string } | null> {
        // Проверяем кэш
        const cached = this.getCachedRole(roleName);
        if (cached) {
            return cached;
        }

        // Получаем роль из сервиса
        const role = await this.roleService.getRole(roleName);

        // Кэшируем результат
        if (role) {
            this.setCachedRole(roleName, role);
        }

        return role;
    }

    public async createUser(dto: CreateUserDto): Promise<CreateUserResponse> {
        const findEmail = await this.userRepository.findUserByEmail(dto.email);
        if (findEmail) {
            throw new BadRequestException(
                `Пользователь с таким email: ${dto.email} уже существует`,
            );
        }
        try {
            const role = await this.determineUserRole(dto.email);
            const user = await this.userRepository.createUser(dto);
            await this.linkUserRole(user.id, role.id);
            user.roles = [role as UserModel['roles'][0]];

            // Бизнес-логирование: создание пользователя (info level)
            this.logger.info(
                {
                    userId: user.id,
                    email: maskPII(user.email),
                    role: role.role,
                },
                'Новый пользователь создан',
            );

            return this.userRepository.findRegisteredUser(user.id);
        } catch (error: unknown) {
            if (
                error instanceof Error &&
                error.name === 'SequelizeUniqueConstraintError'
            ) {
                this.conflictException(
                    `Пользователь с таким email: ${dto.email} уже существует`,
                );
            }
            throw error;
        }
    }

    public async findAuthenticatedUser(userId: number): Promise<UserModel> {
        return this.userRepository.findAuthenticatedUser(userId);
    }

    public async getUser(id: number): Promise<GetUserResponse> {
        // Проверяем кэш
        const cached = this.getCachedUser(id);
        if (cached) {
            return cached as GetUserResponse;
        }

        // Получаем данные из репозитория
        const foundUser = await this.userRepository.findUser(id);
        if (!foundUser) {
            this.notFound('Пользователь не найден В БД');
        }

        // Кэшируем результат
        this.setCachedUser(id, foundUser as UserModel);

        return foundUser;
    }

    public async checkUserAuth(id: number): Promise<CheckResponse> {
        const user = await this.userRepository.findUser(id);
        if (!user) {
            this.notFound('Профиль пользователя не найден в БД');
        }
        return user as UserModel;
    }

    public async findUserByEmail(email: string): Promise<UserModel> {
        return this.userRepository.findUserByEmail(email);
    }

    public async getListUsers(
        page: number = 1,
        limit: number = 5,
    ): Promise<GetPaginatedUsersResponse> {
        const listUsers = await this.userRepository.findListUsersPaginated(
            page,
            limit,
        );
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
            // Проверяем что найденный пользователь - это ДРУГОЙ пользователь (не текущий)
            if (foundEmail && foundEmail.id !== id) {
                this.conflictException(
                    `Пользователь с таким email: ${dto.email} уже существует`,
                );
            }
        }
        let updatedUser: UpdateUserResponse;
        try {
            updatedUser = await this.userRepository.updateUser(foundUser, dto);
        } catch (error: unknown) {
            if (
                error instanceof Error &&
                error.name === 'SequelizeUniqueConstraintError'
            ) {
                this.conflictException(
                    `Пользователь с таким email: ${dto.email} уже существует`,
                );
            }
            throw error;
        }

        // Кэш пользователя будет инвалидирован автоматически при следующем запросе

        // Удаляем все существующие роли пользователя
        await this.unlinkAllUserRoles(updatedUser.id);
        // Добавляем роль CUSTOMER
        const role = await this.getRoleWithCache('CUSTOMER');
        if (!role) {
            this.notFound('Роль CUSTOMER не найдена');
        }
        const ensuredRole = role as NonNullable<typeof role>;
        await this.linkUserRole(updatedUser.id, ensuredRole.id);
        updatedUser.roles = [ensuredRole as UserModel['roles'][0]];
        return updatedUser;
    }

    public async removeUser(id: number): Promise<RemoveUserResponse> {
        const user = await this.userRepository.findUser(id);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        const roleId = await this.getRolesUser(user);
        if (roleId == null) {
            this.notFound('Роль пользователя не найдена в БД');
        }
        await user.$remove('role', roleId as number);
        await this.userRepository.removeUser(user.id);

        // Кэш пользователя будет инвалидирован автоматически при следующем запросе

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
        const foundRole = await this.getRoleWithCache(dto.role);
        if (!foundRole) {
            this.notFound('Роль не найдена в БД');
        }
        const ensuredFoundRole = foundRole as NonNullable<typeof foundRole>;
        const alreadyHas = await this.isUserRoleExists(
            user.id,
            ensuredFoundRole.id,
        );
        if (alreadyHas) {
            this.conflictException(
                `Данному пользователю уже присвоена роль ${ensuredFoundRole.role}`,
            );
        }
        await this.linkUserRole(user.id, ensuredFoundRole.id);

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(dto.userId);

        return this.userRepository.findUser(user.id);
    }

    public async removeUserRole(
        dto: RemoveRoleDto,
    ): Promise<RemoveUserRoleResponse> {
        const user = await this.userRepository.findUser(dto.userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        const role = await this.getRoleWithCache(dto.role);
        if (!role) {
            this.notFound('Роль не найдена в БД');
        }
        const ensuredRole = role as NonNullable<typeof role>;
        await this.unlinkUserRole(user.id, ensuredRole.id);

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(dto.userId);

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

            // Кэш пользователя будет обновлен автоматически

            return user;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'обновление телефона');
            throw error;
        }
    }

    async updateDateOfBirth(
        userId: number,
        dateOfBirth: string,
    ): Promise<UserModel> {
        try {
            const user = await this.userRepository.updateDateOfBirth(
                userId,
                dateOfBirth,
            );
            if (!user) {
                throw new NotFoundException('Пользователь не найден');
            }

            // Кэш пользователя будет обновлен автоматически

            return user;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'обновление даты рождения');
            throw error;
        }
    }

    async updateConsents(
        userId: number,
        dto: UpdateConsentsDto,
    ): Promise<UserModel> {
        try {
            // Получаем текущие значения согласий для логирования изменений
            const currentUser =
                await this.userRepository.findUserByPkId(userId);
            const oldConsents = {
                isNewsletterSubscribed:
                    currentUser?.isNewsletterSubscribed ?? false,
                isMarketingConsent: currentUser?.isMarketingConsent ?? false,
                isCookieConsent: currentUser?.isCookieConsent ?? false,
            };

            const user = await this.userRepository.updateConsents(userId, dto);
            if (!user) {
                throw new NotFoundException('Пользователь не найден');
            }

            // Формируем новые значения согласий (используем переданные значения или старые)
            const newConsents = {
                isNewsletterSubscribed:
                    dto.isNewsletterSubscribed ??
                    oldConsents.isNewsletterSubscribed,
                isMarketingConsent:
                    dto.isMarketingConsent ?? oldConsents.isMarketingConsent,
                isCookieConsent:
                    dto.isCookieConsent ?? oldConsents.isCookieConsent,
            };

            // Логируем изменения согласий для GDPR compliance (до/после)
            this.logger.info({
                message: 'Согласия пользователя обновлены',
                userId: maskPII(userId.toString()),
                changes: {
                    before: oldConsents,
                    after: newConsents,
                },
            });

            // Кэш пользователя будет обновлен автоматически

            return user;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'обновление согласий');
            throw error;
        }
    }

    async updateProfile(
        userId: number,
        dto: UpdateUserProfileDto,
    ): Promise<UpdateUserResponse> {
        const user = await this.ensureUserExists(userId, 'обновление профиля');

        try {
            const result = await this.userRepository.updateUserProfile(
                user,
                dto,
            );

            // Кэш пользователя будет обновлен автоматически

            return result;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'обновление профиля');
            throw error;
        }
    }

    public async changePassword(
        userId: number,
        oldPassword: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.userRepository.findUserByPkId(userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        const userWithPassword = await this.userRepository.findUserByEmail(
            user.email,
        );
        if (!userWithPassword) {
            this.notFound('Пользователь не найден в БД');
        }
        const isMatch = await compare(oldPassword, userWithPassword.password);
        if (!isMatch) {
            this.badRequest('Текущий пароль указан неверно');
        }
        const hashed = await hash(newPassword, 10);
        await userWithPassword.update({ password: hashed });

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
    }

    /**
     * Обновляет пароль пользователя (без проверки старого пароля)
     * Используется для password reset flow
     */
    public async updatePassword(
        userId: number,
        passwordHash: string,
    ): Promise<void> {
        const user = await this.userRepository.findUserByPkId(userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }

        await this.userModel.update(
            { password: passwordHash },
            { where: { id: userId } },
        );

        // SEC-001: CRITICAL FIX - Invalidate all refresh tokens on admin password update
        // Prevents session hijacking: attacker can't use old refresh tokens after password reset
        const deletedTokensCount =
            await this.refreshTokenRepository.removeListRefreshTokens(userId);

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);

        // SEC-001: Audit logging для admin security actions
        this.logger.warn(
            {
                userId,
                action: 'admin_password_update',
                tokensInvalidated: deletedTokensCount,
                timestamp: new Date().toISOString(),
            },
            'Admin force password update - all user sessions terminated',
        );
    }

    public async updateFlags(
        userId: number,
        dto: UpdateUserFlagsDto,
    ): Promise<UserModel> {
        await this.ensureUserExists(userId, 'обновление флагов');

        const user = await this.userRepository.updateFlags(userId, dto);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);

        return user as UserModel;
    }

    public async updatePreferences(
        userId: number,
        dto: UpdateUserPreferencesDto,
    ): Promise<UserModel> {
        await this.ensureUserExists(userId, 'обновление настроек');

        const user = await this.userRepository.updatePreferences(userId, dto);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);

        return user as UserModel;
    }

    /**
     * Получить preferences пользователя с кэшированием
     * @param userId ID пользователя
     * @returns user model с preference полями
     */
    public async getPreferences(userId: number): Promise<UserModel> {
        await this.ensureUserExists(userId, 'получение настроек');

        const user = await this.userRepository.getPreferences(userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }

        return user as UserModel;
    }

    public async verifyEmailFlag(
        userId: number,
        tenantId: number,
    ): Promise<UserModel> {
        const user = await this.userRepository.verifyEmail(userId, tenantId);
        if (!user) {
            this.notFound(
                'Пользователь не найден или не принадлежит вашему tenant',
            );
        }

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);

        return user as UserModel;
    }

    public async verifyPhoneFlag(
        userId: number,
        tenantId: number,
    ): Promise<UserModel> {
        const user = await this.userRepository.verifyPhone(userId, tenantId);
        if (!user) {
            this.notFound(
                'Пользователь не найден или не принадлежит вашему tenant',
            );
        }

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);

        return user as UserModel;
    }

    /**
     * Обновляет статусные флаги пользователя (VIP, Premium, Beta Tester)
     * Только для администраторов
     * Логирует изменения для аудита
     * С TENANT ISOLATION: администратор может изменять только пользователей своего тенанта
     */
    public async updateUserStatus(
        userId: number,
        dto: UpdateUserStatusDto,
        tenantId: number,
    ): Promise<UserModel> {
        try {
            // Оптимизация: один запрос вместо двух
            // Получаем пользователя с учётом tenant isolation
            const beforeUser = await this.userRepository.findUserByIdAndTenant(
                userId,
                tenantId,
            );

            if (!beforeUser) {
                // Логируем попытку доступа к несуществующему или чужому пользователю
                this.logger.warn({
                    message:
                        'Попытка изменения несуществующего пользователя или пользователя из другого tenant',
                    adminTenantId: tenantId,
                    targetUserId: userId,
                });
                this.notFound(
                    `Пользователь с ID ${userId} не найден или не принадлежит вашему tenant`,
                );
            }

            // ⚠️ ВАЖНО: все статусные поля (isPremium, isVipCustomer, isBetaTester) удалены из UserModel
            // Endpoint оставлен для обратной совместимости, но не выполняет реальных обновлений
            const user = await this.userRepository.updateUserStatus(
                userId,
                dto,
                tenantId,
            );

            // Инвалидируем кэш пользователя (на всякий случай)
            this.invalidateUserCache(userId);

            return user;
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'обновление статусных флагов пользователя',
            );
            throw error;
        }
    }

    // Admin actions
    public async blockUser(userId: number): Promise<UserModel> {
        const user = await this.userRepository.blockUser(userId);
        if (!user) this.notFound('Пользователь не найден в БД');

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);

        return user as UserModel;
    }

    public async unblockUser(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unblockUser(userId);
        if (!user) this.notFound('Пользователь не найден в БД');

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);

        return user as UserModel;
    }

    public async suspendUser(userId: number): Promise<UserModel> {
        const user = await this.userRepository.suspendUser(userId);
        if (!user) this.notFound('Пользователь не найден в БД');

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);

        return user as UserModel;
    }

    public async unsuspendUser(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unsuspendUser(userId);
        if (!user) this.notFound('Пользователь не найден в БД');

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);

        return user as UserModel;
    }

    public async softDeleteUser(userId: number): Promise<UserModel> {
        const user = await this.userRepository.softDeleteUser(userId);
        if (!user) this.notFound('Пользователь не найден в БД');

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);

        return user as UserModel;
    }

    public async restoreUser(userId: number): Promise<UserModel> {
        const user = await this.userRepository.restoreUser(userId);
        if (!user) this.notFound('Пользователь не найден в БД');

        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);

        return user as UserModel;
    }

    // ===== Self-service verification =====

    /**
     * Запрашивает код верификации для email или телефона с tenant isolation.
     *
     * Генерирует уникальный код, сохраняет хэш в БД и отправляет через email/SMS провайдер.
     * Код действителен 10 минут, максимум 5 попыток ввода. Защищён cooldown (60 сек).
     *
     * @param {number} userId - ID пользователя
     * @param {'email' | 'phone'} channel - Канал верификации
     * @param {number} tenantId - ID тенанта для изоляции
     *
     * @throws {NotFoundException} Пользователь не найден или не принадлежит tenant
     * @throws {BadRequestException} Cooldown не истёк или номер телефона отсутствует
     * @throws {Error} Провайдер email/SMS вернул ошибку
     *
     * @returns {Promise<void>}
     */
    public async requestVerificationCode(
        userId: number,
        channel: 'email' | 'phone',
        tenantId: number,
    ): Promise<void> {
        try {
            await this.userRepository.requestVerificationCode(
                userId,
                channel,
                tenantId,
            );

            this.logger.info({
                message: 'Запрошен код верификации',
                userId,
                channel,
                tenantId,
            });
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'запрос кода верификации');
            throw error;
        }
    }

    /**
     * Подтверждает верификацию email или телефона по введённому коду.
     *
     * Проверяет код, срок действия, количество попыток и tenant isolation.
     * При успехе обновляет is_email_verified/is_phone_verified, verified_at
     * и инвалидирует кэш пользователя.
     *
     * @param {number} userId - ID пользователя
     * @param {'email' | 'phone'} channel - Канал верификации
     * @param {string} code - Введённый код (6 hex символов)
     * @param {number} tenantId - ID тенанта для изоляции
     *
     * @throws {NotFoundException} Пользователь не найден или не принадлежит tenant
     * @throws {BadRequestException} Код неверный, истёк или превышены попытки (5 max)
     *
     * @returns {Promise<void>}
     */
    public async confirmVerificationCode(
        userId: number,
        channel: 'email' | 'phone',
        code: string,
        tenantId: number,
    ): Promise<void> {
        try {
            const ok = await this.userRepository.confirmVerificationCode(
                userId,
                channel,
                code,
                tenantId,
            );

            if (!ok) {
                this.badRequest('Неверный или просроченный код подтверждения');
            }

            // Инвалидируем кэш пользователя после успешной верификации
            this.invalidateUserCache(userId);

            this.logger.info({
                message: 'Код верификации подтверждён',
                userId,
                channel,
                tenantId,
            });
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'подтверждение кода верификации');
            throw error;
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

    // Оптимизированные методы обработки ошибок
    private handleSequelizeError(error: unknown, context: string): void {
        if (error instanceof Error) {
            if (error.name === 'SequelizeValidationError') {
                this.badRequest(`Некорректные данные: ${context}`);
            } else if (error.name === 'SequelizeUniqueConstraintError') {
                this.conflictException(`Конфликт данных: ${context}`);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                this.badRequest(`Нарушение связей: ${context}`);
            }
        }
        throw error;
    }

    // Оптимизированный метод для проверки существования пользователя
    private async ensureUserExists(
        userId: number,
        context: string = 'операция',
    ): Promise<UserModel> {
        const user = await this.userRepository.findUser(userId);
        if (!user) {
            this.notFound(`Пользователь не найден для ${context}`);
        }
        return user as UserModel;
    }

    private async determineUserRole(
        email: string,
    ): Promise<{ id: number; role: string; description: string }> {
        if (
            UserService.ADMIN_EMAILS.includes(
                email as (typeof UserService.ADMIN_EMAILS)[number],
            )
        ) {
            let role = await this.getRoleWithCache('ADMIN');
            if (!role) {
                role = await this.roleService.createRole({
                    role: 'ADMIN',
                    description: 'Администратор',
                });
                this.setCachedRole('ADMIN', role);
            }
            return role;
        }

        let role = await this.getRoleWithCache(UserService.DEFAULT_ROLE);
        if (!role) {
            role = await this.roleService.createRole({
                role: UserService.DEFAULT_ROLE,
                description: 'Покупатель',
            });
            this.setCachedRole(UserService.DEFAULT_ROLE, role);
        }
        return role;
    }

    // Оптимизированные методы работы с ролями через транзакции
    private async linkUserRole(userId: number, roleId: number): Promise<void> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) return;

        const transaction = await sequelize.transaction();
        try {
            const now = new Date();
            await sequelize.query(
                'INSERT INTO `user_role` (`user_id`,`role_id`,`created_at`,`updated_at`) VALUES (?,?,?,?)',
                {
                    replacements: [userId, roleId, now, now],
                    transaction,
                },
            );
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private async unlinkUserRole(
        userId: number,
        roleId: number,
    ): Promise<void> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) return;

        const transaction = await sequelize.transaction();
        try {
            await sequelize.query(
                'DELETE FROM `user_role` WHERE `user_id` = ? AND `role_id` = ? LIMIT 1',
                {
                    replacements: [userId, roleId],
                    transaction,
                },
            );
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private async unlinkAllUserRoles(userId: number): Promise<void> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) return;

        const transaction = await sequelize.transaction();
        try {
            await sequelize.query(
                'DELETE FROM `user_role` WHERE `user_id` = ?',
                {
                    replacements: [userId],
                    transaction,
                },
            );
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private async isUserRoleExists(
        userId: number,
        roleId: number,
    ): Promise<boolean> {
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
    async updateLastLoginAt(
        userId: number,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<void> {
        try {
            // Обновляем last_login_at в таблице user
            await this.userRepository.updateLastLoginAt(userId);

            // Логируем успешный вход
            await this.loginHistoryService.logSuccessfulLogin(
                userId,
                ipAddress,
                userAgent,
            );
        } catch (error) {
            // Не бросаем ошибку, чтобы не сломать процесс входа
            // Просто логируем проблему
            console.error(
                `Failed to update last login for user ${userId}:`,
                error,
            );
        }
    }

    /**
     * Логирует неудачную попытку входа
     */
    async logFailedLogin(
        userId: number,
        failureReason: string,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<void> {
        try {
            await this.loginHistoryService.logFailedLogin(
                userId,
                failureReason,
                ipAddress,
                userAgent,
            );
        } catch (error) {
            // Не бросаем ошибку, чтобы не сломать процесс аутентификации
            console.error(
                `Failed to log failed login for user ${userId}:`,
                error,
            );
        }
    }

    // ==================== МЕТОДЫ ФИЛЬТРАЦИИ ====================

    /**
     * Универсальный метод для фильтрации пользователей
     * Роутит запрос на соответствующий метод репозитория в зависимости от filterType
     * @param filterType - тип фильтра (active, blocked, verified, unverified, newsletter)
     * @param page - номер страницы
     * @param limit - количество записей на странице
     * @returns список пользователей с метаданными пагинации
     */
    public async getFilteredUsers(
        filterType: string | undefined,
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        // Если filterType не указан - возвращаем всех пользователей
        if (!filterType) {
            return this.userRepository.findListUsersPaginated(page, limit);
        }

        switch (filterType) {
            case 'active':
                return this.findActiveUsers(page, limit);
            case 'blocked':
                return this.findBlockedUsers(page, limit);
            case 'verified':
                return this.findVerifiedUsers(page, limit);
            case 'unverified':
                return this.findUnverifiedUsers(page, limit);
            case 'newsletter':
                return this.findNewsletterSubscribers(page, limit);
            default:
                throw new BadRequestException(
                    `Неизвестный тип фильтра: ${filterType}`,
                );
        }
    }

    /**
     * Получить список активных пользователей с пагинацией
     */
    public async findActiveUsers(
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        return this.userRepository.findActiveUsersPaginated(page, limit);
    }

    /**
     * Получить список заблокированных пользователей с пагинацией
     */
    public async findBlockedUsers(
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        return this.userRepository.findBlockedUsersPaginated(page, limit);
    }

    /**
     * Получить список верифицированных пользователей с пагинацией
     */
    public async findVerifiedUsers(
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        return this.userRepository.findVerifiedUsersPaginated(page, limit);
    }

    /**
     * Получить список неверифицированных пользователей с пагинацией
     */
    public async findUnverifiedUsers(
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        return this.userRepository.findUnverifiedUsersPaginated(page, limit);
    }

    /**
     * Получить список подписчиков на рассылку с пагинацией
     */
    public async findNewsletterSubscribers(
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        return this.userRepository.findNewsletterSubscribersPaginated(
            page,
            limit,
        );
    }

    // ==================== МЕТОДЫ ПОИСКА ====================

    /**
     * Поиск пользователей по имени (firstName или lastName)
     * @param searchTerm - строка поиска
     * @param page - номер страницы
     * @param limit - количество записей на странице
     * @returns список найденных пользователей с пагинацией
     */
    public async searchUsersByName(
        searchTerm: string,
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        if (!searchTerm || searchTerm.trim().length === 0) {
            throw new BadRequestException('Строка поиска не может быть пустой');
        }

        if (searchTerm.trim().length < 2) {
            throw new BadRequestException(
                'Строка поиска должна содержать минимум 2 символа',
            );
        }

        return this.userRepository.searchUsersByName(
            searchTerm.trim(),
            page,
            limit,
        );
    }

    /**
     * Найти пользователя по точному номеру телефона
     * @param phone - полный номер телефона
     * @returns пользователь или null
     */
    public async findUserByPhone(phone: string): Promise<UserModel | null> {
        if (!phone || phone.trim().length === 0) {
            throw new BadRequestException(
                'Номер телефона не может быть пустым',
            );
        }

        return this.userRepository.findUserByPhone(phone.trim());
    }

    /**
     * Поиск пользователей по префиксу телефона (для автодополнения)
     * @param phonePrefix - префикс номера телефона
     * @returns список пользователей (до 20)
     */
    public async searchUsersByPhone(phonePrefix: string): Promise<UserModel[]> {
        if (!phonePrefix || phonePrefix.trim().length === 0) {
            throw new BadRequestException(
                'Префикс телефона не может быть пустым',
            );
        }

        if (phonePrefix.trim().length < 3) {
            throw new BadRequestException(
                'Префикс телефона должен содержать минимум 3 символа',
            );
        }

        return this.userRepository.searchUsersByPhone(phonePrefix.trim());
    }

    /**
     * Найти пользователей по массиву ID (batch запрос)
     * @param ids - массив ID пользователей
     * @returns список найденных пользователей (только из текущего tenant)
     */
    public async findUsersByIds(ids: number[]): Promise<UserModel[]> {
        if (!ids || ids.length === 0) {
            throw new BadRequestException('Массив ID не может быть пустым');
        }

        if (ids.length > 100) {
            throw new BadRequestException(
                'Максимальное количество ID в одном запросе: 100',
            );
        }

        // Проверяем, что все элементы - положительные числа
        const invalidIds = ids.filter((id) => !Number.isInteger(id) || id <= 0);
        if (invalidIds.length > 0) {
            throw new BadRequestException(
                `Некорректные ID: ${invalidIds.join(', ')}`,
            );
        }

        return this.userRepository.findUsersByIds(ids);
    }

    /**
     * Полнотекстовый поиск пользователей по email, имени, фамилии и телефону
     * @param query - строка поиска
     * @param page - номер страницы
     * @param limit - количество записей на странице
     * @returns список найденных пользователей с пагинацией
     */
    public async fullTextSearchUsers(
        query: string,
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        if (!query || query.trim().length === 0) {
            throw new BadRequestException('Строка поиска не может быть пустой');
        }

        if (query.trim().length < 3) {
            throw new BadRequestException(
                'Строка поиска должна содержать минимум 3 символа',
            );
        }

        return this.userRepository.fullTextSearchUsers(
            query.trim(),
            page,
            limit,
        );
    }

    // ==================== МЕТОДЫ СТАТИСТИКИ ====================

    /**
     * Получить общую статистику пользователей
     * @returns базовая статистика: всего, активных, заблокированных, подписчиков
     */
    public async getUserStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        blockedUsers: number;
        newsletterSubscribers: number;
    }> {
        return this.userRepository.getUserStats();
    }

    /**
     * Получить статистику пользователей по ролям
     * @returns статистика: количество пользователей для каждой роли с процентами
     */
    public async getUserStatsByRole(): Promise<{
        roles: Array<{ role: string; count: number; percentage: number }>;
        totalUsers: number;
    }> {
        return this.userRepository.getUserStatsByRole();
    }

    /**
     * Получить статистику активности пользователей
     * @returns статистика: активные пользователи за 24ч, 7д, 30д, никогда не логинились
     */
    public async getUserActivityStats(): Promise<{
        activeInLast24Hours: number;
        activeInLast7Days: number;
        activeInLast30Days: number;
        neverLoggedIn: number;
        totalUsers: number;
    }> {
        return this.userRepository.getUserActivityStats();
    }

    // ==================== BULK ОПЕРАЦИИ ====================

    /**
     * Массовая активация пользователей
     * @param userIds - массив ID пользователей для активации
     * @returns количество обновлённых пользователей
     */
    public async bulkActivateUsers(userIds: number[]): Promise<number> {
        try {
            const affectedCount =
                await this.userRepository.bulkActivateUsers(userIds);

            // Инвалидируем кэш для всех затронутых пользователей
            for (const userId of userIds) {
                this.invalidateUserCache(userId);
            }

            this.logger.info(
                { userIds, affectedCount },
                `Массовая активация ${affectedCount} пользователей`,
            );

            return affectedCount;
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'массовая активация пользователей',
            );
            throw error;
        }
    }

    /**
     * Массовая деактивация пользователей
     * @param userIds - массив ID пользователей для деактивации
     * @returns количество обновлённых пользователей
     */
    public async bulkDeactivateUsers(userIds: number[]): Promise<number> {
        try {
            const affectedCount =
                await this.userRepository.bulkDeactivateUsers(userIds);

            // Инвалидируем кэш для всех затронутых пользователей
            for (const userId of userIds) {
                this.invalidateUserCache(userId);
            }

            this.logger.info(
                { userIds, affectedCount },
                `Массовая деактивация ${affectedCount} пользователей`,
            );

            return affectedCount;
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'массовая деактивация пользователей',
            );
            throw error;
        }
    }

    /**
     * Массовая блокировка пользователей
     * @param userIds - массив ID пользователей для блокировки
     * @returns количество обновлённых пользователей
     */
    public async bulkBlockUsers(userIds: number[]): Promise<number> {
        try {
            const affectedCount =
                await this.userRepository.bulkBlockUsers(userIds);

            // Инвалидируем кэш для всех затронутых пользователей
            for (const userId of userIds) {
                this.invalidateUserCache(userId);
            }

            this.logger.info(
                { userIds, affectedCount },
                `Массовая блокировка ${affectedCount} пользователей`,
            );

            return affectedCount;
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'массовая блокировка пользователей',
            );
            throw error;
        }
    }

    /**
     * Массовая разблокировка пользователей
     * @param userIds - массив ID пользователей для разблокировки
     * @returns количество обновлённых пользователей
     */
    public async bulkUnblockUsers(userIds: number[]): Promise<number> {
        try {
            const affectedCount =
                await this.userRepository.bulkUnblockUsers(userIds);

            // Инвалидируем кэш для всех затронутых пользователей
            for (const userId of userIds) {
                this.invalidateUserCache(userId);
            }

            this.logger.info(
                { userIds, affectedCount },
                `Массовая разблокировка ${affectedCount} пользователей`,
            );

            return affectedCount;
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'массовая разблокировка пользователей',
            );
            throw error;
        }
    }

    /**
     * Массовое soft delete пользователей
     * @param userIds - массив ID пользователей для удаления
     * @returns количество обновлённых пользователей
     */
    public async bulkDeleteUsers(userIds: number[]): Promise<number> {
        try {
            const affectedCount =
                await this.userRepository.bulkDeleteUsers(userIds);

            // Инвалидируем кэш для всех затронутых пользователей
            for (const userId of userIds) {
                this.invalidateUserCache(userId);
            }

            this.logger.info(
                { userIds, affectedCount },
                `Массовое soft delete ${affectedCount} пользователей`,
            );

            return affectedCount;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'массовое удаление пользователей');
            throw error;
        }
    }

    /**
     * Массовая верификация пользователей
     * @param userIds - массив ID пользователей для верификации
     * @returns количество обновлённых пользователей
     */
    public async bulkVerifyUsers(userIds: number[]): Promise<number> {
        try {
            const affectedCount =
                await this.userRepository.bulkVerifyUsers(userIds);

            // Инвалидируем кэш для всех затронутых пользователей
            for (const userId of userIds) {
                this.invalidateUserCache(userId);
            }

            this.logger.info(
                { userIds, affectedCount },
                `Массовая верификация ${affectedCount} пользователей`,
            );

            return affectedCount;
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'массовая верификация пользователей',
            );
            throw error;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // СПЕЦИАЛИЗИРОВАННЫЕ ЗАПРОСЫ
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Поиск неактивных пользователей (без логина N дней)
     * @param days - количество дней без активности
     * @param page - номер страницы (по умолчанию 1)
     * @param limit - размер страницы (по умолчанию 5)
     * @returns Promise<GetPaginatedUsersResponse>
     */
    public async findInactiveUsers(
        days: number,
        page: number = 1,
        limit: number = 5,
    ): Promise<GetPaginatedUsersResponse> {
        try {
            // Валидация параметров
            if (days <= 0) {
                throw new BadRequestException(
                    'Количество дней должно быть больше 0',
                );
            }

            if (page < 1) {
                throw new BadRequestException(
                    'Номер страницы должен быть больше 0',
                );
            }

            if (limit < 1 || limit > 100) {
                throw new BadRequestException(
                    'Размер страницы должен быть от 1 до 100',
                );
            }

            const result = await this.userRepository.findInactiveUsers(
                days,
                page,
                limit,
            );

            this.logger.info(
                {
                    days,
                    page,
                    limit,
                    totalCount: result.meta.totalCount,
                },
                `Поиск неактивных пользователей (${days} дней)`,
            );

            return result;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'поиск неактивных пользователей');
            throw error;
        }
    }

    /**
     * Поиск пользователей с неполным профилем
     * @param page - номер страницы (по умолчанию 1)
     * @param limit - размер страницы (по умолчанию 5)
     * @returns Promise<GetPaginatedUsersResponse>
     */
    public async findUsersWithIncompleteProfile(
        page: number = 1,
        limit: number = 5,
    ): Promise<GetPaginatedUsersResponse> {
        try {
            // Валидация параметров
            if (page < 1) {
                throw new BadRequestException(
                    'Номер страницы должен быть больше 0',
                );
            }

            if (limit < 1 || limit > 100) {
                throw new BadRequestException(
                    'Размер страницы должен быть от 1 до 100',
                );
            }

            const result =
                await this.userRepository.findUsersWithIncompleteProfile(
                    page,
                    limit,
                );

            this.logger.info(
                {
                    page,
                    limit,
                    totalCount: result.meta.totalCount,
                },
                `Поиск пользователей с неполным профилем`,
            );

            return result;
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'поиск пользователей с неполным профилем',
            );
            throw error;
        }
    }

    /**
     * Поиск пользователей по диапазону дат
     * @param field - поле для фильтрации ('createdAt' | 'lastLoginAt')
     * @param startDate - начальная дата
     * @param endDate - конечная дата
     * @param page - номер страницы (по умолчанию 1)
     * @param limit - размер страницы (по умолчанию 5)
     * @returns Promise<GetPaginatedUsersResponse>
     */
    public async findUsersByDateRange(
        field: 'createdAt' | 'lastLoginAt',
        startDate: Date,
        endDate: Date,
        page: number = 1,
        limit: number = 5,
    ): Promise<GetPaginatedUsersResponse> {
        try {
            // Валидация параметров
            if (!['createdAt', 'lastLoginAt'].includes(field)) {
                throw new BadRequestException(
                    'Поле должно быть "createdAt" или "lastLoginAt"',
                );
            }

            if (startDate >= endDate) {
                throw new BadRequestException(
                    'Начальная дата должна быть меньше конечной',
                );
            }

            if (page < 1) {
                throw new BadRequestException(
                    'Номер страницы должен быть больше 0',
                );
            }

            if (limit < 1 || limit > 100) {
                throw new BadRequestException(
                    'Размер страницы должен быть от 1 до 100',
                );
            }

            const result = await this.userRepository.findUsersByDateRange(
                field,
                startDate,
                endDate,
                page,
                limit,
            );

            this.logger.info(
                {
                    field,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    page,
                    limit,
                    totalCount: result.meta.totalCount,
                },
                `Поиск пользователей по диапазону дат (${field})`,
            );

            return result;
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'поиск пользователей по диапазону дат',
            );
            throw error;
        }
    }

    /**
     * Получение метрик производительности пользовательского модуля
     * Возвращает статистику за последние 24 часа
     *
     * ЗАМЕТКА: Для MVP возвращаются mock данные. Для production требуется:
     * - Интеграция с Prometheus/Grafana для сбора метрик
     * - Отдельная таблица для логирования метрик
     * - Redis для агрегации в реальном времени
     *
     * @returns объект с метриками производительности
     */
    public async getUserMetrics(): Promise<{
        slowQueriesCount: number;
        avgBulkOperationTime: number;
        totalBulkOperations: number;
        bulkOperationsByType: {
            bulkActivateUsers: number;
            bulkDeactivateUsers: number;
            bulkBlockUsers: number;
            bulkUnblockUsers: number;
            bulkDeleteUsers: number;
            bulkVerifyUsers: number;
        };
        errorRate: number;
        timestamp: string;
    }> {
        try {
            // NOTE: This method is deprecated and will be removed
            // Use MetricsCollector.getMetrics() directly from the controller
            // Returning mock data for backward compatibility
            const metrics = {
                slowQueriesCount: 0,
                avgBulkOperationTime: 0,
                totalBulkOperations: 0,
                bulkOperationsByType: {
                    bulkActivateUsers: 0,
                    bulkDeactivateUsers: 0,
                    bulkBlockUsers: 0,
                    bulkUnblockUsers: 0,
                    bulkDeleteUsers: 0,
                    bulkVerifyUsers: 0,
                },
                errorRate: 0,
                timestamp: new Date().toISOString(),
            };

            this.logger.log(
                {
                    action: 'get_user_metrics',
                    metricsTimestamp: metrics.timestamp,
                    deprecated: true,
                },
                'Получение метрик производительности (deprecated - use MetricsCollector directly)',
            );

            return metrics;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'получение метрик пользователей');
            throw error;
        }
    }
}
