import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import {
    AuditLogModel,
    AuditAction,
    IAuditLogCreationAttributes,
} from '@app/domain/models';

/**
 * Интерфейс для фильтрации audit логов
 */
export interface IAuditFilters {
    action?: AuditAction;
    entityType?: string;
    entityId?: number;
    userId?: number;
    tenantId?: number;
    startDate?: Date;
    endDate?: Date;
    requestId?: string;
}

/**
 * Интерфейс для пагинированных результатов
 */
export interface IPaginatedAuditLogs {
    data: AuditLogModel[];
    totalCount: number;
    currentPage: number;
    lastPage: number;
    limit: number;
}

/**
 * Базовый сервис для работы с audit логами
 * Предоставляет методы для создания и поиска записей аудита
 */
@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectModel(AuditLogModel)
        private readonly auditLogModel: typeof AuditLogModel,
    ) {}

    /**
     * Создать запись в audit логе
     * @param data - данные для создания лога
     * @returns Promise<AuditLogModel>
     */
    async createLog(
        data: IAuditLogCreationAttributes,
    ): Promise<AuditLogModel> {
        try {
            const auditLog = await this.auditLogModel.create(data);

            this.logger.log({
                auditLogId: auditLog.id,
                entityType: data.entityType,
                entityId: data.entityId,
                action: data.action,
                userId: data.userId,
                tenantId: data.tenantId,
                requestId: data.requestId,
                message: 'Audit log created successfully',
            });

            return auditLog;
        } catch (error) {
            this.logger.error({
                error: error instanceof Error ? error.message : String(error),
                data,
                message: 'Failed to create audit log',
            });
            throw error;
        }
    }

    /**
     * Получить все audit логи с пагинацией и фильтрацией
     * @param page - номер страницы (начиная с 1)
     * @param limit - количество записей на странице
     * @param filters - фильтры для поиска
     * @returns Promise<IPaginatedAuditLogs>
     */
    async findAll(
        page: number = 1,
        limit: number = 20,
        filters?: IAuditFilters,
    ): Promise<IPaginatedAuditLogs> {
        const offset = (page - 1) * limit;
        const where = this.buildWhereClause(filters);

        const { rows: data, count: totalCount } =
            await this.auditLogModel.findAndCountAll({
                where,
                limit,
                offset,
                order: [['created_at', 'DESC']],
                include: [
                    {
                        association: 'user',
                        attributes: ['id', 'firstName', 'lastName', 'email'],
                    },
                ],
            });

        const lastPage = Math.ceil(totalCount / limit);

        this.logger.log({
            page,
            limit,
            totalCount,
            filters,
            message: 'Audit logs retrieved successfully',
        });

        return {
            data,
            totalCount,
            currentPage: page,
            lastPage,
            limit,
        };
    }

    /**
     * Получить audit лог по ID
     * @param id - ID лога
     * @returns Promise<AuditLogModel | null>
     */
    async findById(id: number): Promise<AuditLogModel | null> {
        const auditLog = await this.auditLogModel.findByPk(id, {
            include: [
                {
                    association: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                },
            ],
        });

        if (auditLog) {
            this.logger.log({
                auditLogId: id,
                message: 'Audit log found',
            });
        } else {
            this.logger.warn({
                auditLogId: id,
                message: 'Audit log not found',
            });
        }

        return auditLog;
    }

    /**
     * Получить audit логи для конкретной сущности
     * @param entityType - тип сущности (role, user_role, role_permission)
     * @param entityId - ID сущности
     * @param page - номер страницы
     * @param limit - количество записей на странице
     * @returns Promise<IPaginatedAuditLogs>
     */
    async findByEntity(
        entityType: string,
        entityId: number,
        page: number = 1,
        limit: number = 20,
    ): Promise<IPaginatedAuditLogs> {
        return this.findAll(page, limit, { entityType, entityId });
    }

    /**
     * Получить audit логи для конкретного пользователя
     * @param userId - ID пользователя
     * @param page - номер страницы
     * @param limit - количество записей на странице
     * @param filters - дополнительные фильтры
     * @returns Promise<IPaginatedAuditLogs>
     */
    async findByUser(
        userId: number,
        page: number = 1,
        limit: number = 20,
        filters?: Omit<IAuditFilters, 'userId'>,
    ): Promise<IPaginatedAuditLogs> {
        return this.findAll(page, limit, { ...filters, userId });
    }

    /**
     * Получить audit логи по типу действия
     * @param action - тип действия
     * @param page - номер страницы
     * @param limit - количество записей на странице
     * @param filters - дополнительные фильтры
     * @returns Promise<IPaginatedAuditLogs>
     */
    async findByAction(
        action: AuditAction,
        page: number = 1,
        limit: number = 20,
        filters?: Omit<IAuditFilters, 'action'>,
    ): Promise<IPaginatedAuditLogs> {
        return this.findAll(page, limit, { ...filters, action });
    }

    /**
     * Получить audit логи за указанный период
     * @param startDate - начальная дата
     * @param endDate - конечная дата
     * @param page - номер страницы
     * @param limit - количество записей на странице
     * @param filters - дополнительные фильтры
     * @returns Promise<IPaginatedAuditLogs>
     */
    async findByDateRange(
        startDate: Date,
        endDate: Date,
        page: number = 1,
        limit: number = 20,
        filters?: Omit<IAuditFilters, 'startDate' | 'endDate'>,
    ): Promise<IPaginatedAuditLogs> {
        return this.findAll(page, limit, {
            ...filters,
            startDate,
            endDate,
        });
    }

    /**
     * Получить количество audit логов по фильтрам
     * @param filters - фильтры для подсчета
     * @returns Promise<number>
     */
    async count(filters?: IAuditFilters): Promise<number> {
        const where = this.buildWhereClause(filters);
        return this.auditLogModel.count({ where });
    }

    /**
     * Удалить старые audit логи (для retention policy)
     * @param beforeDate - удалить логи старше этой даты
     * @returns Promise<number> - количество удаленных записей
     */
    async deleteOldLogs(beforeDate: Date): Promise<number> {
        const deletedCount = await this.auditLogModel.destroy({
            where: {
                createdAt: {
                    [Op.lt]: beforeDate,
                },
            },
        });

        this.logger.log({
            deletedCount,
            beforeDate: beforeDate.toISOString(),
            message: 'Old audit logs deleted',
        });

        return deletedCount;
    }

    /**
     * Построить WHERE условие для Sequelize на основе фильтров
     * @param filters - фильтры
     * @returns WhereOptions
     */
    private buildWhereClause(
        filters?: IAuditFilters,
    ): WhereOptions<AuditLogModel> {
        const where: WhereOptions<AuditLogModel> = {};

        if (!filters) {
            return where;
        }

        if (filters.action) {
            where.action = filters.action;
        }

        if (filters.entityType) {
            where.entityType = filters.entityType;
        }

        if (filters.entityId !== undefined) {
            where.entityId = filters.entityId;
        }

        if (filters.userId !== undefined) {
            where.userId = filters.userId;
        }

        if (filters.tenantId !== undefined) {
            where.tenantId = filters.tenantId;
        }

        if (filters.requestId) {
            where.requestId = filters.requestId;
        }

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};

            if (filters.startDate) {
                where.createdAt[Op.gte] = filters.startDate;
            }

            if (filters.endDate) {
                where.createdAt[Op.lte] = filters.endDate;
            }
        }

        return where;
    }
}

