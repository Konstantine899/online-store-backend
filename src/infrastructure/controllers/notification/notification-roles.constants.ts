/**
 * Константы ролей для системы уведомлений
 * Обеспечивают тенантскую изоляцию и иерархию доступа
 */

// Платформенные роли (глобальный доступ)
export const PLATFORM_ROLES = ['SUPER_ADMIN', 'PLATFORM_ADMIN'] as const;

// Тенантские административные роли
export const TENANT_ADMIN_ROLES = ['TENANT_OWNER', 'TENANT_ADMIN'] as const;

// Роли менеджеров (управление уведомлениями)
export const MANAGER_ROLES = ['MANAGER', 'CONTENT_MANAGER'] as const;

// Роли персонала (просмотр и обслуживание)
export const STAFF_ROLES = ['CUSTOMER_SERVICE'] as const;

// Клиентские роли (управление своими уведомлениями)
export const CUSTOMER_ROLES = [
    'VIP_CUSTOMER',
    'WHOLESALE',
    'CUSTOMER',
    'AFFILIATE',
] as const;

// Гостевые роли (ограниченный доступ)
export const GUEST_ROLES = ['GUEST'] as const;

// Legacy роли для обратной совместимости
export const LEGACY_ROLES = ['ADMIN', 'USER'] as const;

// Группировка ролей по уровням доступа
export const ADMIN_ROLES = [
    ...PLATFORM_ROLES,
    ...TENANT_ADMIN_ROLES,
    ...LEGACY_ROLES.filter((role) => role === 'ADMIN'),
] as const;

export const ALL_ROLES = [
    ...PLATFORM_ROLES,
    ...TENANT_ADMIN_ROLES,
    ...MANAGER_ROLES,
    ...STAFF_ROLES,
    ...CUSTOMER_ROLES,
    ...GUEST_ROLES,
    ...LEGACY_ROLES,
] as const;

// Типы для TypeScript
export type PlatformRole = (typeof PLATFORM_ROLES)[number];
export type TenantAdminRole = (typeof TENANT_ADMIN_ROLES)[number];
export type ManagerRole = (typeof MANAGER_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type CustomerRole = (typeof CUSTOMER_ROLES)[number];
export type GuestRole = (typeof GUEST_ROLES)[number];
export type LegacyRole = (typeof LEGACY_ROLES)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AllRole = (typeof ALL_ROLES)[number];

// Константы для проверки доступа
export const NOTIFICATION_ACCESS_LEVELS = {
    // Полный доступ ко всем уведомлениям (платформенные роли)
    PLATFORM_FULL: PLATFORM_ROLES,

    // Доступ к уведомлениям тенанта (тенантские роли)
    TENANT_FULL: TENANT_ADMIN_ROLES,

    // Управление шаблонами и настройками (менеджеры)
    TEMPLATE_MANAGEMENT: [...TENANT_ADMIN_ROLES, ...MANAGER_ROLES],

    // Просмотр статистики (менеджеры и персонал)
    STATISTICS_VIEW: [...TENANT_ADMIN_ROLES, ...MANAGER_ROLES, ...STAFF_ROLES],

    // Управление своими уведомлениями (клиенты)
    PERSONAL_MANAGEMENT: CUSTOMER_ROLES,

    // Просмотр уведомлений (все авторизованные)
    NOTIFICATION_VIEW: [
        ...CUSTOMER_ROLES,
        ...STAFF_ROLES,
        ...MANAGER_ROLES,
        ...TENANT_ADMIN_ROLES,
        ...PLATFORM_ROLES,
    ],
} as const;
