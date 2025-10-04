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
import { LoginHistoryService } from '../login-history/login-history.service';

@Injectable()
export class UserService implements IUserService {
    private static readonly ADMIN_EMAILS = ['kostay375298918971@gmail.com'] as const;
    private static readonly DEFAULT_ROLE = 'CUSTOMER' as const;
    
    // Оптимизированный кэш для часто запрашиваемых данных
    private readonly userCache = new Map<number, { user: UserModel; timestamp: number }>();
    private readonly roleCache = new Map<string, { role: { id: number; role: string; description: string }; timestamp: number }>();
    private readonly statsCache = new Map<string, { data: unknown; timestamp: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 минут
    private readonly STATS_CACHE_TTL = 10 * 60 * 1000; // 10 минут для статистики
    
    constructor(
        private readonly userRepository: UserRepository,
        private roleService: RoleService,
        @InjectModel(UserModel) private readonly userModel: typeof UserModel,
        private readonly loginHistoryService: LoginHistoryService,
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

    private getCachedRole(roleName: string): { id: number; role: string; description: string } | null {
        const cached = this.roleCache.get(roleName);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.role;
        }
        this.roleCache.delete(roleName);
        return null;
    }

    private setCachedRole(roleName: string, role: { id: number; role: string; description: string }): void {
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
    private async getRoleWithCache(roleName: string): Promise<{ id: number; role: string; description: string } | null> {
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
        
        // Кэш пользователя будет инвалидирован автоматически при следующем запросе
        
        // Удаляем все существующие роли пользователя
        await this.unlinkAllUserRoles(updatedUser.id);
        // Добавляем роль CUSTOMER
        const role = await this.getRoleWithCache('CUSTOMER');
        if (!role) {
            this.notFound('Роль CUSTOMER не найдена');
        }
        await this.linkUserRole(updatedUser.id, role!.id);
        updatedUser.roles = [role as UserModel['roles'][0]];
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
        const alreadyHas = await this.isUserRoleExists(user.id, foundRole!.id);
        if (alreadyHas) {
            this.conflictException(`Данному пользователю уже присвоена роль ${foundRole!.role}`);
        }
        await this.linkUserRole(user.id, foundRole!.id);
        
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
        await this.unlinkUserRole(user.id, role!.id);
        
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
            
            return user as UserModel;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'обновление телефона');
            throw error;
        }
    }

    async updateProfile(
        userId: number,
        dto: UpdateUserProfileDto,
    ): Promise<UpdateUserResponse> {
        const user = await this.ensureUserExists(userId, 'обновление профиля');

        try {
            const result = await this.userRepository.updateUserProfile(user, dto);
            
            // Кэш пользователя будет обновлен автоматически
            
            return result;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'обновление профиля');
            throw error;
        }
    }

    public async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findUserByPkId(userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        const userWithPassword = await this.userRepository.findUserByEmail(user.email);
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

    public async updateFlags(userId: number, dto: UpdateUserFlagsDto): Promise<UserModel> {
        await this.ensureUserExists(userId, 'обновление флагов');
        
        const user = await this.userRepository.updateFlags(userId, dto);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async updatePreferences(userId: number, dto: UpdateUserPreferencesDto): Promise<UserModel> {
        await this.ensureUserExists(userId, 'обновление настроек');
        
        const user = await this.userRepository.updatePreferences(userId, dto);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async verifyEmailFlag(userId: number): Promise<UserModel> {
        const user = await this.userRepository.verifyEmail(userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async verifyPhoneFlag(userId: number): Promise<UserModel> {
        const user = await this.userRepository.verifyPhone(userId);
        if (!user) {
            this.notFound('Пользователь не найден в БД');
        }
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
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

    public async upgradePremium(userId: number): Promise<UserModel> {
        const user = await this.userRepository.upgradePremium(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async downgradePremium(userId: number): Promise<UserModel> {
        const user = await this.userRepository.downgradePremium(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async setEmployee(userId: number): Promise<UserModel> {
        const user = await this.userRepository.setEmployee(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async unsetEmployee(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unsetEmployee(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async setVip(userId: number): Promise<UserModel> {
        const user = await this.userRepository.setVip(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async unsetVip(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unsetVip(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async setHighValue(userId: number): Promise<UserModel> {
        const user = await this.userRepository.setHighValue(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async unsetHighValue(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unsetHighValue(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async setWholesale(userId: number): Promise<UserModel> {
        const user = await this.userRepository.setWholesale(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async unsetWholesale(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unsetWholesale(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async setAffiliate(userId: number): Promise<UserModel> {
        const user = await this.userRepository.setAffiliate(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
        return user as UserModel;
    }

    public async unsetAffiliate(userId: number): Promise<UserModel> {
        const user = await this.userRepository.unsetAffiliate(userId);
        if (!user) this.notFound('Пользователь не найден в БД');
        
        // Инвалидируем кэш пользователя
        this.invalidateUserCache(userId);
        
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
    private async ensureUserExists(userId: number, context: string = 'операция'): Promise<UserModel> {
        const user = await this.userRepository.findUser(userId);
        if (!user) {
            this.notFound(`Пользователь не найден для ${context}`);
        }
        return user as UserModel;
    }

    private async determineUserRole(email: string): Promise<{ id: number; role: string; description: string }> {
        if (UserService.ADMIN_EMAILS.includes(email as typeof UserService.ADMIN_EMAILS[number])) {
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
                    transaction 
                },
            );
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    private async unlinkUserRole(userId: number, roleId: number): Promise<void> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) return;
        
        const transaction = await sequelize.transaction();
        try {
            await sequelize.query(
                'DELETE FROM `user_role` WHERE `user_id` = ? AND `role_id` = ? LIMIT 1',
                { 
                    replacements: [userId, roleId],
                    transaction 
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
                    transaction 
                },
            );
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
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
        const cacheKey = 'user_stats';
        
        // Проверяем кэш
        const cached = this.getCachedStats<{
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
        }>(cacheKey);
        
        if (cached) {
            console.log('Статистика пользователей получена из кэша');
            return cached;
        }

        // Получаем данные из репозитория
        const stats = await this.userRepository.getUserStats();
        
        // Кэшируем результат
        this.setCachedStats(cacheKey, stats);
        
        return stats;
    }
}
