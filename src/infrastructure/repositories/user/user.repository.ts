import { UserModel } from '@app/domain/models';
import { IUserRepository } from '@app/domain/repositories';
import type { IEmailProvider, ISmsProvider } from '@app/domain/services';
import { normalizeRussianPhone } from '@app/infrastructure/common/utils/phone.utils';
import {
    VERIFICATION_CODE_COOLDOWN_MS,
    VERIFICATION_CODE_EXPIRY_MS,
    VERIFICATION_CODE_MAX_ATTEMPTS,
} from '@app/infrastructure/config/verification.config';
import {
    CreateUserDto,
    UpdateConsentsDto,
    UpdateUserDto,
    UpdateUserProfileDto,
    UpdateUserStatusDto,
} from '@app/infrastructure/dto';
import { UpdateUserFlagsDto } from '@app/infrastructure/dto/user/update-user-flags.dto';
import { UpdateUserPreferencesDto } from '@app/infrastructure/dto/user/update-user-preferences.dto';
import { MetaData } from '@app/infrastructure/paginate';
import {
    CreateUserResponse,
    GetListUsersResponse,
    GetPaginatedUsersResponse,
    GetUserResponse,
    UpdateUserResponse,
} from '@app/infrastructure/responses';
import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { hash } from 'bcrypt';
import { createHash } from 'crypto';
import { QueryTypes } from 'sequelize';

// Типы для статистики пользователей
export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    newsletterSubscribers: number;
}

@Injectable()
export class UserRepository implements IUserRepository {
    private readonly logger = new Logger(UserRepository.name);
    private static readonly BCRYPT_ROUNDS = 10;
    private static readonly USER_FIELDS = [
        'email',
        'password',
        'phone',
    ] as const;

    constructor(
        @InjectModel(UserModel) private userModel: typeof UserModel,
        @Inject('IEmailProvider')
        private readonly emailProvider: IEmailProvider,
        @Inject('ISmsProvider')
        private readonly smsProvider: ISmsProvider,
    ) {}

    // Централизованные методы обработки ошибок с structured logging
    private handleSequelizeError(error: unknown, context: string): void {
        if (error instanceof Error) {
            const errorInfo = {
                name: error.name,
                message: error.message,
                context,
                timestamp: new Date().toISOString(),
                stack: error.stack,
            };

            // Логируем только критические ошибки
            if (
                error.name === 'SequelizeConnectionError' ||
                error.name === 'SequelizeTimeoutError'
            ) {
                console.error(
                    `Critical database error in ${context}:`,
                    errorInfo,
                );
            }

            if (error.name === 'SequelizeValidationError') {
                throw new BadRequestException(
                    `Некорректные данные: ${context}`,
                );
            } else if (error.name === 'SequelizeUniqueConstraintError') {
                throw new ConflictException(`Конфликт данных: ${context}`);
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
                throw new BadRequestException(`Нарушение связей: ${context}`);
            } else if (error.name === 'SequelizeConnectionError') {
                throw new BadRequestException(
                    `Ошибка подключения к БД: ${context}`,
                );
            } else if (error.name === 'SequelizeTimeoutError') {
                throw new BadRequestException(`Таймаут операции: ${context}`);
            } else if (error.name === 'SequelizeDatabaseError') {
                throw new BadRequestException(`Ошибка базы данных: ${context}`);
            } else if (error.name === 'SequelizeLockError') {
                throw new BadRequestException(`Блокировка ресурса: ${context}`);
            } else if (error.name === 'SequelizeExclusionConstraintError') {
                throw new BadRequestException(
                    `Нарушение ограничения исключения: ${context}`,
                );
            }
        }
        throw error;
    }

    private ensureUserExists(
        user: UserModel | null,
        context: string = 'операция',
    ): UserModel {
        if (!user) {
            throw new NotFoundException(
                `Пользователь не найден для ${context}`,
            );
        }
        return user;
    }

    // Батчевые операции для массовых обновлений
    public async batchUpdateFlags(
        userIds: number[],
        updates: Partial<UpdateUserFlagsDto>,
    ): Promise<number> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) {
            throw new Error('Sequelize instance not available');
        }

        const transaction = await sequelize.transaction();
        try {
            const updateFields: string[] = [];
            const updateValues: (string | number | boolean | Date | null)[] =
                [];

            // Строим динамический запрос
            Object.entries(updates).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateFields.push(`\`${key}\` = ?`);
                    // Для сложных объектов используем JSON.stringify
                    const serializedValue =
                        typeof value === 'object' && value !== null
                            ? JSON.stringify(value)
                            : value;
                    updateValues.push(
                        serializedValue as
                            | string
                            | number
                            | boolean
                            | Date
                            | null,
                    );
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
                transaction,
            });

            // Затронутые пользователи обновлены

            await transaction.commit();
            return Array.isArray(affectedRows) ? affectedRows.length : 0;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    public async batchUpdatePreferences(
        userIds: number[],
        updates: Partial<UpdateUserPreferencesDto>,
    ): Promise<number> {
        const sequelize = this.userModel.sequelize;
        if (!sequelize) {
            throw new Error('Sequelize instance not available');
        }

        const transaction = await sequelize.transaction();
        try {
            const updateFields: string[] = [];
            const updateValues: (string | number | boolean | Date | null)[] =
                [];

            // Строим динамический запрос
            Object.entries(updates).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateFields.push(`\`${key}\` = ?`);
                    // Для сложных объектов используем JSON.stringify
                    const serializedValue =
                        typeof value === 'object' && value !== null
                            ? JSON.stringify(value)
                            : value;
                    updateValues.push(
                        serializedValue as
                            | string
                            | number
                            | boolean
                            | Date
                            | null,
                    );
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
                transaction,
            });

            // Затронутые пользователи обновлены

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
                allowedFields.password,
                UserRepository.BCRYPT_ROUNDS,
            );

            const user = await this.userModel.create({
                email: allowedFields.email,
                password: hashedPassword,
                firstName: allowedFields.firstName,
                lastName: allowedFields.lastName,
            });

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
        try {
            const updates: Partial<UserModel> = {} as Partial<UserModel>;
            if (dto.firstName !== undefined)
                updates.firstName = dto.firstName as unknown as string;
            if (dto.lastName !== undefined)
                updates.lastName = dto.lastName as unknown as string;

            await user.update(updates);

            return this.userModel
                .scope('withRoles')
                .findByPk(user.id) as Promise<UpdateUserResponse>;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'обновление профиля пользователя');
            throw error;
        }
    }

    //  Используем scope forAuth
    public async findUserForAuth(userId: number): Promise<UserModel | null> {
        return this.userModel.scope('forAuth').findByPk(userId);
    }

    // Используем scope withRoles
    public async findUser(id: number): Promise<GetUserResponse> {
        try {
            const user = (await this.userModel
                .scope('withRoles')
                .findByPk(id)) as GetUserResponse;

            return this.ensureUserExists(user, 'поиск пользователя');
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'поиск пользователя');
            throw error;
        }
    }

    // Используется в модуле Rating и Order
    public async findUserByPkId(userId: number): Promise<UserModel> {
        return this.userModel.findByPk(userId, {
            attributes: ['id', 'email'],
        }) as Promise<UserModel>;
    }

    /**
     * Поиск пользователя по ID с учётом tenant isolation
     * Оптимизация: один запрос вместо двух для tenant-scoped операций
     */
    public async findUserByIdAndTenant(
        userId: number,
        tenantId: number,
    ): Promise<UserModel | null> {
        return this.userModel.findOne({
            where: { id: userId, tenantId },
            attributes: [
                'id',
                'tenantId',
                'email',
                'phone', // Необходимо для отправки SMS verification кодов
            ],
        });
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

    public async findListUsersPaginated(
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
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
            // Проверяем существование пользователя
            const user = await this.userModel.findByPk(id, { transaction });
            this.ensureUserExists(user, 'удаление пользователя');

            // Логируем удаление пользователя
            console.log(`Удаление пользователя с ID: ${id}`);

            // Удаляем связанные записи в транзакции
            await sequelize.query(
                'DELETE FROM `user_role` WHERE `user_id` = ?',
                { replacements: [id], transaction },
            );

            const result = await this.userModel.destroy({
                where: { id },
                transaction,
            });

            await transaction.commit();
            console.log(`Пользователь с ID: ${id} успешно удален`);
            return result;
        } catch (error) {
            await transaction.rollback();
            console.error(
                `Ошибка при удалении пользователя с ID: ${id}:`,
                error,
            );
            this.handleSequelizeError(error, 'удаление пользователя');
            throw error;
        }
    }

    public async updatePhone(
        userId: number,
        phone: string,
    ): Promise<UserModel> {
        // Нормализуем номер телефона для сохранения в БД (E.164 формат)
        const normalizedPhone = this.normalizePhone(phone);
        await this.userModel.update(
            { phone: normalizedPhone },
            { where: { id: userId }, fields: ['phone'] },
        );
        return this.userModel.findByPk(userId, {
            attributes: ['id', 'email', 'phone'],
        }) as Promise<UserModel>;
    }

    public async updateDateOfBirth(
        userId: number,
        dateOfBirth: string,
    ): Promise<UserModel> {
        // Проверяем валидность даты
        const date = new Date(dateOfBirth);
        if (isNaN(date.getTime())) {
            throw new BadRequestException('Некорректный формат даты');
        }

        // Проверяем существование пользователя перед обновлением
        const existingUser = await this.userModel.findOne({
            where: { id: userId },
            attributes: ['id', 'email'],
        });

        if (!existingUser) {
            throw new NotFoundException('Пользователь не найден');
        }

        // Обновляем дату рождения (MySQL не поддерживает returning: true)
        // Sequelize-typescript автоматически конвертирует camelCase в snake_case для БД
        const [affectedRows] = await this.userModel.update(
            { dateOfBirth: date },
            {
                where: { id: userId },
                fields: ['dateOfBirth'],
            },
        );

        // Дополнительная проверка (на случай конкурентного доступа)
        if (affectedRows === 0) {
            throw new NotFoundException('Пользователь не найден');
        }

        // Возвращаем обновленную запись (оптимизированный запрос только нужных полей)
        const updatedUser = await this.userModel.findByPk(userId, {
            attributes: ['id', 'email', 'dateOfBirth'],
        });

        if (!updatedUser) {
            throw new NotFoundException(
                'Пользователь не найден после обновления',
            );
        }

        return updatedUser;
    }

    public async updateConsents(
        userId: number,
        dto: UpdateConsentsDto,
    ): Promise<UserModel> {
        try {
            // Проверяем существование пользователя перед обновлением
            const existingUser = await this.userModel.findOne({
                where: { id: userId },
                attributes: ['id', 'email'],
            });

            if (!existingUser) {
                throw new NotFoundException('Пользователь не найден');
            }

            // Формируем объект обновлений только для consent полей
            const updates: Partial<UserModel> = {};

            if (dto.isNewsletterSubscribed !== undefined) {
                updates.isNewsletterSubscribed = dto.isNewsletterSubscribed;
            }
            if (dto.isMarketingConsent !== undefined) {
                updates.isMarketingConsent = dto.isMarketingConsent;
            }
            if (dto.isCookieConsent !== undefined) {
                updates.isCookieConsent = dto.isCookieConsent;
            }

            // Если нет изменений, возвращаем текущего пользователя
            if (Object.keys(updates).length === 0) {
                const user = await this.userModel.findByPk(userId, {
                    attributes: [
                        'id',
                        'email',
                        'isNewsletterSubscribed',
                        'isMarketingConsent',
                        'isCookieConsent',
                    ],
                });
                if (!user) {
                    throw new NotFoundException('Пользователь не найден');
                }
                return user;
            }

            // Обновляем только consent поля
            const [affectedRows] = await this.userModel.update(updates, {
                where: { id: userId },
                fields: [
                    'isNewsletterSubscribed',
                    'isMarketingConsent',
                    'isCookieConsent',
                ],
            });

            // Дополнительная проверка (на случай конкурентного доступа)
            if (affectedRows === 0) {
                throw new NotFoundException('Пользователь не найден');
            }

            // Возвращаем обновленную запись (оптимизированный запрос только нужных полей)
            const updatedUser = await this.userModel.findByPk(userId, {
                attributes: [
                    'id',
                    'email',
                    'isNewsletterSubscribed',
                    'isMarketingConsent',
                    'isCookieConsent',
                ],
            });

            if (!updatedUser) {
                throw new NotFoundException(
                    'Пользователь не найден после обновления',
                );
            }

            return updatedUser;
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'обновление согласий пользователя',
            );
            throw error;
        }
    }

    public async updateUserStatus(
        userId: number,
        dto: UpdateUserStatusDto,
        tenantId: number,
    ): Promise<UserModel> {
        try {
            // Проверяем существование пользователя С УЧЁТОМ TENANT
            const user = await this.userModel.findOne({
                where: { id: userId, tenantId },
            });
            if (!user) {
                throw new NotFoundException(
                    `Пользователь с ID ${userId} не найден или не принадлежит вашему tenant`,
                );
            }

            // Формируем объект обновлений только для переданных полей
            // TODO: Статусные поля (isVipCustomer, isPremium, isBetaTester) были удалены миграцией 20251015135614
            // Этот метод требует рефакторинга для работы с новой моделью ролей/подписок
            throw new Error(
                'updateUserStatus временно недоступен - поля isVipCustomer/isPremium/isBetaTester удалены из модели',
            );
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'обновление статусных флагов пользователя',
            );
            throw error;
        }
    }

    /**
     * Нормализует номер телефона для сохранения в БД (E.164 формат)
     * - Удаляет пробелы, дефисы, скобки
     * - Российские номера (8 или 7) приводятся к формату +7
     * - Международные номера сохраняются с префиксом +
     */
    private normalizePhone(phone: string): string {
        // Удаляем все нецифровые символы кроме +
        const cleanPhone = phone.replace(/[^\d+]/g, '');

        // Используем утилиту для проверки и нормализации российских номеров
        const normalizedRussian = normalizeRussianPhone(cleanPhone);
        if (normalizedRussian !== cleanPhone) {
            // Номер был нормализован (российский формат)
            return normalizedRussian;
        }

        // Если уже начинается с +, возвращаем как есть
        if (cleanPhone.startsWith('+')) {
            return cleanPhone;
        }

        // Если не российский и нет +, добавляем +
        return `+${cleanPhone}`;
    }

    public async updateFlags(
        userId: number,
        dto: UpdateUserFlagsDto,
    ): Promise<UserModel | null> {
        try {
            // Оптимизированное обновление: прямое обновление без предварительного поиска
            const updates: Partial<UserModel> = {};

            // Добавляем только измененные поля
            if (dto.isActive !== undefined) updates.isActive = dto.isActive;
            if (dto.isNewsletterSubscribed !== undefined)
                updates.isNewsletterSubscribed = dto.isNewsletterSubscribed;
            if (dto.isMarketingConsent !== undefined)
                updates.isMarketingConsent = dto.isMarketingConsent;
            if (dto.isCookieConsent !== undefined)
                updates.isCookieConsent = dto.isCookieConsent;
            if (dto.isProfileCompleted !== undefined)
                updates.isProfileCompleted = dto.isProfileCompleted;
            if (dto.isBlocked !== undefined) updates.isBlocked = dto.isBlocked;
            if (dto.isVerified !== undefined)
                updates.isVerified = dto.isVerified;
            if (dto.isEmailVerified !== undefined)
                updates.isEmailVerified = dto.isEmailVerified;
            if (dto.isPhoneVerified !== undefined)
                updates.isPhoneVerified = dto.isPhoneVerified;
            if (dto.isTermsAccepted !== undefined)
                updates.isTermsAccepted = dto.isTermsAccepted;
            if (dto.isPrivacyAccepted !== undefined)
                updates.isPrivacyAccepted = dto.isPrivacyAccepted;
            if (dto.isAgeVerified !== undefined)
                updates.isAgeVerified = dto.isAgeVerified;
            if (dto.isTwoFactorEnabled !== undefined)
                updates.isTwoFactorEnabled = dto.isTwoFactorEnabled;

            if (Object.keys(updates).length === 0) {
                // Если нет изменений, возвращаем пользователя
                return this.userModel.findByPk(userId);
            }

            // Прямое обновление с возвратом обновленной записи
            const [affectedRows] = await this.userModel.update(updates, {
                where: { id: userId },
            });

            return affectedRows > 0 ? this.userModel.findByPk(userId) : null;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'обновление флагов пользователя');
            throw error;
        }
    }

    public async updatePreferences(
        userId: number,
        dto: UpdateUserPreferencesDto,
    ): Promise<UserModel | null> {
        try {
            // Оптимизированное обновление: прямое обновление без предварительного поиска
            const updates: Partial<UserModel> = {};

            // Добавляем только измененные поля
            if (dto.themePreference !== undefined)
                updates.themePreference = dto.themePreference;
            if (dto.defaultLanguage !== undefined)
                updates.defaultLanguage = dto.defaultLanguage;
            if (dto.notificationPreferences !== undefined)
                updates.notificationPreferences = dto.notificationPreferences;
            if (dto.translations !== undefined)
                updates.translations = dto.translations;

            if (Object.keys(updates).length === 0) {
                // Если нет изменений, возвращаем пользователя
                return this.userModel.findByPk(userId);
            }

            // Прямое обновление с возвратом обновленной записи
            const [affectedRows] = await this.userModel.update(updates, {
                where: { id: userId },
            });

            return affectedRows > 0 ? this.userModel.findByPk(userId) : null;
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'обновление предпочтений пользователя',
            );
            throw error;
        }
    }

    public async verifyEmail(
        userId: number,
        tenantId: number,
    ): Promise<UserModel | null> {
        // Обновление с проверкой tenant isolation
        const [affectedRows] = await this.userModel.update(
            { isEmailVerified: true, emailVerifiedAt: new Date() },
            { where: { id: userId, tenantId } },
        );
        return affectedRows > 0 ? this.userModel.findByPk(userId) : null;
    }

    public async verifyPhone(
        userId: number,
        tenantId: number,
    ): Promise<UserModel | null> {
        // Обновление с проверкой tenant isolation
        const [affectedRows] = await this.userModel.update(
            { isPhoneVerified: true, phoneVerifiedAt: new Date() },
            { where: { id: userId, tenantId } },
        );
        return affectedRows > 0 ? this.userModel.findByPk(userId) : null;
    }

    // Универсальный метод для административных операций
    private async performAdminAction(
        userId: number,
        updates: Partial<UserModel>,
        actionName: string,
    ): Promise<UserModel | null> {
        try {
            const user = await this.userModel.findByPk(userId);
            const existingUser = this.ensureUserExists(user, actionName);

            await existingUser.update(updates);
            return existingUser;
        } catch (error: unknown) {
            this.handleSequelizeError(error, actionName);
            throw error;
        }
    }

    // Admin actions
    public async blockUser(userId: number): Promise<UserModel | null> {
        return this.performAdminAction(
            userId,
            { isBlocked: true, isActive: false },
            'блокировка пользователя',
        );
    }

    public async unblockUser(userId: number): Promise<UserModel | null> {
        return this.performAdminAction(
            userId,
            { isBlocked: false, isActive: true },
            'разблокировка пользователя',
        );
    }

    public async suspendUser(userId: number): Promise<UserModel | null> {
        return this.performAdminAction(
            userId,
            { isSuspended: true, isActive: false },
            'приостановка пользователя',
        );
    }

    public async unsuspendUser(userId: number): Promise<UserModel | null> {
        return this.performAdminAction(
            userId,
            { isSuspended: false, isActive: true },
            'восстановление пользователя',
        );
    }

    public async softDeleteUser(userId: number): Promise<UserModel | null> {
        return this.performAdminAction(
            userId,
            { isDeleted: true, isActive: false },
            'мягкое удаление пользователя',
        );
    }

    public async restoreUser(userId: number): Promise<UserModel | null> {
        return this.performAdminAction(
            userId,
            { isDeleted: false, isActive: true },
            'восстановление удаленного пользователя',
        );
    }

    // ===== Verification codes =====
    private hashCode(code: string): string {
        return createHash('sha256').update(code).digest('hex');
    }

    /**
     * Создаёт новый код верификации и отправляет его пользователю.
     *
     * Генерирует случайный 6-символьный hex код, сохраняет хэш (bcrypt) в БД,
     * отправляет plain-text код через email или SMS провайдер.
     * Включает tenant isolation, cooldown check (60 сек) и проверку наличия телефона.
     *
     * @param {number} userId - ID пользователя
     * @param {'email' | 'phone'} channel - Канал отправки
     * @param {number} tenantId - ID тенанта
     *
     * @throws {NotFoundException} Пользователь не найден или не принадлежит tenant
     * @throws {BadRequestException} Cooldown период не истёк или номер телефона отсутствует
     * @throws {Error} Провайдер email/SMS вернул ошибку
     *
     * @returns {Promise<void>}
     * @private Вызывается только из UserService
     */
    public async requestVerificationCode(
        userId: number,
        channel: 'email' | 'phone',
        tenantId: number,
    ): Promise<void> {
        try {
            // Tenant isolation: проверяем, что пользователь принадлежит тенанту
            const user = await this.findUserByIdAndTenant(userId, tenantId);
            if (!user) {
                throw new NotFoundException(
                    `Пользователь с ID ${userId} не найден или не принадлежит вашему tenant`,
                );
            }

            const sequelize = this.userModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            // Cooldown check: проверяем время последнего запроса кода
            const [lastCodeResult] = await sequelize.query<{
                created_at: Date;
            }>(
                'SELECT `created_at` FROM `user_verification_code` WHERE `user_id` = ? AND `channel` = ? ORDER BY `created_at` DESC LIMIT 1',
                {
                    replacements: [userId, channel],
                    type: QueryTypes.SELECT,
                },
            );

            if (lastCodeResult) {
                const timeSinceLastRequest =
                    Date.now() - new Date(lastCodeResult.created_at).getTime();

                if (timeSinceLastRequest < VERIFICATION_CODE_COOLDOWN_MS) {
                    const remainingSeconds = Math.ceil(
                        (VERIFICATION_CODE_COOLDOWN_MS - timeSinceLastRequest) /
                            1000,
                    );

                    this.logger.warn({
                        message: 'Cooldown период не истёк',
                        userId,
                        channel,
                        tenantId,
                        timeSinceLastRequestMs: timeSinceLastRequest,
                        remainingSeconds,
                    });

                    throw new BadRequestException(
                        `Пожалуйста, подождите ${remainingSeconds} секунд перед повторным запросом кода`,
                    );
                }
            }

            // Генерируем 6-значный цифровой код (100000-999999)
            const codeNumber = 100000 + Math.floor(Math.random() * 900000);
            const code = codeNumber.toString();
            const codeHash = this.hashCode(code);
            const expiresAt = new Date(
                Date.now() + VERIFICATION_CODE_EXPIRY_MS,
            );

            await sequelize.query(
                'INSERT INTO `user_verification_code` (`user_id`,`channel`,`code_hash`,`expires_at`,`attempts`,`created_at`,`updated_at`) VALUES (?,?,?,?,0,?,?)',
                {
                    replacements: [
                        userId,
                        channel,
                        codeHash,
                        expiresAt,
                        new Date(),
                        new Date(),
                    ],
                },
            );

            // Отправка кода через email/SMS
            if (channel === 'email') {
                const emailResult = await this.emailProvider.sendEmail({
                    to: user.email,
                    subject: 'Код подтверждения email',
                    text: `Ваш код подтверждения: ${code}\n\nКод действителен 10 минут.\n\nЕсли вы не запрашивали этот код, проигнорируйте это письмо.`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Код подтверждения email</h2>
                            <p>Ваш код подтверждения:</p>
                            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
                                ${code}
                            </div>
                            <p style="color: #666;">Код действителен <strong>10 минут</strong>.</p>
                            <p style="color: #999; font-size: 12px;">Если вы не запрашивали этот код, проигнорируйте это письмо.</p>
                        </div>
                    `,
                });

                if (!emailResult.success) {
                    this.logger.error(
                        `Не удалось отправить email: ${emailResult.error}`,
                        { userId, channel, tenantId },
                    );
                    throw new BadRequestException(
                        'Не удалось отправить код подтверждения. Попробуйте позже',
                    );
                }
            } else {
                if (!user.phone) {
                    throw new BadRequestException(
                        'Номер телефона не указан в профиле',
                    );
                }

                const smsResult = await this.smsProvider.sendSms({
                    to: user.phone,
                    message: `Ваш код подтверждения: ${code}. Код действителен 10 минут.`,
                });

                if (!smsResult.success) {
                    this.logger.error(
                        `Не удалось отправить SMS: ${smsResult.error}`,
                        { userId, channel, tenantId },
                    );
                    throw new BadRequestException(
                        'Не удалось отправить код подтверждения. Попробуйте позже',
                    );
                }
            }

            // Audit logging: логируем успешную отправку кода
            this.logger.log({
                event:
                    channel === 'email'
                        ? 'email_verification_code_sent'
                        : 'phone_verification_code_sent',
                userId,
                channel,
                tenantId,
                expiresAt: expiresAt.toISOString(),
                message: `Код верификации отправлен пользователю ${userId} через ${channel}`,
            });
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'запрос кода верификации');
            throw error;
        }
    }

    /**
     * Проверяет и подтверждает код верификации.
     *
     * Выполняет проверки: tenant isolation, срок действия (10 мин), количество попыток (макс. 5),
     * корректность кода (SHA256 hash comparison). При успехе обновляет is_email_verified/is_phone_verified
     * и verified_at timestamp. Логирует успехи и ошибки для security monitoring.
     *
     * @param {number} userId - ID пользователя
     * @param {'email' | 'phone'} channel - Канал верификации
     * @param {string} code - Введённый код (plain-text, 6 hex символов)
     * @param {number} tenantId - ID тенанта
     *
     * @returns {Promise<boolean>} true если код подтверждён, false если неверный/истёкший/превышены попытки
     * @private Вызывается только из UserService
     */
    public async confirmVerificationCode(
        userId: number,
        channel: 'email' | 'phone',
        code: string,
        tenantId: number,
    ): Promise<boolean> {
        try {
            // Tenant isolation: проверяем, что пользователь принадлежит тенанту
            const user = await this.findUserByIdAndTenant(userId, tenantId);
            if (!user) {
                // Возвращаем false вместо исключения для единообразия с другими fail-кейсами
                return false;
            }

            const sequelize = this.userModel.sequelize;
            if (!sequelize) {
                return false;
            }

            const [[row]] = await sequelize.query(
                'SELECT `id`,`code_hash`,`expires_at`,`attempts` FROM `user_verification_code` WHERE `user_id` = ? AND `channel` = ? ORDER BY `created_at` DESC LIMIT 1',
                { replacements: [userId, channel] },
            );

            // rows can be RowDataPacket[]
            if (!row) return false;

            const {
                id,
                code_hash: storedHash,
                expires_at: expiresAt,
                attempts,
            } = row as {
                id: number;
                code_hash: string;
                expires_at: string | Date;
                attempts: number;
            };

            const now = new Date();
            const isExpired = new Date(expiresAt) < now;
            const maxAttemptsReached =
                attempts >= VERIFICATION_CODE_MAX_ATTEMPTS;

            if (isExpired || maxAttemptsReached) {
                this.logger.warn({
                    message: 'Неудачная попытка верификации',
                    userId,
                    channel,
                    tenantId,
                    isExpired,
                    maxAttemptsReached,
                    attempts,
                });
                return false;
            }

            const ok = this.hashCode(code) === storedHash;

            // Увеличиваем счётчик попыток
            await sequelize.query(
                'UPDATE `user_verification_code` SET `attempts` = `attempts` + 1, `updated_at` = ? WHERE `id` = ? LIMIT 1',
                { replacements: [now, id] },
            );

            if (!ok) {
                this.logger.warn({
                    message: 'Неверный код верификации',
                    userId,
                    channel,
                    tenantId,
                    attempts: attempts + 1,
                });
                return false;
            }

            // Обновляем статус верификации с учётом tenant_id для дополнительной защиты
            if (channel === 'email') {
                await sequelize.query(
                    'UPDATE `user` SET `is_email_verified` = 1, `email_verified_at` = ?, `updated_at` = ? WHERE `id` = ? AND `tenant_id` = ? LIMIT 1',
                    { replacements: [now, now, userId, tenantId] },
                );
            } else {
                await sequelize.query(
                    'UPDATE `user` SET `is_phone_verified` = 1, `phone_verified_at` = ?, `updated_at` = ? WHERE `id` = ? AND `tenant_id` = ? LIMIT 1',
                    { replacements: [now, now, userId, tenantId] },
                );
            }

            // Audit logging: логируем успешную верификацию
            this.logger.log({
                event:
                    channel === 'email' ? 'email_verified' : 'phone_verified',
                userId,
                channel,
                tenantId,
                timestamp: now.toISOString(),
                message: `Пользователь ${userId} успешно подтвердил ${channel}`,
            });

            return true;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'подтверждение кода верификации');
            return false;
        }
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
        try {
            const sequelize = this.userModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            const startTime = Date.now();
            console.log('Запрос статистики пользователей...');

            // Оптимизированный запрос: универсальные метрики для любого типа бизнеса
            const [results] = await sequelize.query(`
                SELECT
                    COUNT(*) as totalUsers,
                    SUM(CASE WHEN is_active = 1 AND is_blocked = 0 AND is_deleted = 0 THEN 1 ELSE 0 END) as activeUsers,
                    SUM(CASE WHEN is_blocked = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as blockedUsers,
                    SUM(CASE WHEN is_newsletter_subscribed = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as newsletterSubscribers
                FROM user
                WHERE is_deleted = 0
            `);

            const executionTime = Date.now() - startTime;
            console.log(
                `Статистика пользователей получена за ${executionTime}ms`,
            );

            const stats = (
                results as Array<{
                    totalUsers: number;
                    activeUsers: number;
                    blockedUsers: number;
                    newsletterSubscribers: number;
                }>
            )[0];

            return {
                totalUsers: Number(stats.totalUsers) || 0,
                activeUsers: Number(stats.activeUsers) || 0,
                blockedUsers: Number(stats.blockedUsers) || 0,
                newsletterSubscribers: Number(stats.newsletterSubscribers) || 0,
            };
        } catch (error: unknown) {
            console.error(
                'Ошибка при получении статистики пользователей:',
                error,
            );
            this.handleSequelizeError(
                error,
                'получение статистики пользователей',
            );
            throw error;
        }
    }
}
