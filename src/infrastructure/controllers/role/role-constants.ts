/**
 * Role Constants and Hierarchy
 *
 * Определяет полную иерархию ролей для мультитенантного SaaS:
 * - System Roles (Platform Level): level 80-100
 * - Tenant Roles (Store Level): level 35-70
 * - Customer Roles (User Level): level 5-30
 *
 * @see .cursor/rules/SaaS/models/role.mdc для полной спецификации
 */

// ============================================================================
// SYSTEM ROLES (Platform Level, level 80-100)
// ============================================================================

/**
 * Роли супер-администраторов платформы
 * Полный доступ ко всем ресурсам и тенантам
 */
export const SYSTEM_ADMIN_ROLES = [
    'SUPER_ADMIN', // level: 100 - Супер-администратор платформы
    'PLATFORM_ADMIN', // level: 90  - Администратор платформы
] as const;

/**
 * Все системные роли платформы
 * Доступ к платформенным функциям (биллинг, поддержка)
 */
export const SYSTEM_ROLES = [
    ...SYSTEM_ADMIN_ROLES,
    'BILLING_ADMIN', // level: 85  - Администратор биллинга
    'SUPPORT', // level: 80  - Техническая поддержка
] as const;

// ============================================================================
// TENANT ROLES (Store Level, level 35-70)
// ============================================================================

/**
 * Роли владельцев магазинов
 * Полный доступ к управлению своим тенантом
 */
export const TENANT_OWNER_ROLES = [
    'TENANT_OWNER', // level: 70  - Владелец магазина
] as const;

/**
 * Роли администраторов магазинов
 * Управление магазином и пользователями
 */
export const TENANT_ADMIN_ROLES = [
    ...TENANT_OWNER_ROLES,
    'TENANT_ADMIN', // level: 60  - Администратор магазина
] as const;

/**
 * Роли менеджеров магазинов
 * Управление продуктами, заказами, контентом
 */
export const MANAGER_ROLES = [
    ...TENANT_ADMIN_ROLES,
    'MANAGER', // level: 50  - Менеджер магазина
    'CONTENT_MANAGER', // level: 40  - Контент-менеджер
] as const;

/**
 * Все роли персонала магазина
 * Включает менеджеров и службу поддержки
 */
export const STAFF_ROLES = [
    ...MANAGER_ROLES,
    'CUSTOMER_SERVICE', // level: 35  - Служба поддержки клиентов
] as const;

// ============================================================================
// CUSTOMER ROLES (User Level, level 5-30)
// ============================================================================

/**
 * Роли клиентов магазина
 * Покупки и взаимодействие с магазином
 */
export const CUSTOMER_ROLES = [
    'VIP_CUSTOMER', // level: 30  - VIP клиент
    'WHOLESALE', // level: 25  - Оптовый покупатель
    'CUSTOMER', // level: 20  - Обычный клиент
    'AFFILIATE', // level: 15  - Партнёр (реферальная программа)
] as const;

/**
 * Гостевые роли
 * Ограниченный доступ без регистрации
 */
export const GUEST_ROLES = [
    'GUEST', // level: 5   - Гость (без регистрации)
] as const;

// ============================================================================
// AGGREGATED ROLES (для удобства использования в Guards)
// ============================================================================

/**
 * Все административные роли
 * Объединяет системных и тенантских админов
 */
export const ADMIN_ROLES = [
    ...SYSTEM_ADMIN_ROLES,
    ...TENANT_ADMIN_ROLES,
] as const;

/**
 * Все возможные роли в системе
 */
export const ALL_ROLES = [
    ...SYSTEM_ROLES,
    ...STAFF_ROLES,
    ...CUSTOMER_ROLES,
    ...GUEST_ROLES,
] as const;

// ============================================================================
// ROLE LEVELS MAP (для проверки иерархии)
// ============================================================================

/**
 * Маппинг ролей на их уровни в иерархии
 * Используется для проверки прав доступа:
 * - Высший уровень (100) имеет доступ ко всем нижним уровням
 * - Роль может управлять только ролями с меньшим level
 */
export const ROLE_LEVELS: Record<string, number> = {
    // System Roles (Platform)
    SUPER_ADMIN: 100,
    PLATFORM_ADMIN: 90,
    BILLING_ADMIN: 85,
    SUPPORT: 80,

    // Tenant Roles (Store)
    TENANT_OWNER: 70,
    TENANT_ADMIN: 60,
    MANAGER: 50,
    CONTENT_MANAGER: 40,
    CUSTOMER_SERVICE: 35,

    // Customer Roles (User)
    VIP_CUSTOMER: 30,
    WHOLESALE: 25,
    CUSTOMER: 20,
    AFFILIATE: 15,
    GUEST: 5,
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SystemAdminRole = (typeof SYSTEM_ADMIN_ROLES)[number];
export type SystemRole = (typeof SYSTEM_ROLES)[number];
export type TenantOwnerRole = (typeof TENANT_OWNER_ROLES)[number];
export type TenantAdminRole = (typeof TENANT_ADMIN_ROLES)[number];
export type ManagerRole = (typeof MANAGER_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type CustomerRole = (typeof CUSTOMER_ROLES)[number];
export type GuestRole = (typeof GUEST_ROLES)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AllRoles = (typeof ALL_ROLES)[number];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Получить уровень роли
 * @param role - Название роли
 * @returns Уровень роли (0-100) или 0 если роль не найдена
 */
export function getRoleLevel(role: string): number {
    return ROLE_LEVELS[role] || 0;
}

/**
 * Проверить, может ли роль управлять другой ролью
 * @param managerRole - Роль менеджера
 * @param targetRole - Целевая роль для управления
 * @returns true если managerRole может управлять targetRole
 */
export function canManageRole(
    managerRole: string,
    targetRole: string,
): boolean {
    const managerLevel = getRoleLevel(managerRole);
    const targetLevel = getRoleLevel(targetRole);

    // Можно управлять только ролями с меньшим уровнем
    return managerLevel > targetLevel;
}

/**
 * Проверить, является ли роль системной (платформенной)
 * @param role - Название роли
 * @returns true если роль системная
 */
export function isSystemRole(role: string): boolean {
    return (SYSTEM_ROLES as readonly string[]).includes(role);
}

/**
 * Проверить, является ли роль тенантской
 * @param role - Название роли
 * @returns true если роль тенантская
 */
export function isTenantRole(role: string): boolean {
    return (
        (STAFF_ROLES as readonly string[]).includes(role) && !isSystemRole(role)
    );
}

/**
 * Проверить, является ли роль клиентской
 * @param role - Название роли
 * @returns true если роль клиентская
 */
export function isCustomerRole(role: string): boolean {
    return ([...CUSTOMER_ROLES, ...GUEST_ROLES] as readonly string[]).includes(
        role,
    );
}

/**
 * Получить все роли, которыми может управлять данная роль
 * @param managerRole - Роль менеджера
 * @returns Массив ролей, доступных для управления
 */
export function getManageableRoles(managerRole: string): string[] {
    const managerLevel = getRoleLevel(managerRole);

    return ALL_ROLES.filter((role) => {
        const targetLevel = getRoleLevel(role);
        return targetLevel < managerLevel;
    });
}
