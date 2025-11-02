import { NotificationType } from '@app/domain/models';
import { NotificationService } from '@app/infrastructure/services/notification/notification.service';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
    EmailVerificationEvent,
    MarketingCampaignEvent,
    OrderCancelledEvent,
    OrderCreatedEvent,
    OrderDeliveredEvent,
    OrderShippedEvent,
    OrderStatusChangedEvent,
    PasswordChangedEvent,
    PasswordResetRequestedEvent,
    PaymentCompletedEvent,
    UserRegisteredEvent,
} from './notification.events';

/**
 * Обработчик событий для автоматической отправки уведомлений
 *
 * Оптимизировано для производительности:
 * - Кэширование шаблонов уведомлений
 * - Параллельная обработка событий
 * - Батчевая отправка уведомлений
 * - Пул обработчиков для масштабируемости
 * - Метрики производительности
 */
@Injectable()
export class NotificationEventHandler implements OnModuleDestroy {
    private readonly logger = new Logger(NotificationEventHandler.name);

    // Кэш для шаблонов уведомлений
    private readonly templateCache = new Map<
        string,
        {
            templateName: string;
            title: string;
            message: string;
        }
    >();

    // Пул для батчевой обработки
    private readonly notificationQueue: Array<{
        userId: number;
        type: NotificationType;
        templateName: string;
        title: string;
        message: string;
        data?: Record<string, unknown>;
        priority: number;
        timestamp: number;
    }> = [];

    // Конфигурация производительности
    private readonly BATCH_SIZE = 50;
    private readonly BATCH_TIMEOUT = 1000; // 1 секунда
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000; // 1 секунда
    private readonly MAX_QUEUE_SIZE = 1000; // Максимальный размер очереди

    // Метрики производительности
    private metrics = {
        eventsProcessed: 0,
        notificationsSent: 0,
        errors: 0,
        averageProcessingTime: 0,
        lastProcessedAt: Date.now(),
        droppedNotifications: 0, // Количество отброшенных уведомлений из-за переполнения очереди
    };

    private batchTimer: NodeJS.Timeout | null = null;
    private isProcessing = false;

    constructor(private readonly notificationService: NotificationService) {
        this.initializeTemplateCache();
        this.startBatchProcessor();
    }

    /**
     * Инициализация кэша шаблонов уведомлений
     */
    private initializeTemplateCache(): void {
        const templates = [
            {
                key: 'order.created',
                templateName: 'order_confirmation',
                title: 'Заказ подтвержден',
                message: 'Ваш заказ успешно создан',
            },
            {
                key: 'order.processing',
                templateName: 'order_processing',
                title: 'Заказ в обработке',
                message: 'Ваш заказ принят в обработку',
            },
            {
                key: 'order.shipped',
                templateName: 'order_shipped',
                title: 'Заказ отправлен',
                message: 'Ваш заказ отправлен',
            },
            {
                key: 'order.delivered',
                templateName: 'order_delivered',
                title: 'Заказ доставлен',
                message: 'Ваш заказ успешно доставлен',
            },
            {
                key: 'order.cancelled',
                templateName: 'order_cancelled',
                title: 'Заказ отменен',
                message: 'Ваш заказ был отменен',
            },
            {
                key: 'order.status.update',
                templateName: 'order_status_update',
                title: 'Обновление статуса заказа',
                message: 'Статус вашего заказа обновлен',
            },
            {
                key: 'user.registered',
                templateName: 'welcome_email',
                title: 'Добро пожаловать!',
                message: 'Спасибо за регистрацию в нашем магазине',
            },
            {
                key: 'payment.completed',
                templateName: 'payment_confirmation',
                title: 'Оплата подтверждена',
                message: 'Ваш платеж успешно обработан',
            },
            {
                key: 'password.changed',
                templateName: 'password_changed',
                title: 'Пароль изменен',
                message: 'Ваш пароль был успешно изменен',
            },
            {
                key: 'password.reset.requested',
                templateName: 'password_reset',
                title: 'Сброс пароля',
                message: 'Запрос на сброс пароля',
            },
            {
                key: 'email.verification',
                templateName: 'email_verification',
                title: 'Подтверждение email',
                message: 'Подтвердите ваш email адрес',
            },
            {
                key: 'marketing.campaign',
                templateName: 'marketing_campaign',
                title: 'Специальное предложение',
                message: 'Специальное предложение для вас',
            },
        ];

        templates.forEach((template) => {
            this.templateCache.set(template.key, {
                templateName: template.templateName,
                title: template.title,
                message: template.message,
            });
        });
    }

    /**
     * Запуск батчевого процессора
     */
    private startBatchProcessor(): void {
        this.batchTimer = setInterval(() => {
            this.processBatch();
        }, this.BATCH_TIMEOUT);
    }

    /**
     * Обработка батча уведомлений
     */
    private async processBatch(): Promise<void> {
        if (this.isProcessing || this.notificationQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const startTime = Date.now();

        try {
            // Сортируем по приоритету и времени
            this.notificationQueue.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return b.priority - a.priority; // Высокий приоритет первым
                }
                return a.timestamp - b.timestamp; // Раньше созданные первыми
            });

            // Берем батч для обработки
            const batch = this.notificationQueue.splice(0, this.BATCH_SIZE);

            if (batch.length === 0) {
                return;
            }

            // Параллельная обработка уведомлений
            const promises = batch.map((notification) =>
                this.sendNotificationWithRetry(notification),
            );

            await Promise.allSettled(promises);

            // Обновляем метрики
            const processingTime = Date.now() - startTime;
            this.updateMetrics(batch.length, processingTime);

            this.logger.log(
                `Processed batch of ${batch.length} notifications in ${processingTime}ms`,
            );
        } catch (error) {
            this.logger.error('Error processing notification batch:', error);
            this.metrics.errors++;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Отправка уведомления с повторными попытками
     */
    private async sendNotificationWithRetry(
        notification: (typeof this.notificationQueue)[0],
    ): Promise<void> {
        let retries = 0;

        while (retries < this.MAX_RETRIES) {
            try {
                await this.notificationService.sendNotification({
                    userId: notification.userId,
                    type: notification.type,
                    templateName: notification.templateName,
                    title: notification.title,
                    message: notification.message,
                    data: notification.data,
                });

                this.metrics.notificationsSent++;
                return;
            } catch (error) {
                retries++;

                if (retries >= this.MAX_RETRIES) {
                    this.logger.error(
                        `Failed to send notification after ${this.MAX_RETRIES} retries:`,
                        error,
                    );
                    this.metrics.errors++;
                    return;
                }

                // Экспоненциальная задержка
                const delay = this.RETRY_DELAY * Math.pow(2, retries - 1);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Добавление уведомления в очередь с проверкой лимита размера
     */
    private addToQueue(
        userId: number,
        type: NotificationType,
        templateKey: string,
        data?: Record<string, unknown>,
        priority: number = 1,
    ): void {
        const template = this.templateCache.get(templateKey);
        if (!template) {
            this.logger.warn(`Template not found for key: ${templateKey}`);
            return;
        }

        // Проверяем размер очереди
        if (this.notificationQueue.length >= this.MAX_QUEUE_SIZE) {
            // Пытаемся освободить место, удаляя самые старые уведомления с низким приоритетом
            const lowPriorityNotifications = this.notificationQueue.filter(
                (n) => n.priority <= 2,
            );

            if (lowPriorityNotifications.length > 0) {
                // Удаляем самое старое уведомление с низким приоритетом
                const oldestLowPriorityIndex = this.notificationQueue.findIndex(
                    (n) =>
                        n.priority <= 2 &&
                        n.timestamp ===
                            Math.min(
                                ...lowPriorityNotifications.map((n) => n.timestamp),
                            ),
                );

                if (oldestLowPriorityIndex !== -1) {
                    this.notificationQueue.splice(
                        oldestLowPriorityIndex,
                        1,
                    );
                    this.metrics.droppedNotifications++;
                    this.logger.warn(
                        `Queue is full. Dropped low-priority notification to make room. Queue size: ${this.notificationQueue.length}/${this.MAX_QUEUE_SIZE}`,
                    );
                } else {
                    // Если не нашли старое уведомление с низким приоритетом, просто отбрасываем новое
                    this.metrics.droppedNotifications++;
                    this.logger.error(
                        `Queue overflow! Dropping notification for user ${userId}, template ${templateKey}. Queue size: ${this.notificationQueue.length}/${this.MAX_QUEUE_SIZE}`,
                    );
                    return;
                }
            } else {
                // Если все уведомления с высоким приоритетом, отбрасываем новое
                this.metrics.droppedNotifications++;
                this.logger.error(
                    `Queue overflow! All notifications are high-priority. Dropping notification for user ${userId}, template ${templateKey}. Queue size: ${this.notificationQueue.length}/${this.MAX_QUEUE_SIZE}`,
                );
                return;
            }
        }

        // Добавляем уведомление в очередь
        this.notificationQueue.push({
            userId,
            type,
            templateName: template.templateName,
            title: template.title,
            message: template.message,
            data,
            priority,
            timestamp: Date.now(),
        });

        // Если очередь близка к переполнению, обрабатываем немедленно
        if (this.notificationQueue.length >= this.BATCH_SIZE * 2) {
            setImmediate(() => this.processBatch());
        }

        // Логируем предупреждение, если очередь заполнена более чем на 80%
        if (
            this.notificationQueue.length >=
            this.MAX_QUEUE_SIZE * 0.8
        ) {
            this.logger.warn(
                `Notification queue is ${Math.round(
                    (this.notificationQueue.length / this.MAX_QUEUE_SIZE) * 100,
                )}% full. Size: ${this.notificationQueue.length}/${this.MAX_QUEUE_SIZE}`,
            );
        }
    }

    /**
     * Обновление метрик производительности
     */
    private updateMetrics(
        processedCount: number,
        processingTime: number,
    ): void {
        this.metrics.eventsProcessed += processedCount;
        this.metrics.lastProcessedAt = Date.now();

        // Скользящее среднее времени обработки
        const alpha = 0.1; // Коэффициент сглаживания
        this.metrics.averageProcessingTime =
            this.metrics.averageProcessingTime * (1 - alpha) +
            processingTime * alpha;
    }

    /**
     * Получение метрик производительности
     */
    getMetrics(): {
        eventsProcessed: number;
        notificationsSent: number;
        errors: number;
        averageProcessingTime: number;
        lastProcessedAt: number;
        droppedNotifications: number;
        queueSize: number;
        maxQueueSize: number;
        queueUtilizationPercent: number;
        isProcessing: boolean;
    } {
        return {
            ...this.metrics,
            queueSize: this.notificationQueue.length,
            maxQueueSize: this.MAX_QUEUE_SIZE,
            queueUtilizationPercent: Math.round(
                (this.notificationQueue.length / this.MAX_QUEUE_SIZE) * 100,
            ),
            isProcessing: this.isProcessing,
        };
    }

    /**
     * Очистка ресурсов при завершении работы модуля
     * Обрабатывает оставшиеся уведомления с обработкой ошибок и graceful shutdown
     */
    async onModuleDestroy(): Promise<void> {
        this.logger.log('Shutting down notification event handler...');

        // Останавливаем таймер батчевой обработки
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
            this.batchTimer = null;
        }

        // Обрабатываем оставшиеся уведомления с обработкой ошибок
        const remainingCount = this.notificationQueue.length;
        if (remainingCount > 0) {
            this.logger.log(
                `Processing ${remainingCount} remaining notifications before shutdown...`,
            );

            try {
                // Обрабатываем все оставшиеся уведомления
                while (this.notificationQueue.length > 0) {
                    await this.processBatch();

                    // Защита от бесконечного цикла
                    if (this.notificationQueue.length > 0) {
                        // Если после обработки батча остались уведомления, делаем небольшую паузу
                        await new Promise((resolve) =>
                            setTimeout(resolve, 100),
                        );
                    }
                }

                this.logger.log(
                    `Successfully processed ${remainingCount} remaining notifications`,
                );
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';
                const errorStack =
                    error instanceof Error ? error.stack : undefined;

                this.logger.error(
                    `Critical error during shutdown while processing notifications: ${errorMessage}`,
                    errorStack,
                );

                // Сохраняем оставшиеся уведомления для последующей обработки
                const failedCount = this.notificationQueue.length;
                if (failedCount > 0) {
                    this.logger.warn(
                        `Failed to process ${failedCount} notifications during shutdown. They will be lost.`,
                    );

                    // В будущем здесь можно добавить сохранение в БД для последующей обработки
                    // await this.saveFailedNotificationsToDatabase();
                }

                // Не пробрасываем ошибку дальше, чтобы не блокировать завершение приложения
                // Но логируем критичность
                this.metrics.errors += failedCount;
            }
        } else {
            this.logger.log('No remaining notifications to process');
        }

        // Логируем финальные метрики
        const finalMetrics = this.getMetrics();
        this.logger.log(
            `Notification handler shutdown complete. Final metrics: ${JSON.stringify(finalMetrics)}`,
        );
    }

    /**
     * Обработчик события создания заказа
     */
    @OnEvent('order.created')
    async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
        const startTime = Date.now();

        try {
            // Добавляем в очередь с высоким приоритетом
            this.addToQueue(
                event.userId,
                NotificationType.EMAIL,
                'order.created',
                event.data,
                10, // Высокий приоритет для заказов
            );

            const processingTime = Date.now() - startTime;
            this.logger.log(
                `Order confirmation notification queued for order ${event.orderNumber} in ${processingTime}ms`,
            );
        } catch (error) {
            this.metrics.errors++;
            this.logger.error(
                `Failed to queue order confirmation notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Обработчик события изменения статуса заказа
     */
    @OnEvent('order.status.changed')
    async handleOrderStatusChanged(
        event: OrderStatusChangedEvent,
    ): Promise<void> {
        const startTime = Date.now();

        try {
            let templateKey: string;
            let priority = 8; // Высокий приоритет для статусов заказов

            switch (event.newStatus) {
                case 'processing':
                    templateKey = 'order.processing';
                    break;
                case 'shipped':
                    templateKey = 'order.shipped';
                    break;
                case 'delivered':
                    templateKey = 'order.delivered';
                    priority = 9; // Максимальный приоритет для доставки
                    break;
                case 'cancelled':
                    templateKey = 'order.cancelled';
                    priority = 9; // Максимальный приоритет для отмены
                    break;
                default:
                    templateKey = 'order.status.update';
            }

            this.addToQueue(
                event.userId,
                NotificationType.EMAIL,
                templateKey,
                event.data,
                priority,
            );

            const processingTime = Date.now() - startTime;
            this.logger.log(
                `Order status notification queued for order ${event.orderNumber}: ${event.newStatus} in ${processingTime}ms`,
            );
        } catch (error) {
            this.metrics.errors++;
            this.logger.error(
                `Failed to queue order status notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Обработчик события регистрации пользователя
     */
    @OnEvent('user.registered')
    async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
        const startTime = Date.now();

        try {
            this.addToQueue(
                event.userId,
                NotificationType.EMAIL,
                'user.registered',
                event.data,
                7, // Средний приоритет для регистрации
            );

            const processingTime = Date.now() - startTime;
            this.logger.log(
                `Welcome notification queued for user ${event.userId} in ${processingTime}ms`,
            );
        } catch (error) {
            this.metrics.errors++;
            this.logger.error(
                `Failed to queue welcome notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Обработчик события завершения оплаты
     */
    @OnEvent('payment.completed')
    async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
        const startTime = Date.now();

        try {
            this.addToQueue(
                event.userId,
                NotificationType.EMAIL,
                'payment.completed',
                event.data,
                9, // Максимальный приоритет для оплаты
            );

            const processingTime = Date.now() - startTime;
            this.logger.log(
                `Payment confirmation notification queued for order ${event.orderNumber} in ${processingTime}ms`,
            );
        } catch (error) {
            this.metrics.errors++;
            this.logger.error(
                `Failed to queue payment confirmation notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Обработчик события отправки товара
     */
    @OnEvent('order.shipped')
    async handleOrderShipped(event: OrderShippedEvent): Promise<void> {
        const startTime = Date.now();

        try {
            this.addToQueue(
                event.userId,
                NotificationType.EMAIL,
                'order.shipped',
                event.data,
                8, // Высокий приоритет для отправки
            );

            const processingTime = Date.now() - startTime;
            this.logger.log(
                `Order shipped notification queued for order ${event.orderNumber} in ${processingTime}ms`,
            );
        } catch (error) {
            this.metrics.errors++;
            this.logger.error(
                `Failed to queue order shipped notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Обработчик события доставки заказа
     */
    @OnEvent('order.delivered')
    async handleOrderDelivered(event: OrderDeliveredEvent): Promise<void> {
        const startTime = Date.now();

        try {
            this.addToQueue(
                event.userId,
                NotificationType.EMAIL,
                'order.delivered',
                event.data,
                9, // Максимальный приоритет для доставки
            );

            const processingTime = Date.now() - startTime;
            this.logger.log(
                `Order delivered notification queued for order ${event.orderNumber} in ${processingTime}ms`,
            );
        } catch (error) {
            this.metrics.errors++;
            this.logger.error(
                `Failed to queue order delivered notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Обработчик события отмены заказа
     */
    @OnEvent('order.cancelled')
    async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
        const startTime = Date.now();

        try {
            this.addToQueue(
                event.userId,
                NotificationType.EMAIL,
                'order.cancelled',
                event.data,
                9, // Максимальный приоритет для отмены
            );

            const processingTime = Date.now() - startTime;
            this.logger.log(
                `Order cancelled notification queued for order ${event.orderNumber} in ${processingTime}ms`,
            );
        } catch (error) {
            this.metrics.errors++;
            this.logger.error(
                `Failed to queue order cancelled notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Обработчик события изменения пароля
     */
    @OnEvent('password.changed')
    async handlePasswordChanged(event: PasswordChangedEvent): Promise<void> {
        const startTime = Date.now();

        try {
            this.addToQueue(
                event.userId,
                NotificationType.EMAIL,
                'password.changed',
                event.data,
                6, // Средний приоритет для смены пароля
            );

            const processingTime = Date.now() - startTime;
            this.logger.log(
                `Password changed notification queued for user ${event.userId} in ${processingTime}ms`,
            );
        } catch (error) {
            this.metrics.errors++;
            this.logger.error(
                `Failed to queue password changed notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Обработчик события запроса сброса пароля
     */
    @OnEvent('password.reset.requested')
    async handlePasswordResetRequested(
        event: PasswordResetRequestedEvent,
    ): Promise<void> {
        const startTime = Date.now();

        try {
            this.addToQueue(
                event.userId,
                NotificationType.EMAIL,
                'password.reset.requested',
                event.data,
                7, // Средний приоритет для сброса пароля
            );

            const processingTime = Date.now() - startTime;
            this.logger.log(
                `Password reset notification queued for user ${event.userId} in ${processingTime}ms`,
            );
        } catch (error) {
            this.metrics.errors++;
            this.logger.error(
                `Failed to queue password reset notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Обработчик события верификации email
     */
    @OnEvent('email.verification')
    async handleEmailVerification(
        event: EmailVerificationEvent,
    ): Promise<void> {
        const startTime = Date.now();

        try {
            this.addToQueue(
                event.userId,
                NotificationType.EMAIL,
                'email.verification',
                event.data,
                5, // Низкий приоритет для верификации
            );

            const processingTime = Date.now() - startTime;
            this.logger.log(
                `Email verification notification queued for user ${event.userId} in ${processingTime}ms`,
            );
        } catch (error) {
            this.metrics.errors++;
            this.logger.error(
                `Failed to queue email verification notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Обработчик события маркетинговой рассылки
     */
    @OnEvent('marketing.campaign')
    async handleMarketingCampaign(
        event: MarketingCampaignEvent,
    ): Promise<void> {
        const startTime = Date.now();

        try {
            // Маркетинговые уведомления имеют низкий приоритет
            this.addToQueue(
                event.userId,
                NotificationType.EMAIL,
                'marketing.campaign',
                {
                    ...event.data,
                    campaignName: event.campaignName,
                    campaignId: event.campaignId,
                },
                1, // Минимальный приоритет для маркетинга
            );

            const processingTime = Date.now() - startTime;
            this.logger.log(
                `Marketing campaign notification queued for user ${event.userId}, campaign ${event.campaignId} in ${processingTime}ms`,
            );
        } catch (error) {
            this.metrics.errors++;
            this.logger.error(
                `Failed to queue marketing campaign notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }
}
