import { AuditAction, AuditLogModel, UserModel } from '@app/domain/models';
import { maskPII } from '@app/infrastructure/common/utils/logging';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
    AuditService,
    IAuditFilters,
    IPaginatedAuditLogs,
} from './audit.service';
import {
    RoleAuditCacheService,
    type IAuditCacheStats,
} from './role-audit-cache.service';

// Константы для лимитов
const MAX_TIMELINE_RECORDS = 1000; // Максимум записей для timeline
const MAX_USER_ACTIVITY_RECORDS = 1000; // Максимум записей для user activity

/**
 * Интерфейс для diff между old и new values
 */
export interface IAuditDiff {
    field: string;
    oldValue: unknown;
    newValue: unknown;
    changed: boolean;
}

/**
 * Интерфейс для детального diff audit лога
 */
export interface IAuditLogDiff {
    auditLogId: number;
    action: AuditAction;
    hasChanges: boolean;
    diffs: IAuditDiff[];
}

/**
 * Специализированный сервис для работы с audit логами ролей
 * Предоставляет методы для получения истории изменений ролей, пользователей и разрешений
 */
@Injectable()
export class RoleAuditService {
    private readonly logger = new Logger(RoleAuditService.name);

    constructor(
        private readonly auditService: AuditService,
        @InjectModel(UserModel)
        private readonly userModel: typeof UserModel,
        private readonly auditCacheService: RoleAuditCacheService,
    ) {}

    /**
     * Получить историю изменений конкретной роли
     * @param roleId - ID роли
     * @param page - номер страницы (начиная с 1)
     * @param limit - количество записей на странице
     * @param tenantId - ID тенанта для tenant isolation
     * @returns Promise<IPaginatedAuditLogs>
     */
    async getRoleAuditHistory(
        roleId: number,
        page: number = 1,
        limit: number = 20,
        tenantId?: number | null,
    ): Promise<IPaginatedAuditLogs> {
        this.logger.log({
            roleId,
            page,
            limit,
            tenantId,
            message: 'Getting role audit history',
        });

        const filters: IAuditFilters = {
            entityType: 'role',
            entityId: roleId,
            tenantId: tenantId ?? undefined,
        };

        return this.auditService.findAll(page, limit, filters);
    }

    /**
     * Получить историю назначений и отзывов ролей для конкретного пользователя
     * @param userId - ID пользователя
     * @param page - номер страницы
     * @param limit - количество записей на странице
     * @param tenantId - ID тенанта для tenant isolation
     * @returns Promise<IPaginatedAuditLogs>
     */
    async getUserRoleAuditHistory(
        userId: number,
        page: number = 1,
        limit: number = 20,
        tenantId?: number | null,
    ): Promise<IPaginatedAuditLogs> {
        this.logger.log({
            userId,
            page,
            limit,
            tenantId,
            message: 'Getting user role audit history',
        });

        const filters: IAuditFilters = {
            entityType: 'user_role',
            userId,
            tenantId: tenantId ?? undefined,
            action: AuditAction.ASSIGN,
        };

        // Получаем ASSIGN и REVOKE операции
        const assignLogs = await this.auditService.findAll(page, limit, {
            ...filters,
            action: AuditAction.ASSIGN,
        });

        const revokeFilters: IAuditFilters = {
            ...filters,
            action: AuditAction.REVOKE,
        };

        const revokeLogs = await this.auditService.findAll(page, limit, {
            ...revokeFilters,
        });

        // Объединяем результаты и сортируем по дате
        const allLogs = [...assignLogs.data, ...revokeLogs.data].sort(
            (a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA; // Сортировка по убыванию (новые первыми)
            },
        );

        const totalCount = assignLogs.totalCount + revokeLogs.totalCount;
        const lastPage = Math.ceil(totalCount / limit);

        return {
            data: allLogs.slice((page - 1) * limit, page * limit),
            totalCount,
            currentPage: page,
            lastPage,
            limit,
        };
    }

    /**
     * Получить audit логи по типу действия
     * @param action - тип действия (CREATE, UPDATE, DELETE, ASSIGN, REVOKE и т.д.)
     * @param page - номер страницы
     * @param limit - количество записей на странице
     * @param filters - дополнительные фильтры
     * @returns Promise<IPaginatedAuditLogs>
     */
    async getAuditByAction(
        action: AuditAction,
        page: number = 1,
        limit: number = 20,
        filters?: Omit<IAuditFilters, 'action'>,
    ): Promise<IPaginatedAuditLogs> {
        this.logger.log({
            action,
            page,
            limit,
            filters,
            message: 'Getting audit logs by action',
        });

        return this.auditService.findAll(page, limit, {
            ...filters,
            action,
        });
    }

    /**
     * Получить audit логи за указанный период с фильтрацией
     * @param startDate - начальная дата
     * @param endDate - конечная дата
     * @param page - номер страницы
     * @param limit - количество записей на странице
     * @param filters - дополнительные фильтры (entityType, entityId, userId, tenantId)
     * @returns Promise<IPaginatedAuditLogs>
     */
    async getAuditByDateRange(
        startDate: Date,
        endDate: Date,
        page: number = 1,
        limit: number = 20,
        filters?: Omit<IAuditFilters, 'startDate' | 'endDate'>,
    ): Promise<IPaginatedAuditLogs> {
        this.logger.log({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            page,
            limit,
            filters,
            message: 'Getting audit logs by date range',
        });

        return this.auditService.findByDateRange(
            startDate,
            endDate,
            page,
            limit,
            filters,
        );
    }

    /**
     * Вычислить diff между old и new values в audit логе
     * @param auditLog - audit лог для анализа
     * @returns IAuditLogDiff
     */
    getDiff(auditLog: AuditLogModel): IAuditLogDiff {
        const diffs: IAuditDiff[] = [];

        // Для CREATE - только newValues
        if (auditLog.isCreateAction && auditLog.newValues) {
            Object.keys(auditLog.newValues).forEach((field) => {
                diffs.push({
                    field,
                    oldValue: null,
                    newValue: auditLog.newValues?.[field] ?? null,
                    changed: true,
                });
            });
        }
        // Для DELETE - только oldValues
        else if (auditLog.isDeleteAction && auditLog.oldValues) {
            Object.keys(auditLog.oldValues).forEach((field) => {
                diffs.push({
                    field,
                    oldValue: auditLog.oldValues?.[field] ?? null,
                    newValue: null,
                    changed: true,
                });
            });
        }
        // Для UPDATE, ASSIGN, REVOKE - сравнение old и new
        else if (auditLog.hasChanges) {
            const oldVals = auditLog.oldValues ?? {};
            const newVals = auditLog.newValues ?? {};

            // Получить все уникальные ключи из old и new
            const allKeys = new Set([
                ...Object.keys(oldVals),
                ...Object.keys(newVals),
            ]);

            allKeys.forEach((field) => {
                const oldVal = oldVals[field];
                const newVal = newVals[field];

                // Сравнить значения (deep comparison для объектов/массивов)
                const changed = !this.valuesEqual(oldVal, newVal);

                diffs.push({
                    field,
                    oldValue: oldVal ?? null,
                    newValue: newVal ?? null,
                    changed,
                });
            });
        }

        return {
            auditLogId: auditLog.id,
            action: auditLog.action,
            hasChanges: diffs.some((diff) => diff.changed),
            diffs: diffs.filter((diff) => diff.changed), // Возвращаем только изменённые поля
        };
    }

    /**
     * Вычислить diff для массива audit логов
     * @param auditLogs - массив audit логов
     * @returns IAuditLogDiff[]
     */
    getDiffForMultiple(auditLogs: AuditLogModel[]): IAuditLogDiff[] {
        return auditLogs.map((log) => this.getDiff(log));
    }

    /**
     * Сравнить два значения (deep comparison)
     * @param a - первое значение
     * @param b - второе значение
     * @returns boolean
     */
    private valuesEqual(a: unknown, b: unknown): boolean {
        // Оба null или undefined
        if (a === null && b === null) {
            return true;
        }
        if (a === undefined && b === undefined) {
            return true;
        }

        // Один из них null/undefined
        if (a === null || a === undefined || b === null || b === undefined) {
            return false;
        }

        // Примитивные типы
        if (typeof a !== 'object' || typeof b !== 'object') {
            return a === b;
        }

        // Массивы
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) {
                return false;
            }
            return a.every((val, idx) => this.valuesEqual(val, b[idx]));
        }

        // Объекты
        if (
            !Array.isArray(a) &&
            !Array.isArray(b) &&
            typeof a === 'object' &&
            typeof b === 'object'
        ) {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);

            if (keysA.length !== keysB.length) {
                return false;
            }

            return keysA.every(
                (key) =>
                    keysB.includes(key) &&
                    this.valuesEqual(
                        (a as Record<string, unknown>)[key],
                        (b as Record<string, unknown>)[key],
                    ),
            );
        }

        return false;
    }

    /**
     * Получить статистику кэша для мониторинга
     * Делегирует запрос в RoleAuditCacheService
     */
    getCacheStats(): IAuditCacheStats {
        return this.auditCacheService.getCacheStats();
    }

    /**
     * Сгенерировать сводный отчёт по audit логам
     * Использует агрегацию на уровне БД для избежания memory leak
     * Кэширование: результаты кэшируются для часто запрашиваемых периодов
     * @param startDate - начальная дата
     * @param endDate - конечная дата
     * @param tenantId - ID тенанта для фильтрации
     * @returns Promise с данными сводного отчёта
     */
    async generateSummaryReport(
        startDate: Date,
        endDate: Date,
        tenantId?: number | null,
    ): Promise<{
        totalOperations: number;
        operationsByAction: Record<string, number>;
        operationsByEntityType: Record<string, number>;
        topUsers: Array<{
            userId: number;
            userName: string | null;
            userEmail: string | null;
            operationsCount: number;
        }>;
        dateRange: { start: string; end: string };
        tenantId?: number | null;
    }> {
        // Проверяем кэш через RoleAuditCacheService
        const cached = await this.auditCacheService.getSummaryReport<{
            totalOperations: number;
            operationsByAction: Record<string, number>;
            operationsByEntityType: Record<string, number>;
            topUsers: Array<{
                userId: number;
                userName: string | null;
                userEmail: string | null;
                operationsCount: number;
            }>;
            dateRange: { start: string; end: string };
            tenantId?: number | null;
        }>(startDate, endDate, tenantId);

        if (cached) {
            return cached;
        }

        this.logger.log({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            tenantId,
            message: 'Cache MISS: generating summary report',
        });

        const filters: IAuditFilters = {
            startDate,
            endDate,
            tenantId: tenantId ?? undefined,
        };

        // Используем агрегацию на уровне БД вместо загрузки всех логов
        const [
            totalOperations,
            operationsByAction,
            operationsByEntityType,
            topUsersData,
        ] = await Promise.all([
            this.auditService.count(filters),
            this.auditService.getAggregatedByAction(filters),
            this.auditService.getAggregatedByEntityType(filters),
            this.auditService.getTopUsersByOperations(filters, 10),
        ]);

        // Получить информацию о пользователях для топ-10
        const userIds = topUsersData.map((u) => u.userId);
        const users = await this.userModel.findAll({
            where: { id: userIds },
            attributes: ['id', 'firstName', 'lastName', 'email'],
        });

        const userMap = new Map(
            users.map((u) => [
                u.id,
                {
                    userName:
                        u.firstName && u.lastName
                            ? `${u.firstName} ${u.lastName}`
                            : null,
                    userEmail: u.email ?? null,
                },
            ]),
        );

        // Формируем топ пользователей с маскированием PII
        const topUsers = topUsersData.map((userData) => {
            const userInfo = userMap.get(userData.userId) ?? {
                userName: null,
                userEmail: null,
            };

            return {
                userId: userData.userId,
                userName: userInfo.userName ? maskPII(userInfo.userName) : null,
                userEmail: userInfo.userEmail
                    ? maskPII(userInfo.userEmail)
                    : null,
                operationsCount: userData.operationsCount,
            };
        });

        const report = {
            totalOperations,
            operationsByAction,
            operationsByEntityType,
            topUsers,
            dateRange: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
            },
            tenantId,
        };

        // Кэшируем результат через RoleAuditCacheService
        await this.auditCacheService.setSummaryReport(
            startDate,
            endDate,
            report,
            tenantId,
        );

        return report;
    }

    /**
     * Сгенерировать timeline для конкретной роли
     * Кэширование: результаты кэшируются для часто запрашиваемых ролей
     * @param roleId - ID роли
     * @param tenantId - ID тенанта для фильтрации
     * @returns Promise с timeline данными
     */
    async generateTimelineReport(
        roleId: number,
        tenantId?: number | null,
    ): Promise<{
        roleId: number;
        roleName: string;
        events: Array<{
            id: number;
            action: AuditAction;
            performedBy: {
                userId: number | null;
                userName: string | null;
                userEmail: string | null;
            };
            timestamp: string;
            changes: IAuditLogDiff;
            ipAddress: string | null;
            requestId: string | null;
        }>;
    }> {
        // Проверяем кэш через RoleAuditCacheService
        const cached = await this.auditCacheService.getTimelineReport<{
            roleId: number;
            roleName: string;
            events: Array<{
                id: number;
                action: AuditAction;
                performedBy: {
                    userId: number | null;
                    userName: string | null;
                    userEmail: string | null;
                };
                timestamp: string;
                changes: IAuditLogDiff;
                ipAddress: string | null;
                requestId: string | null;
            }>;
        }>(roleId, tenantId);

        if (cached) {
            return cached;
        }

        this.logger.log({
            roleId,
            tenantId,
            message: 'Cache MISS: generating timeline report',
        });

        // Получить логи для роли с лимитом (избегаем memory leak)
        const allLogs: AuditLogModel[] = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;
        let totalFetched = 0;

        while (hasMore && totalFetched < MAX_TIMELINE_RECORDS) {
            const result = await this.getRoleAuditHistory(
                roleId,
                page,
                limit,
                tenantId,
            );

            const remaining = MAX_TIMELINE_RECORDS - totalFetched;
            const toAdd = result.data.slice(0, remaining);
            allLogs.push(...toAdd);

            totalFetched += toAdd.length;
            hasMore =
                result.currentPage < result.lastPage &&
                totalFetched < MAX_TIMELINE_RECORDS;
            page++;

            // Если достигли лимита, прерываем
            if (totalFetched >= MAX_TIMELINE_RECORDS) {
                this.logger.warn({
                    roleId,
                    limit: MAX_TIMELINE_RECORDS,
                    message: 'Timeline report limited to maximum records count',
                });
                break;
            }
        }

        // Получить название роли из первого лога или из самого последнего
        let roleName = 'Unknown Role';
        if (allLogs.length > 0) {
            const firstLog = allLogs[0];
            if (
                firstLog.newValues &&
                typeof firstLog.newValues.role === 'string'
            ) {
                roleName = firstLog.newValues.role;
            } else if (
                firstLog.oldValues &&
                typeof firstLog.oldValues.role === 'string'
            ) {
                roleName = firstLog.oldValues.role;
            }
        }

        // Преобразовать логи в события с diff и маскированием PII
        const events = allLogs.map((log) => {
            const userName =
                log.user?.firstName && log.user?.lastName
                    ? `${log.user.firstName} ${log.user.lastName}`
                    : (log.user?.email ?? null);

            return {
                id: log.id,
                action: log.action,
                performedBy: {
                    userId: log.userId,
                    userName: userName ? maskPII(userName) : null,
                    userEmail: log.user?.email ? maskPII(log.user.email) : null,
                },
                timestamp: log.createdAt.toISOString(),
                changes: this.getDiff(log),
                ipAddress: log.ipAddress,
                requestId: log.requestId,
            };
        });

        const report = {
            roleId,
            roleName,
            events,
        };

        // Кэшируем результат через RoleAuditCacheService
        await this.auditCacheService.setTimelineReport(
            roleId,
            report,
            tenantId,
        );

        return report;
    }

    /**
     * Сгенерировать отчёт об активности пользователя
     * @param userId - ID пользователя
     * @param startDate - начальная дата (опционально)
     * @param endDate - конечная дата (опционально)
     * @param tenantId - ID тенанта для фильтрации
     * @returns Promise с данными об активности пользователя
     */
    async generateUserActivityReport(
        userId: number,
        startDate?: Date,
        endDate?: Date,
        tenantId?: number | null,
    ): Promise<{
        userId: number;
        userName: string | null;
        userEmail: string | null;
        totalOperations: number;
        operationsByAction: Record<string, number>;
        rolesModified: Array<{
            roleId: number;
            roleName: string;
            operationsCount: number;
        }>;
        dateRange: { start: string; end: string };
    }> {
        this.logger.log({
            userId,
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
            tenantId,
            message: 'Generating user activity report',
        });

        const filters: IAuditFilters = {
            userId,
            tenantId: tenantId ?? undefined,
            startDate,
            endDate,
        };

        // Получить общее количество операций (без загрузки всех логов)
        const totalOperations = await this.auditService.count(filters);

        // Получить агрегированную статистику по действиям
        const operationsByAction =
            await this.auditService.getAggregatedByAction(filters);

        // Получить логи пользователя с лимитом для подсчёта изменённых ролей
        const allLogs: AuditLogModel[] = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;
        let totalFetched = 0;

        while (hasMore && totalFetched < MAX_USER_ACTIVITY_RECORDS) {
            const result = await this.auditService.findAll(
                page,
                limit,
                filters,
            );

            const remaining = MAX_USER_ACTIVITY_RECORDS - totalFetched;
            const toAdd = result.data.slice(0, remaining);
            allLogs.push(...toAdd);

            totalFetched += toAdd.length;
            hasMore =
                result.currentPage < result.lastPage &&
                totalFetched < MAX_USER_ACTIVITY_RECORDS;
            page++;

            if (totalFetched >= MAX_USER_ACTIVITY_RECORDS) {
                this.logger.warn({
                    userId,
                    limit: MAX_USER_ACTIVITY_RECORDS,
                    message:
                        'User activity report limited to maximum records count',
                });
                break;
            }
        }

        // Получить информацию о пользователе
        const user = await this.userModel.findByPk(userId, {
            attributes: ['id', 'firstName', 'lastName', 'email'],
        });

        let userName: string | null = null;
        let userEmail: string | null = null;
        if (user) {
            userName =
                user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : null;
            userEmail = user.email ?? null;
        } else if (allLogs.length > 0 && allLogs[0].user) {
            // Fallback к данным из логов
            const logUser = allLogs[0].user;
            userName =
                logUser.firstName && logUser.lastName
                    ? `${logUser.firstName} ${logUser.lastName}`
                    : null;
            userEmail = logUser.email ?? null;
        }

        // Подсчёт изменённых ролей (только для загруженных логов)
        const rolesModifiedCount: Record<
            number,
            { roleName: string; count: number }
        > = {};
        allLogs.forEach((log) => {
            if (log.entityType === 'role' || log.entityType === 'user_role') {
                let roleId: number | null = null;
                let roleName = 'Unknown';

                if (log.entityType === 'role') {
                    roleId = log.entityId;
                    if (
                        log.newValues &&
                        typeof log.newValues.role === 'string'
                    ) {
                        roleName = log.newValues.role;
                    } else if (
                        log.oldValues &&
                        typeof log.oldValues.role === 'string'
                    ) {
                        roleName = log.oldValues.role;
                    }
                } else if (log.entityType === 'user_role') {
                    if (
                        log.newValues &&
                        typeof log.newValues.roleId === 'number'
                    ) {
                        roleId = log.newValues.roleId;
                    } else if (
                        log.oldValues &&
                        typeof log.oldValues.roleId === 'number'
                    ) {
                        roleId = log.oldValues.roleId;
                    }
                    if (
                        log.newValues &&
                        typeof log.newValues.roleName === 'string'
                    ) {
                        roleName = log.newValues.roleName;
                    } else if (
                        log.oldValues &&
                        typeof log.oldValues.roleName === 'string'
                    ) {
                        roleName = log.oldValues.roleName;
                    }
                }

                if (roleId !== null) {
                    if (!rolesModifiedCount[roleId]) {
                        rolesModifiedCount[roleId] = { roleName, count: 0 };
                    }
                    rolesModifiedCount[roleId].count++;
                }
            }
        });

        const rolesModified = Object.entries(rolesModifiedCount).map(
            ([roleId, data]) => ({
                roleId: Number.parseInt(roleId, 10),
                roleName: data.roleName,
                operationsCount: data.count,
            }),
        );

        // Определить диапазон дат
        const actualStartDate =
            startDate ??
            (allLogs.length > 0
                ? allLogs[allLogs.length - 1].createdAt
                : new Date());
        const actualEndDate =
            endDate ?? (allLogs.length > 0 ? allLogs[0].createdAt : new Date());

        return {
            userId,
            userName: userName ? maskPII(userName) : null,
            userEmail: userEmail ? maskPII(userEmail) : null,
            totalOperations,
            operationsByAction,
            rolesModified,
            dateRange: {
                start: actualStartDate.toISOString(),
                end: actualEndDate.toISOString(),
            },
        };
    }
}
