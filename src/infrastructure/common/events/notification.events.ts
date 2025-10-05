import { NotificationType } from '@app/domain/models';

/**
 * Базовый класс для всех событий уведомлений
 */
export abstract class NotificationEvent {
    abstract readonly eventName: string;
    abstract readonly userId: number;
    abstract readonly data: Record<string, unknown>;
}

/**
 * Событие создания заказа
 */
export class OrderCreatedEvent extends NotificationEvent {
    readonly eventName = 'order.created';
    
    constructor(
        public readonly userId: number,
        public readonly orderId: number,
        public readonly orderNumber: string,
        public readonly totalAmount: number,
        public readonly data: Record<string, unknown> = {}
    ) {
        super();
        this.data = {
            orderId: this.orderId,
            orderNumber: this.orderNumber,
            totalAmount: this.totalAmount,
            ...this.data
        };
    }
}

/**
 * Событие изменения статуса заказа
 */
export class OrderStatusChangedEvent extends NotificationEvent {
    readonly eventName = 'order.status.changed';
    
    constructor(
        public readonly userId: number,
        public readonly orderId: number,
        public readonly orderNumber: string,
        public readonly oldStatus: string,
        public readonly newStatus: string,
        public readonly data: Record<string, unknown> = {}
    ) {
        super();
        this.data = {
            orderId: this.orderId,
            orderNumber: this.orderNumber,
            oldStatus: this.oldStatus,
            newStatus: this.newStatus,
            ...this.data
        };
    }
}

/**
 * Событие регистрации пользователя
 */
export class UserRegisteredEvent extends NotificationEvent {
    readonly eventName = 'user.registered';
    
    constructor(
        public readonly userId: number,
        public readonly email: string,
        public readonly firstName: string,
        public readonly data: Record<string, unknown> = {}
    ) {
        super();
        this.data = {
            email: this.email,
            firstName: this.firstName,
            ...this.data
        };
    }
}

/**
 * Событие завершения оплаты
 */
export class PaymentCompletedEvent extends NotificationEvent {
    readonly eventName = 'payment.completed';
    
    constructor(
        public readonly userId: number,
        public readonly orderId: number,
        public readonly orderNumber: string,
        public readonly amount: number,
        public readonly paymentMethod: string,
        public readonly data: Record<string, unknown> = {}
    ) {
        super();
        this.data = {
            orderId: this.orderId,
            orderNumber: this.orderNumber,
            amount: this.amount,
            paymentMethod: this.paymentMethod,
            ...this.data
        };
    }
}

/**
 * Событие отправки товара
 */
export class OrderShippedEvent extends NotificationEvent {
    readonly eventName = 'order.shipped';
    
    constructor(
        public readonly userId: number,
        public readonly orderId: number,
        public readonly orderNumber: string,
        public readonly trackingNumber: string,
        public readonly shippingMethod: string,
        public readonly data: Record<string, unknown> = {}
    ) {
        super();
        this.data = {
            orderId: this.orderId,
            orderNumber: this.orderNumber,
            trackingNumber: this.trackingNumber,
            shippingMethod: this.shippingMethod,
            ...this.data
        };
    }
}

/**
 * Событие доставки заказа
 */
export class OrderDeliveredEvent extends NotificationEvent {
    readonly eventName = 'order.delivered';
    
    constructor(
        public readonly userId: number,
        public readonly orderId: number,
        public readonly orderNumber: string,
        public readonly deliveryDate: Date,
        public readonly data: Record<string, unknown> = {}
    ) {
        super();
        this.data = {
            orderId: this.orderId,
            orderNumber: this.orderNumber,
            deliveryDate: this.deliveryDate,
            ...this.data
        };
    }
}

/**
 * Событие отмены заказа
 */
export class OrderCancelledEvent extends NotificationEvent {
    readonly eventName = 'order.cancelled';
    
    constructor(
        public readonly userId: number,
        public readonly orderId: number,
        public readonly orderNumber: string,
        public readonly reason: string,
        public readonly data: Record<string, unknown> = {}
    ) {
        super();
        this.data = {
            orderId: this.orderId,
            orderNumber: this.orderNumber,
            reason: this.reason,
            ...this.data
        };
    }
}

/**
 * Событие изменения пароля
 */
export class PasswordChangedEvent extends NotificationEvent {
    readonly eventName = 'password.changed';
    
    constructor(
        public readonly userId: number,
        public readonly email: string,
        public readonly data: Record<string, unknown> = {}
    ) {
        super();
        this.data = {
            email: this.email,
            ...this.data
        };
    }
}

/**
 * Событие сброса пароля
 */
export class PasswordResetRequestedEvent extends NotificationEvent {
    readonly eventName = 'password.reset.requested';
    
    constructor(
        public readonly userId: number,
        public readonly email: string,
        public readonly resetToken: string,
        public readonly data: Record<string, unknown> = {}
    ) {
        super();
        this.data = {
            email: this.email,
            resetToken: this.resetToken,
            ...this.data
        };
    }
}

/**
 * Событие верификации email
 */
export class EmailVerificationEvent extends NotificationEvent {
    readonly eventName = 'email.verification';
    
    constructor(
        public readonly userId: number,
        public readonly email: string,
        public readonly verificationToken: string,
        public readonly data: Record<string, unknown> = {}
    ) {
        super();
        this.data = {
            email: this.email,
            verificationToken: this.verificationToken,
            ...this.data
        };
    }
}

/**
 * Событие маркетинговой рассылки
 */
export class MarketingCampaignEvent extends NotificationEvent {
    readonly eventName = 'marketing.campaign';
    
    constructor(
        public readonly userId: number,
        public readonly campaignId: number,
        public readonly campaignName: string,
        public readonly data: Record<string, unknown> = {}
    ) {
        super();
        this.data = {
            campaignId: this.campaignId,
            campaignName: this.campaignName,
            ...this.data
        };
    }
}
