import { UserModel } from '@app/domain/models';
import { TenantContext } from '@app/infrastructure/common/context';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';

/**
 * Интерфейс для общей статистики пользователей
 */
export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    newsletterSubscribers: number;
}

/**
 * UserStatsRepository
 * Репозиторий для получения различной статистики по пользователям
 *
 * Методы:
 * - getUserStats: общая статистика (всего/активных/заблокированных/подписчиков)
 * - getUserStatsByRole: статистика по ролям с процентами
 * - getUserActivityStats: статистика активности (24ч/7д/30д/никогда не логинились)
 */
@Injectable()
export class UserStatsRepository {
    private readonly logger = new Logger(UserStatsRepository.name);

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
     * Получить общую статистику пользователей
     * @returns Promise<UserStats>
     * @description Возвращает количество всего/активных/заблокированных пользователей и подписчиков
     */
    public async getUserStats(): Promise<UserStats> {
        try {
            const sequelize = this.userModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            const tenantId = this.getTenantIdSafe();

            const startTime = Date.now();
            this.logger.log(
                `Запрос статистики пользователей для tenant ${tenantId}`,
            );

            // Оптимизированный запрос: универсальные метрики для любого типа бизнеса
            const [results] = await sequelize.query(
                `
                SELECT
                    COUNT(*) as totalUsers,
                    SUM(CASE WHEN is_active = 1 AND is_blocked = 0 AND is_deleted = 0 THEN 1 ELSE 0 END) as activeUsers,
                    SUM(CASE WHEN is_blocked = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as blockedUsers,
                    SUM(CASE WHEN is_newsletter_subscribed = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) as newsletterSubscribers
                FROM user
                WHERE is_deleted = 0 AND tenant_id = ?
            `,
                {
                    replacements: [tenantId],
                },
            );

            const executionTime = Date.now() - startTime;
            this.logger.log(
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
            this.handleSequelizeError(
                error,
                'получение статистики пользователей',
            );
            throw error;
        }
    }

    /**
     * Получить статистику пользователей по ролям
     * @returns статистика: количество пользователей для каждой роли с процентами
     * @example getUserStatsByRole() // { roles: [{ role: 'USER', count: 100, percentage: 80 }], totalUsers: 125 }
     */
    public async getUserStatsByRole(): Promise<{
        roles: Array<{ role: string; count: number; percentage: number }>;
        totalUsers: number;
    }> {
        try {
            const tenantId = this.getTenantIdSafe();

            const sequelize = this.userModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            // Получаем статистику по ролям с процентами
            const results = await sequelize.query<{
                role: string;
                count: number;
                percentage: number;
            }>(
                `
                SELECT
                    r.role,
                    COUNT(DISTINCT u.id) as count,
                    ROUND((COUNT(DISTINCT u.id) * 100.0) / (
                        SELECT COUNT(DISTINCT id)
                        FROM user
                        WHERE tenant_id = ? AND is_deleted = 0
                    ), 2) as percentage
                FROM user u
                INNER JOIN user_role ur ON u.id = ur.user_id
                INNER JOIN role r ON ur.role_id = r.id
                WHERE u.tenant_id = ? AND u.is_deleted = 0
                GROUP BY r.role
                ORDER BY count DESC
            `,
                {
                    replacements: [tenantId, tenantId],
                    type: QueryTypes.SELECT,
                },
            );

            // ⚠️ ВАЖНО: SQL ROUND() возвращает DECIMAL/string, преобразуем в число
            const roles = results.map((row) => ({
                role: row.role,
                count: Number(row.count) || 0,
                percentage: Number(row.percentage) || 0, // "44.87" → 44.87
            }));

            // Получаем общее количество пользователей
            const totalResult = await sequelize.query<{ total: number }>(
                `
                SELECT COUNT(DISTINCT id) as total
                FROM user
                WHERE tenant_id = ? AND is_deleted = 0
            `,
                {
                    replacements: [tenantId],
                    type: QueryTypes.SELECT,
                },
            );

            const totalUsers = Number(totalResult[0]?.total) || 0;

            return {
                roles,
                totalUsers,
            };
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'получение статистики пользователей по ролям',
            );
            throw error;
        }
    }

    /**
     * Получить статистику активности пользователей
     * @returns статистика: активные пользователи за 24ч, 7д, 30д, никогда не логинились
     * @example getUserActivityStats() // { activeInLast24Hours: 50, activeInLast7Days: 200, ... }
     */
    public async getUserActivityStats(): Promise<{
        activeInLast24Hours: number;
        activeInLast7Days: number;
        activeInLast30Days: number;
        neverLoggedIn: number;
        totalUsers: number;
    }> {
        try {
            const tenantId = this.getTenantIdSafe();

            const sequelize = this.userModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            // Получаем статистику активности за разные периоды
            const [results] = await sequelize.query(
                `
                SELECT
                    COUNT(*) as totalUsers,
                    SUM(CASE
                        WHEN last_login_at IS NOT NULL
                        AND last_login_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                        THEN 1 ELSE 0
                    END) as activeInLast24Hours,
                    SUM(CASE
                        WHEN last_login_at IS NOT NULL
                        AND last_login_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                        THEN 1 ELSE 0
                    END) as activeInLast7Days,
                    SUM(CASE
                        WHEN last_login_at IS NOT NULL
                        AND last_login_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                        THEN 1 ELSE 0
                    END) as activeInLast30Days,
                    SUM(CASE
                        WHEN last_login_at IS NULL
                        THEN 1 ELSE 0
                    END) as neverLoggedIn
                FROM user
                WHERE tenant_id = ? AND is_deleted = 0
            `,
                {
                    replacements: [tenantId],
                    type: QueryTypes.SELECT,
                },
            );

            const stats = (
                results as Array<{
                    totalUsers: number;
                    activeInLast24Hours: number;
                    activeInLast7Days: number;
                    activeInLast30Days: number;
                    neverLoggedIn: number;
                }>
            )[0];

            // Защита: если SQL не вернул строк
            if (!stats) {
                return {
                    activeInLast24Hours: 0,
                    activeInLast7Days: 0,
                    activeInLast30Days: 0,
                    neverLoggedIn: 0,
                    totalUsers: 0,
                };
            }

            return {
                activeInLast24Hours: Number(stats.activeInLast24Hours) || 0,
                activeInLast7Days: Number(stats.activeInLast7Days) || 0,
                activeInLast30Days: Number(stats.activeInLast30Days) || 0,
                neverLoggedIn: Number(stats.neverLoggedIn) || 0,
                totalUsers: Number(stats.totalUsers) || 0,
            };
        } catch (error: unknown) {
            this.handleSequelizeError(
                error,
                'получение статистики активности пользователей',
            );
            throw error;
        }
    }
}
