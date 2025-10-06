/**
 * Экспорт событий и обработчиков уведомлений
 * 
 * Оптимизировано для производительности:
 * - Баррель-экспорты для быстрого импорта
 * - Группировка связанных модулей
 * - Минимизация циклических зависимостей
 */

// События уведомлений
export * from './notification.events';

// Обработчики событий
export * from './notification.event-handler';

// Типы для TypeScript
export type { 
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
