import { UserModel } from '@app/domain/models';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueryTypes } from 'sequelize';

/**
 * Сервис для автоматической очистки старых данных пользователей.
 *
 * Выполняет периодические задачи:
 * - Очистка просроченных кодов верификации (> 24 часов)
 */
@Injectable()
export class UserCleanupService {
    private readonly logger = new Logger(UserCleanupService.name);

    constructor(
        @InjectModel(UserModel)
        private readonly userModel: typeof UserModel,
    ) {}

    /**
     * CRON Job: Очистка старых кодов верификации.
     *
     * Удаляет коды старше 24 часов для освобождения места в БД.
     * Коды верификации действительны только 10 минут, поэтому через 24 часа они точно не нужны.
     *
     * @schedule '0 3 * * *' (каждый день в 03:00 AM по времени сервера)
     */
    @Cron(CronExpression.EVERY_DAY_AT_3AM, {
        name: 'cleanup-verification-codes',
        timeZone: 'Europe/Moscow',
    })
    async cleanupExpiredVerificationCodes(): Promise<void> {
        const startTime = Date.now();

        try {
            const sequelize = this.userModel.sequelize;
            if (!sequelize) {
                throw new Error('Sequelize instance not available');
            }

            // Удаляем коды старше 24 часов
            const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const result = await sequelize.query<{ affectedRows: number }>(
                'DELETE FROM `user_verification_code` WHERE `expires_at` < ?',
                {
                    replacements: [cutoffDate],
                    type: QueryTypes.DELETE,
                },
            );

            // Количество удалённых записей (разные БД возвращают по-разному)
            const deletedCount =
                typeof result === 'number'
                    ? result
                    : (result as unknown as { affectedRows?: number })
                            ?.affectedRows ?? 0;

            const duration = Date.now() - startTime;

            this.logger.log({
                event: 'verification_codes_cleanup_completed',
                deletedCount,
                cutoffDate: cutoffDate.toISOString(),
                durationMs: duration,
                message: `Очищено ${deletedCount} просроченных кодов верификации за ${duration}ms`,
            });
        } catch (error: unknown) {
            const duration = Date.now() - startTime;

            this.logger.error({
                event: 'verification_codes_cleanup_failed',
                error: error instanceof Error ? error.message : String(error),
                durationMs: duration,
                message: 'Ошибка при очистке кодов верификации',
            });

            // НЕ выбрасываем исключение (чтобы не сломать приложение)
            // Следующий запуск CRON попробует снова
        }
    }

    /**
     * Метод для ручного запуска cleanup (для тестов и админки).
     *
     * @returns {Promise<void>}
     */
    async runManualCleanup(): Promise<void> {
        await this.cleanupExpiredVerificationCodes();
    }
}
