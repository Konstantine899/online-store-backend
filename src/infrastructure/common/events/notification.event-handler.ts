import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '@app/infrastructure/services/notification/notification.service';
import { NotificationType } from '@app/domain/models';
import {
    OrderCreatedEvent,
    OrderStatusChangedEvent,
    UserRegisteredEvent,
    PaymentCompletedEvent,
    OrderShippedEvent,
    OrderDeliveredEvent,
    OrderCancelledEvent,
    PasswordChangedEvent,
    PasswordResetRequestedEvent,
    EmailVerificationEvent,
    MarketingCampaignEvent,
} from './notification.events';

/**
 * Обработчик событий для автоматической отправки уведомлений
 */
@Injectable()
export class NotificationEventHandler {
    private readonly logger = new Logger(NotificationEventHandler.name);

    constructor(
        private readonly notificationService: NotificationService,
    ) {}

    /**
     * Обработчик события создания заказа
     */
    @OnEvent('order.created')
    async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
        try {
            await this.notificationService.sendNotification({
                userId: event.userId,
                type: NotificationType.EMAIL,
                templateName: 'order_confirmation',
                title: 'Заказ подтвержден',
                message: 'Ваш заказ успешно создан',
                data: event.data,
            });

            this.logger.log(`Order confirmation notification sent for order ${event.orderNumber}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to send order confirmation notification: ${errorMessage}`, errorStack);
        }
    }

    /**
     * Обработчик события изменения статуса заказа
     */
    @OnEvent('order.status.changed')
    async handleOrderStatusChanged(event: OrderStatusChangedEvent): Promise<void> {
        try {
            let templateName: string;
            let title: string;
            let message: string;

            switch (event.newStatus) {
                case 'processing':
                    templateName = 'order_processing';
                    title = 'Заказ в обработке';
                    message = 'Ваш заказ принят в обработку';
                    break;
                case 'shipped':
                    templateName = 'order_shipped';
                    title = 'Заказ отправлен';
                    message = 'Ваш заказ отправлен';
                    break;
                case 'delivered':
                    templateName = 'order_delivered';
                    title = 'Заказ доставлен';
                    message = 'Ваш заказ успешно доставлен';
                    break;
                case 'cancelled':
                    templateName = 'order_cancelled';
                    title = 'Заказ отменен';
                    message = 'Ваш заказ был отменен';
                    break;
                default:
                    templateName = 'order_status_update';
                    title = 'Обновление статуса заказа';
                    message = 'Статус вашего заказа обновлен';
            }

            await this.notificationService.sendNotification({
                userId: event.userId,
                type: NotificationType.EMAIL,
                templateName,
                title,
                message,
                data: event.data,
            });

            this.logger.log(`Order status notification sent for order ${event.orderNumber}: ${event.newStatus}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to send order status notification: ${errorMessage}`, errorStack);
        }
    }

    /**
     * Обработчик события регистрации пользователя
     */
    @OnEvent('user.registered')
    async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
        try {
            await this.notificationService.sendNotification({
                userId: event.userId,
                type: NotificationType.EMAIL,
                templateName: 'welcome_email',
                title: 'Добро пожаловать!',
                message: 'Спасибо за регистрацию в нашем магазине',
                data: event.data,
            });

            this.logger.log(`Welcome notification sent for user ${event.userId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to send welcome notification: ${errorMessage}`, errorStack);
        }
    }

    /**
     * Обработчик события завершения оплаты
     */
    @OnEvent('payment.completed')
    async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
        try {
            await this.notificationService.sendNotification({
                userId: event.userId,
                type: NotificationType.EMAIL,
                templateName: 'payment_confirmation',
                title: 'Оплата подтверждена',
                message: 'Ваш платеж успешно обработан',
                data: event.data,
            });

            this.logger.log(`Payment confirmation notification sent for order ${event.orderNumber}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to send payment confirmation notification: ${errorMessage}`, errorStack);
        }
    }

    /**
     * Обработчик события отправки товара
     */
    @OnEvent('order.shipped')
    async handleOrderShipped(event: OrderShippedEvent): Promise<void> {
        try {
            await this.notificationService.sendNotification({
                userId: event.userId,
                type: NotificationType.EMAIL,
                templateName: 'order_shipped',
                title: 'Заказ отправлен',
                message: 'Ваш заказ отправлен и находится в пути',
                data: event.data,
            });

            this.logger.log(`Order shipped notification sent for order ${event.orderNumber}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to send order shipped notification: ${errorMessage}`, errorStack);
        }
    }

    /**
     * Обработчик события доставки заказа
     */
    @OnEvent('order.delivered')
    async handleOrderDelivered(event: OrderDeliveredEvent): Promise<void> {
        try {
            await this.notificationService.sendNotification({
                userId: event.userId,
                type: NotificationType.EMAIL,
                templateName: 'order_delivered',
                title: 'Заказ доставлен',
                message: 'Ваш заказ успешно доставлен',
                data: event.data,
            });

            this.logger.log(`Order delivered notification sent for order ${event.orderNumber}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to send order delivered notification: ${errorMessage}`, errorStack);
        }
    }

    /**
     * Обработчик события отмены заказа
     */
    @OnEvent('order.cancelled')
    async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
        try {
            await this.notificationService.sendNotification({
                userId: event.userId,
                type: NotificationType.EMAIL,
                templateName: 'order_cancelled',
                title: 'Заказ отменен',
                message: 'Ваш заказ был отменен',
                data: event.data,
            });

            this.logger.log(`Order cancelled notification sent for order ${event.orderNumber}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to send order cancelled notification: ${errorMessage}`, errorStack);
        }
    }

    /**
     * Обработчик события изменения пароля
     */
    @OnEvent('password.changed')
    async handlePasswordChanged(event: PasswordChangedEvent): Promise<void> {
        try {
            await this.notificationService.sendNotification({
                userId: event.userId,
                type: NotificationType.EMAIL,
                templateName: 'password_changed',
                title: 'Пароль изменен',
                message: 'Ваш пароль был успешно изменен',
                data: event.data,
            });

            this.logger.log(`Password changed notification sent for user ${event.userId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to send password changed notification: ${errorMessage}`, errorStack);
        }
    }

    /**
     * Обработчик события запроса сброса пароля
     */
    @OnEvent('password.reset.requested')
    async handlePasswordResetRequested(event: PasswordResetRequestedEvent): Promise<void> {
        try {
            await this.notificationService.sendNotification({
                userId: event.userId,
                type: NotificationType.EMAIL,
                templateName: 'password_reset',
                title: 'Сброс пароля',
                message: 'Запрос на сброс пароля',
                data: event.data,
            });

            this.logger.log(`Password reset notification sent for user ${event.userId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to send password reset notification: ${errorMessage}`, errorStack);
        }
    }

    /**
     * Обработчик события верификации email
     */
    @OnEvent('email.verification')
    async handleEmailVerification(event: EmailVerificationEvent): Promise<void> {
        try {
            await this.notificationService.sendNotification({
                userId: event.userId,
                type: NotificationType.EMAIL,
                templateName: 'email_verification',
                title: 'Подтверждение email',
                message: 'Подтвердите ваш email адрес',
                data: event.data,
            });

            this.logger.log(`Email verification notification sent for user ${event.userId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to send email verification notification: ${errorMessage}`, errorStack);
        }
    }

    /**
     * Обработчик события маркетинговой рассылки
     */
    @OnEvent('marketing.campaign')
    async handleMarketingCampaign(event: MarketingCampaignEvent): Promise<void> {
        try {
            await this.notificationService.sendNotification({
                userId: event.userId,
                type: NotificationType.EMAIL,
                templateName: 'marketing_campaign',
                title: event.campaignName,
                message: 'Специальное предложение для вас',
                data: event.data,
            });

            this.logger.log(`Marketing campaign notification sent for user ${event.userId}, campaign ${event.campaignId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to send marketing campaign notification: ${errorMessage}`, errorStack);
        }
    }
}
