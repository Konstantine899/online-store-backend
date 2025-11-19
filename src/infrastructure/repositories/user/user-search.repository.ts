import { UserModel } from '@app/domain/models';
import { TenantContext } from '@app/infrastructure/common/context';
import { MetaData } from '@app/infrastructure/paginate';
import { GetPaginatedUsersResponse } from '@app/infrastructure/responses';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';

/**
 * UserSearchRepository
 * Репозиторий для специализированных операций поиска пользователей
 *
 * Методы:
 * - searchUsersByName: поиск по имени/фамилии с пагинацией
 * - findUserByPhone: поиск по точному номеру телефона
 * - searchUsersByPhone: поиск по префиксу телефона (autocomplete)
 * - fullTextSearchUsers: полнотекстовый поиск по всем полям
 * - findInactiveUsers: поиск неактивных пользователей (не логинились N дней)
 * - findUsersWithIncompleteProfile: пользователи с незаполненным профилем
 * - findUsersByDateRange: поиск по диапазону дат (createdAt/lastLoginAt)
 */
@Injectable()
export class UserSearchRepository {
    private readonly logger = new Logger(UserSearchRepository.name);

    constructor(
        @InjectModel(UserModel) private userModel: typeof UserModel,
        private readonly tenantContext: TenantContext,
    ) {}

    /**
     * Получить tenantId с поддержкой test режима
     * @private
     */
    private getTenantIdSafe(): number {
        return process.env.NODE_ENV === 'test'
            ? (this.tenantContext.getTenantIdOrNull() ?? 1)
            : this.tenantContext.getTenantId();
    }

    /**
     * Централизованная обработка ошибок Sequelize
     * @private
     */
    private handleSequelizeError(error: unknown, context: string): void {
        if (error instanceof Error) {
            const errorInfo = {
                name: error.name,
                message: error.message,
                context,
                timestamp: new Date().toISOString(),
            };
            this.logger.error(
                errorInfo,
                `Ошибка Sequelize в контексте: ${context}`,
            );
        }
    }

    /**
     * Поиск пользователей по имени/фамилии с пагинацией
     * @param searchTerm - строка для поиска (поиск по первому и последнему имени)
     * @param page - номер страницы
     * @param limit - размер страницы
     * @returns Promise<GetPaginatedUsersResponse>
     * @description SQL injection защита: экранирование LIKE спецсимволов (%, _)
     */
    public async searchUsersByName(
        searchTerm: string,
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        try {
            // Защита: trim на уровне Repository
            searchTerm = searchTerm.trim();

            const tenantId = this.getTenantIdSafe();

            const offset = (page - 1) * limit;
            // Защита: экранируем LIKE спецсимволы (% и _) для предотвращения SQL injection
            const escapedTerm = searchTerm.replace(/[%_]/g, '\\$&');
            const searchPattern = `%${escapedTerm}%`;

            const result = await this.userModel.findAndCountAll({
                where: {
                    tenantId,
                    isDeleted: false,
                    [Op.or]: [
                        { firstName: { [Op.like]: searchPattern } },
                        { lastName: { [Op.like]: searchPattern } },
                    ],
                },
                attributes: { exclude: ['password'] },
                limit,
                offset,
                order: [
                    ['firstName', 'ASC'],
                    ['lastName', 'ASC'],
                ],
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

            return { data: result.rows, meta };
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'поиск пользователей по имени');
            throw error;
        }
    }

    /**
     * Найти пользователя по точному номеру телефона
     * @param phone - полный номер телефона (например: "+79991234567")
     * @returns пользователь или null если не найден
     */
    public async findUserByPhone(phone: string): Promise<UserModel | null> {
        try {
            // Защита: trim на уровне Repository
            phone = phone.trim();

            const tenantId = this.getTenantIdSafe();

            const user = await this.userModel.findOne({
                where: {
                    tenantId,
                    phone,
                    isDeleted: false,
                },
                attributes: { exclude: ['password'] },
            });

            return user;
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'поиск пользователя по телефону');
            throw error;
        }
    }

    /**
     * Поиск пользователей по префиксу телефона (для autocomplete)
     * @param phonePrefix - префикс номера телефона (например: "+7999", "7999", "999")
     * @returns массив пользователей, отсортированных по номеру телефона (максимум 20 результатов)
     * @description Нормализует префикс (убирает всё кроме цифр) для универсального поиска
     */
    public async searchUsersByPhone(phonePrefix: string): Promise<UserModel[]> {
        try {
            // Защита: trim на уровне Repository
            phonePrefix = phonePrefix.trim();

            const tenantId = this.getTenantIdSafe();

            // Нормализация: убираем всё кроме цифр для универсального поиска
            // Это позволит найти "+79991234567" при поиске по "7999" или "+7999"
            const normalizedPrefix = phonePrefix.replace(/\D/g, '');

            const users = await this.userModel.findAll({
                where: {
                    tenantId,
                    phone: { [Op.like]: `%${normalizedPrefix}%` },
                    isDeleted: false,
                },
                attributes: { exclude: ['password'] },
                limit: 20, // Ограничение для автодополнения
                order: [['phone', 'ASC']],
            });

            return users;
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'поиск пользователей по префиксу телефона',
            );
            throw error;
        }
    }

    /**
     * Полнотекстовый поиск пользователей по email, имени, фамилии и телефону
     * @param query - строка поиска
     * @param page - номер страницы
     * @param limit - размер страницы
     * @returns Promise<GetPaginatedUsersResponse>
     * @description SQL injection защита: экранирование LIKE спецсимволов (%, _)
     */
    public async fullTextSearchUsers(
        query: string,
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        try {
            // Защита: trim на уровне Repository
            query = query.trim();

            const tenantId = this.getTenantIdSafe();

            const offset = (page - 1) * limit;
            // Защита: экранируем LIKE спецсимволы (% и _) для предотвращения SQL injection
            const escapedQuery = query.replace(/[%_]/g, '\\$&');
            const searchPattern = `%${escapedQuery}%`;

            const result = await this.userModel.findAndCountAll({
                where: {
                    tenantId,
                    isDeleted: false,
                    [Op.or]: [
                        { email: { [Op.like]: searchPattern } },
                        { firstName: { [Op.like]: searchPattern } },
                        { lastName: { [Op.like]: searchPattern } },
                        { phone: { [Op.like]: searchPattern } },
                    ],
                },
                attributes: { exclude: ['password'] },
                limit,
                offset,
                order: [
                    ['firstName', 'ASC'],
                    ['lastName', 'ASC'],
                ],
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

            return { data: result.rows, meta };
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'полнотекстовый поиск пользователей',
            );
            throw error;
        }
    }

    /**
     * Поиск неактивных пользователей (не логинились N дней)
     * @param days - количество дней неактивности
     * @param page - номер страницы
     * @param limit - размер страницы
     * @returns Promise<GetPaginatedUsersResponse>
     * @description Находит пользователей с lastLoginAt старше N дней или NULL
     */
    public async findInactiveUsers(
        days: number,
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        try {
            const tenantId = this.getTenantIdSafe();

            const offset = (page - 1) * limit;

            // Вычисляем дату N дней назад
            const inactiveSince = new Date();
            inactiveSince.setDate(inactiveSince.getDate() - days);

            const result = await this.userModel.findAndCountAll({
                where: {
                    tenantId,
                    isDeleted: false,
                    [Op.or]: [
                        { lastLoginAt: { [Op.lt]: inactiveSince } },
                        { lastLoginAt: null },
                    ],
                },
                attributes: { exclude: ['password'] },
                order: [
                    Sequelize.literal(
                        'last_login_at IS NULL DESC, last_login_at ASC',
                    ),
                ], // NULL первыми, затем старые
                limit,
                offset,
            });

            const totalCount = result.count;
            const lastPage = Math.ceil(totalCount / limit);
            const nextPage = page < lastPage ? page + 1 : 0;
            const previousPage = page > 1 ? page - 1 : 0;

            this.logger.log(
                { days, page, limit, totalCount, tenantId },
                `Найдено ${totalCount} неактивных пользователей (${days} дней)`,
            );

            const meta: MetaData = {
                totalCount,
                lastPage,
                currentPage: page,
                nextPage,
                previousPage,
                limit,
            };

            return {
                data: result.rows,
                meta,
            };
        } catch (error: unknown) {
            this.handleSequelizeError(error, 'поиск неактивных пользователей');
            throw error;
        }
    }

    /**
     * Поиск пользователей с неполным профилем
     * @param page - номер страницы
     * @param limit - размер страницы
     * @returns Promise<GetPaginatedUsersResponse>
     * @description Находит пользователей с isProfileCompleted = false
     */
    public async findUsersWithIncompleteProfile(
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        try {
            const tenantId = this.getTenantIdSafe();

            const offset = (page - 1) * limit;

            const result = await this.userModel.findAndCountAll({
                where: {
                    tenantId,
                    isDeleted: false,
                    isProfileCompleted: false,
                },
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']],
                limit,
                offset,
            });

            const totalCount = result.count;
            const lastPage = Math.ceil(totalCount / limit);
            const nextPage = page < lastPage ? page + 1 : 0;
            const previousPage = page > 1 ? page - 1 : 0;

            this.logger.log(
                { page, limit, totalCount, tenantId },
                `Найдено ${totalCount} пользователей с неполным профилем`,
            );

            const meta: MetaData = {
                totalCount,
                lastPage,
                currentPage: page,
                nextPage,
                previousPage,
                limit,
            };

            return {
                data: result.rows,
                meta,
            };
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
     * @param page - номер страницы
     * @param limit - размер страницы
     * @returns Promise<GetPaginatedUsersResponse>
     * @description Находит пользователей, у которых указанное поле попадает в диапазон дат
     */
    public async findUsersByDateRange(
        field: 'createdAt' | 'lastLoginAt',
        startDate: Date,
        endDate: Date,
        page: number,
        limit: number,
    ): Promise<GetPaginatedUsersResponse> {
        try {
            const tenantId = this.getTenantIdSafe();

            const offset = (page - 1) * limit;

            const result = await this.userModel.findAndCountAll({
                where: {
                    tenantId,
                    isDeleted: false,
                    [field]: {
                        [Op.between]: [startDate, endDate],
                    },
                },
                attributes: { exclude: ['password'] },
                order: [[field, 'DESC']],
                limit,
                offset,
            });

            const totalCount = result.count;
            const lastPage = Math.ceil(totalCount / limit);
            const nextPage = page < lastPage ? page + 1 : 0;
            const previousPage = page > 1 ? page - 1 : 0;

            this.logger.log(
                {
                    field,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    page,
                    limit,
                    totalCount,
                    tenantId,
                },
                `Найдено ${totalCount} пользователей по диапазону дат (${field})`,
            );

            const meta: MetaData = {
                totalCount,
                lastPage,
                currentPage: page,
                nextPage,
                previousPage,
                limit,
            };

            return {
                data: result.rows,
                meta,
            };
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'поиск пользователей по диапазону дат',
            );
            throw error;
        }
    }
}
