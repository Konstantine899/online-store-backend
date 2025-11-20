import { UserModel } from '@app/domain/models';
import { TenantContext } from '@app/infrastructure/common/context';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

/**
 * UserBulkRepository
 * Репозиторий для массовых операций над пользователями
 *
 * Методы:
 * - bulkActivateUsers: массовая активация пользователей (isActive = true)
 * - bulkDeactivateUsers: массовая деактивация пользователей (isActive = false)
 * - bulkBlockUsers: массовая блокировка пользователей (isBlocked = true)
 * - bulkUnblockUsers: массовая разблокировка пользователей (isBlocked = false)
 * - bulkDeleteUsers: массовое soft delete пользователей (isDeleted = true)
 * - bulkVerifyUsers: массовая верификация пользователей (isVerified = true)
 *
 * Все операции:
 * - Выполняются в транзакции
 * - Логируют timing метрики (duration)
 * - Соблюдают tenant isolation
 * - Не затрагивают уже удалённых пользователей
 */
@Injectable()
export class UserBulkRepository {
    private readonly logger = new Logger(UserBulkRepository.name);

    constructor(
        @InjectModel(UserModel) private userModel: typeof UserModel,
        private readonly tenantContext: TenantContext,
        private readonly metricsCollector: MetricsCollector,
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
     * Массовая активация пользователей
     * @param userIds - массив ID пользователей для активации
     * @returns количество обновлённых пользователей
     */
    public async bulkActivateUsers(userIds: number[]): Promise<number> {
        if (!this.userModel.sequelize) {
            throw new Error('Sequelize instance is not available');
        }
        const transaction = await this.userModel.sequelize.transaction();
        const start = Date.now(); // Начало измерения времени

        try {
            const tenantId = this.getTenantIdSafe();

            const [affectedCount] = await this.userModel.update(
                { isActive: true },
                {
                    where: {
                        id: userIds,
                        tenantId,
                        isDeleted: false,
                    },
                    transaction,
                },
            );

            await transaction.commit();

            const duration = Date.now() - start; // Конец измерения времени

            // Записываем метрики
            this.metricsCollector.recordBulkOperation(
                'bulkActivateUsers',
                duration,
                affectedCount,
            );

            this.logger.log(
                {
                    operation: 'bulkActivateUsers',
                    userIdsCount: userIds.length,
                    affectedCount,
                    duration: `${duration}ms`,
                    tenantId,
                },
                `Массовая активация ${affectedCount} пользователей за ${duration}ms`,
            );

            return affectedCount;
        } catch (error: unknown) {
            await transaction.rollback();
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
        if (!this.userModel.sequelize) {
            throw new Error('Sequelize instance is not available');
        }
        const transaction = await this.userModel.sequelize.transaction();
        const start = Date.now();

        try {
            const tenantId = this.getTenantIdSafe();

            const [affectedCount] = await this.userModel.update(
                { isActive: false },
                {
                    where: {
                        id: userIds,
                        tenantId,
                        isDeleted: false,
                    },
                    transaction,
                },
            );

            await transaction.commit();

            const duration = Date.now() - start;

            // Записываем метрики
            this.metricsCollector.recordBulkOperation(
                'bulkDeactivateUsers',
                duration,
                affectedCount,
            );

            this.logger.log(
                {
                    operation: 'bulkDeactivateUsers',
                    userIdsCount: userIds.length,
                    affectedCount,
                    duration: `${duration}ms`,
                    tenantId,
                },
                `Массовая деактивация ${affectedCount} пользователей за ${duration}ms`,
            );

            return affectedCount;
        } catch (error: unknown) {
            await transaction.rollback();
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
        if (!this.userModel.sequelize) {
            throw new Error('Sequelize instance is not available');
        }
        const transaction = await this.userModel.sequelize.transaction();
        const start = Date.now();

        try {
            const tenantId = this.getTenantIdSafe();

            const [affectedCount] = await this.userModel.update(
                { isBlocked: true },
                {
                    where: {
                        id: userIds,
                        tenantId,
                        isDeleted: false,
                    },
                    transaction,
                },
            );

            await transaction.commit();

            const duration = Date.now() - start;

            // Записываем метрики
            this.metricsCollector.recordBulkOperation(
                'bulkBlockUsers',
                duration,
                affectedCount,
            );

            this.logger.log(
                {
                    operation: 'bulkBlockUsers',
                    userIdsCount: userIds.length,
                    affectedCount,
                    duration: `${duration}ms`,
                    tenantId,
                },
                `Массовая блокировка ${affectedCount} пользователей за ${duration}ms`,
            );

            return affectedCount;
        } catch (error: unknown) {
            await transaction.rollback();
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
        if (!this.userModel.sequelize) {
            throw new Error('Sequelize instance is not available');
        }
        const transaction = await this.userModel.sequelize.transaction();
        const start = Date.now();

        try {
            const tenantId = this.getTenantIdSafe();

            const [affectedCount] = await this.userModel.update(
                { isBlocked: false },
                {
                    where: {
                        id: userIds,
                        tenantId,
                        isDeleted: false,
                    },
                    transaction,
                },
            );

            await transaction.commit();

            const duration = Date.now() - start;

            // Записываем метрики
            this.metricsCollector.recordBulkOperation(
                'bulkUnblockUsers',
                duration,
                affectedCount,
            );

            this.logger.log(
                {
                    operation: 'bulkUnblockUsers',
                    userIdsCount: userIds.length,
                    affectedCount,
                    duration: `${duration}ms`,
                    tenantId,
                },
                `Массовая разблокировка ${affectedCount} пользователей за ${duration}ms`,
            );

            return affectedCount;
        } catch (error: unknown) {
            await transaction.rollback();
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
        if (!this.userModel.sequelize) {
            throw new Error('Sequelize instance is not available');
        }
        const transaction = await this.userModel.sequelize.transaction();
        const start = Date.now();

        try {
            const tenantId = this.getTenantIdSafe();

            const [affectedCount] = await this.userModel.update(
                { isDeleted: true },
                {
                    where: {
                        id: userIds,
                        tenantId,
                        isDeleted: false, // только неудалённые
                    },
                    transaction,
                },
            );

            await transaction.commit();

            const duration = Date.now() - start;

            // Записываем метрики
            this.metricsCollector.recordBulkOperation(
                'bulkDeleteUsers',
                duration,
                affectedCount,
            );

            this.logger.log(
                {
                    operation: 'bulkDeleteUsers',
                    userIdsCount: userIds.length,
                    affectedCount,
                    duration: `${duration}ms`,
                    tenantId,
                },
                `Массовое soft delete ${affectedCount} пользователей за ${duration}ms`,
            );

            return affectedCount;
        } catch (error: unknown) {
            await transaction.rollback();
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
        if (!this.userModel.sequelize) {
            throw new Error('Sequelize instance is not available');
        }
        const transaction = await this.userModel.sequelize.transaction();
        const start = Date.now();

        try {
            const tenantId = this.getTenantIdSafe();

            const [affectedCount] = await this.userModel.update(
                {
                    isVerified: true,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                },
                {
                    where: {
                        id: userIds,
                        tenantId,
                        isDeleted: false,
                    },
                    transaction,
                },
            );

            await transaction.commit();

            const duration = Date.now() - start;

            // Записываем метрики
            this.metricsCollector.recordBulkOperation(
                'bulkVerifyUsers',
                duration,
                affectedCount,
            );

            this.logger.log(
                {
                    operation: 'bulkVerifyUsers',
                    userIdsCount: userIds.length,
                    affectedCount,
                    duration: `${duration}ms`,
                    tenantId,
                },
                `Массовая верификация ${affectedCount} пользователей за ${duration}ms`,
            );

            return affectedCount;
        } catch (error: unknown) {
            await transaction.rollback();
            this.handleSequelizeError(
                error,
                'массовая верификация пользователей',
            );
            throw error;
        }
    }
}
