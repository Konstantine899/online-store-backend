import { NotificationType, RoleModel, UserModel } from '@app/domain/models';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { getConfig } from '@app/infrastructure/config';
import { RoleRepository } from '@app/infrastructure/repositories';
import { NotificationService } from '@app/infrastructure/services/notification/notification.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';

/**
 * Сервис для отправки уведомлений об истечении ролей.
 *
 * Выполняет периодические задачи:
 * - Проверка ролей, которые истекают через 7 дней (warning)
 * - Проверка ролей, которые истекают через 1 день (critical)
 * - Уведомления при истечении ролей (expired)
 * - Отправка уведомлений через NotificationService
 *
 * @schedule '0 * * * *' (каждый час)
 */
@Injectable()
export class RoleExpirationNotificationService {
    private readonly logger = new Logger(
        RoleExpirationNotificationService.name,
    );
    private readonly notificationSentCache = new Map<string, number>(); // Кэш для предотвращения дублирования уведомлений (key: `${userRoleId}:${daysUntilExpiration}`, value: timestamp)
    private readonly cacheTimeout = 24 * 60 * 60 * 1000; // 24 часа

    constructor(
        private readonly roleRepository: RoleRepository,
        private readonly notificationService: NotificationService,
        @InjectModel(UserModel) private userModel: typeof UserModel,
        private readonly metricsCollector: MetricsCollector,
    ) {}

    /**
     * CRON Job: Отправка уведомлений об истечении ролей.
     *
     * Проверяет роли, которые истекают в ближайшие дни, и отправляет уведомления пользователям.
     * Использует кэш для предотвращения дублирования уведомлений в течение 24 часов.
     *
     * @schedule '0 * * * *' (каждый час)
     */
    @Cron('0 * * * *', {
        name: 'send-role-expiration-notifications',
        timeZone: 'Europe/Moscow',
    })
    async sendExpirationNotifications(): Promise<void> {
        const startTime = Date.now();
        try {
            const config = getConfig();
            const warningDays = config.ROLE_EXPIRATION_WARNING_DAYS ?? [7, 1];

            this.logger.log({
                warningDays,
                message:
                    'Начинается проверка ролей для отправки уведомлений об истечении',
            });

            // Очистить старые записи из кэша (старше 24 часов)
            this.cleanupNotificationCache();

            let totalSent = 0;

            // Отправляем уведомления для каждого уровня предупреждения
            for (const daysUntilExpiration of warningDays) {
                const sentCount =
                    await this.sendNotificationsForDaysUntilExpiration(
                        daysUntilExpiration,
                    );
                totalSent += sentCount;
            }

            // Отправляем уведомления для истекших ролей (сегодня истекли)
            const expiredSentCount = await this.sendExpiredNotifications();
            totalSent += expiredSentCount;

            const duration = Date.now() - startTime;
            this.metricsCollector.recordBulkOperation(
                'sendRoleExpirationNotifications',
                duration,
                totalSent,
            );

            // Метрики по tenantId записываются индивидуально в методах отправки
            // Здесь записываем только общую метрику bulk операции

            this.logger.log({
                event: 'role_expiration_notifications_sent',
                totalSent,
                durationMs: duration,
                message: `Отправлено ${totalSent} уведомлений об истечении ролей`,
            });
        } catch (error: unknown) {
            const duration = Date.now() - startTime;
            this.metricsCollector.recordError(
                'RoleExpirationNotificationService',
                error instanceof Error ? error.message : String(error),
            );
            this.logger.error({
                event: 'role_expiration_notifications_failed',
                error: error instanceof Error ? error.message : String(error),
                durationMs: duration,
                message: 'Ошибка при отправке уведомлений об истечении ролей',
            });
            // НЕ выбрасываем исключение, чтобы не сломать cron job
        }
    }

    /**
     * Отправить уведомления для ролей, которые истекают через указанное количество дней
     * @param daysUntilExpiration - Количество дней до истечения (например, 7 или 1)
     */
    private async sendNotificationsForDaysUntilExpiration(
        daysUntilExpiration: number,
    ): Promise<number> {
        const batchSize = 100;

        // Найти роли с активным продлением, которые истекают в указанный период
        const rolesToNotify =
            await this.roleRepository.findRolesWithAutoRenewalExpiringSoon(
                daysUntilExpiration,
                batchSize,
            );

        let sentCount = 0;

        for (const roleData of rolesToNotify) {
            // Проверяем кэш, чтобы не отправлять дубликаты
            const cacheKey = `${roleData.userRoleId}:${daysUntilExpiration}`;
            const lastSent = this.notificationSentCache.get(cacheKey);
            if (lastSent && Date.now() - lastSent < this.cacheTimeout) {
                continue; // Уже отправляли в последние 24 часа
            }

            // Проверяем, включены ли уведомления для этой роли
            const renewalConfig =
                await this.roleRepository.findAutoRenewalConfig(
                    roleData.userRoleId,
                );

            if (!renewalConfig?.notificationEnabled) {
                continue; // Уведомления отключены
            }

            // Получить данные пользователя и роли
            const [user, role] = await Promise.all([
                this.userModel.findByPk(roleData.userId, {
                    attributes: ['id', 'email', 'firstName', 'lastName'],
                }),
                RoleModel.findByPk(roleData.roleId, {
                    attributes: ['id', 'role', 'description'],
                }),
            ]);

            if (!user || !role) {
                this.logger.warn({
                    userId: roleData.userId,
                    roleId: roleData.roleId,
                    message:
                        'Пользователь или роль не найдены, пропускаем уведомление',
                });
                continue;
            }

            // Отправить уведомление
            const notificationSent = await this.sendExpirationNotification(
                user.id,
                user.email,
                user.firstName ?? '',
                role.role,
                role.description,
                daysUntilExpiration,
                roleData.expiresAt,
                roleData.tenantId,
            );

            if (notificationSent) {
                sentCount++;
                // Записываем метрику уведомления с tenantId
                this.metricsCollector.recordRoleExpirationNotification(
                    roleData.tenantId,
                    1,
                );
                // Обновляем кэш
                this.notificationSentCache.set(cacheKey, Date.now());
            }
        }

        return sentCount;
    }

    /**
     * Отправить уведомления для ролей, которые истекли сегодня
     */
    private async sendExpiredNotifications(): Promise<number> {
        const batchSize = 100;

        // Найти роли, которые истекли в последние 24 часа (но еще активны)
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const expiredRoles = await this.roleRepository.findExpiredActiveRoles(
            batchSize,
            now,
        );

        // Фильтруем только те, которые истекли в последние 24 часа
        const recentlyExpired = expiredRoles.filter(
            (role) => role.expiresAt >= yesterday,
        );

        let sentCount = 0;

        for (const roleData of recentlyExpired) {
            // Проверяем кэш
            const cacheKey = `${roleData.id}:expired`;
            const lastSent = this.notificationSentCache.get(cacheKey);
            if (lastSent && Date.now() - lastSent < this.cacheTimeout) {
                continue;
            }

            // Проверяем настройки уведомлений
            const renewalConfig =
                await this.roleRepository.findAutoRenewalConfig(roleData.id);

            if (!renewalConfig?.notificationEnabled) {
                continue;
            }

            // Получить данные пользователя и роли
            const [user, role] = await Promise.all([
                this.userModel.findByPk(roleData.userId, {
                    attributes: ['id', 'email', 'firstName', 'lastName'],
                }),
                RoleModel.findByPk(roleData.roleId, {
                    attributes: ['id', 'role', 'description'],
                }),
            ]);

            if (!user || !role) {
                continue;
            }

            // Отправить уведомление об истечении
            const notificationSent = await this.sendExpiredNotification(
                user.id,
                user.email,
                user.firstName ?? '',
                role.role,
                role.description,
                roleData.tenantId,
            );

            if (notificationSent) {
                sentCount++;
                // Записываем метрику уведомления с tenantId
                this.metricsCollector.recordRoleExpirationNotification(
                    roleData.tenantId,
                    1,
                );
                this.notificationSentCache.set(cacheKey, Date.now());
            }
        }

        return sentCount;
    }

    /**
     * Отправить уведомление о приближающемся истечении роли
     */
    private async sendExpirationNotification(
        userId: number,
        userEmail: string,
        userName: string,
        roleName: string,
        roleDescription: string,
        daysUntilExpiration: number,
        expiresAt: Date,
        tenantId: number,
    ): Promise<boolean> {
        try {
            const expiresAtFormatted = new Date(expiresAt).toLocaleDateString(
                'ru-RU',
                {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                },
            );

            const title =
                daysUntilExpiration === 1
                    ? `Роль "${roleName}" истекает завтра`
                    : `Роль "${roleName}" истекает через ${daysUntilExpiration} дней`;

            const message =
                daysUntilExpiration === 1
                    ? `Уважаемый(ая) ${userName},\n\nВаша роль "${roleName}" (${roleDescription}) истекает завтра (${expiresAtFormatted}).\n\nПожалуйста, обратитесь к администратору для продления роли.`
                    : `Уважаемый(ая) ${userName},\n\nВаша роль "${roleName}" (${roleDescription}) истекает через ${daysUntilExpiration} дней (${expiresAtFormatted}).\n\nПожалуйста, обратитесь к администратору для продления роли.`;

            const notification =
                await this.notificationService.sendNotification({
                    userId,
                    type: NotificationType.EMAIL,
                    templateName: 'role_expiration_warning',
                    title,
                    message,
                    data: {
                        roleName,
                        roleDescription,
                        daysUntilExpiration,
                        expiresAt: expiresAt.toISOString(),
                        tenantId,
                    },
                });

            return notification !== null;
        } catch (error: unknown) {
            this.logger.error({
                userId,
                userEmail,
                roleName,
                daysUntilExpiration,
                error: error instanceof Error ? error.message : String(error),
                message: 'Ошибка при отправке уведомления об истечении роли',
            });
            return false;
        }
    }

    /**
     * Отправить уведомление об истечении роли
     */
    private async sendExpiredNotification(
        userId: number,
        userEmail: string,
        userName: string,
        roleName: string,
        roleDescription: string,
        tenantId: number,
    ): Promise<boolean> {
        try {
            const title = `Роль "${roleName}" истекла`;
            const message = `Уважаемый(ая) ${userName},\n\nВаша роль "${roleName}" (${roleDescription}) истекла.\n\nОбратитесь к администратору для восстановления доступа.`;

            const notification =
                await this.notificationService.sendNotification({
                    userId,
                    type: NotificationType.EMAIL,
                    templateName: 'role_expired',
                    title,
                    message,
                    data: {
                        roleName,
                        roleDescription,
                        tenantId,
                    },
                });

            return notification !== null;
        } catch (error: unknown) {
            this.logger.error({
                userId,
                userEmail,
                roleName,
                error: error instanceof Error ? error.message : String(error),
                message: 'Ошибка при отправке уведомления об истечении роли',
            });
            return false;
        }
    }

    /**
     * Очистить старые записи из кэша уведомлений (старше 24 часов)
     */
    private cleanupNotificationCache(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, timestamp] of this.notificationSentCache.entries()) {
            if (now - timestamp > this.cacheTimeout) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            this.notificationSentCache.delete(key);
        }

        if (keysToDelete.length > 0) {
            this.logger.debug({
                deletedCount: keysToDelete.length,
                message: `Очищено ${keysToDelete.length} старых записей из кэша уведомлений`,
            });
        }
    }
}
