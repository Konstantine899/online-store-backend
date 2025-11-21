import type { QueryInterface } from 'sequelize';

/**
 * Seed для заполнения таблицы roles базовыми ролями системы
 *
 * Создаёт 14 ролей с полной иерархией (уровни 5-100):
 * - 4 системные роли (SUPER_ADMIN, PLATFORM_ADMIN, BILLING_ADMIN, SUPPORT)
 * - 5 тенантских ролей (TENANT_OWNER, TENANT_ADMIN, MANAGER, CONTENT_MANAGER, CUSTOMER_SERVICE)
 * - 5 клиентских ролей (VIP_CUSTOMER, WHOLESALE, CUSTOMER, AFFILIATE, GUEST)
 *
 * Каждая роль включает:
 * - level: уровень иерархии (0-100)
 * - permissions: массив разрешений [{ resource, action }]
 * - is_system_role: true для платформенных ролей
 * - tenant_id: NULL (роли-шаблоны, тенанты клонируют их)
 */

interface Seeder {
    up(queryInterface: QueryInterface): Promise<void>;
    down(queryInterface: QueryInterface): Promise<void>;
}

const seeder: Seeder = {
    async up(queryInterface: QueryInterface): Promise<void> {
        // Идемпотентность: удаляем только системные роли (сохраняем кастомные роли тенантов)
        await queryInterface.bulkDelete(
            'roles',
            {
                is_system_role: true,
            },
            {},
        );

        await queryInterface.bulkInsert('roles', [
            // ================================================================
            // SYSTEM ROLES (Platform Level, is_system_role: true)
            // ================================================================

            {
                role: 'SUPER_ADMIN',
                description:
                    'Супер-администратор платформы (полный доступ ко всем ресурсам)',
                level: 100,
                permissions: JSON.stringify([
                    { resource: '*', action: '*' }, // Wildcard: полный доступ
                ]),
                is_system_role: true,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'PLATFORM_ADMIN',
                description: 'Администратор платформы (управление тенантами)',
                level: 90,
                permissions: JSON.stringify([
                    { resource: 'tenants', action: 'manage' },
                    { resource: 'users', action: 'read' },
                    { resource: 'billing', action: 'read' },
                    { resource: 'analytics', action: 'read' },
                    { resource: 'support', action: 'read' },
                ]),
                is_system_role: true,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'BILLING_ADMIN',
                description:
                    'Администратор биллинга (управление подписками и платежами)',
                level: 85,
                permissions: JSON.stringify([
                    { resource: 'billing', action: 'manage' },
                    { resource: 'tenants', action: 'read' },
                    { resource: 'analytics', action: 'read' },
                ]),
                is_system_role: true,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'SUPPORT',
                description:
                    'Техническая поддержка (просмотр заказов и пользователей)',
                level: 80,
                permissions: JSON.stringify([
                    { resource: 'users', action: 'read' },
                    { resource: 'orders', action: 'read' },
                    { resource: 'support', action: 'manage' },
                    { resource: 'tenants', action: 'read' },
                ]),
                is_system_role: true,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },

            // ================================================================
            // TENANT ROLES (Store Level, is_system_role: false)
            // ================================================================

            {
                role: 'TENANT_OWNER',
                description:
                    'Владелец магазина (полный доступ к управлению магазином)',
                level: 70,
                permissions: JSON.stringify([
                    { resource: 'tenant', action: 'manage' },
                    { resource: 'users', action: 'manage' },
                    { resource: 'roles', action: 'manage' },
                    { resource: 'products', action: 'manage' },
                    { resource: 'categories', action: 'manage' },
                    { resource: 'orders', action: 'manage' },
                    { resource: 'cart', action: 'read' },
                    { resource: 'analytics', action: 'read' },
                    { resource: 'billing', action: 'read' },
                ]),
                is_system_role: false,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'TENANT_ADMIN',
                description:
                    'Администратор магазина (управление товарами и заказами)',
                level: 60,
                permissions: JSON.stringify([
                    { resource: 'users', action: 'manage' },
                    { resource: 'products', action: 'manage' },
                    { resource: 'categories', action: 'manage' },
                    { resource: 'orders', action: 'manage' },
                    { resource: 'cart', action: 'read' },
                    { resource: 'analytics', action: 'read' },
                ]),
                is_system_role: false,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'MANAGER',
                description:
                    'Менеджер магазина (управление продуктами и заказами)',
                level: 50,
                permissions: JSON.stringify([
                    { resource: 'products', action: 'manage' },
                    { resource: 'categories', action: 'read' },
                    { resource: 'orders', action: 'manage' },
                    { resource: 'users', action: 'read' },
                ]),
                is_system_role: false,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'CONTENT_MANAGER',
                description:
                    'Контент-менеджер (редактирование продуктов и категорий)',
                level: 40,
                permissions: JSON.stringify([
                    { resource: 'products', action: 'update' },
                    { resource: 'products', action: 'read' },
                    { resource: 'categories', action: 'manage' },
                ]),
                is_system_role: false,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'CUSTOMER_SERVICE',
                description:
                    'Служба поддержки клиентов (просмотр заказов и пользователей)',
                level: 35,
                permissions: JSON.stringify([
                    { resource: 'orders', action: 'read' },
                    { resource: 'orders', action: 'update' },
                    { resource: 'users', action: 'read' },
                    { resource: 'support', action: 'manage' },
                ]),
                is_system_role: false,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },

            // ================================================================
            // CUSTOMER ROLES (User Level, is_system_role: false)
            // ================================================================

            {
                role: 'VIP_CUSTOMER',
                description: 'VIP клиент (премиум покупатель с бонусами)',
                level: 30,
                permissions: JSON.stringify([
                    { resource: 'products', action: 'read' },
                    { resource: 'categories', action: 'read' },
                    { resource: 'cart', action: 'manage' },
                    { resource: 'orders', action: 'create' },
                    { resource: 'orders', action: 'read' }, // только свои
                    { resource: 'analytics', action: 'read' }, // свои покупки
                ]),
                is_system_role: false,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'WHOLESALE',
                description: 'Оптовый покупатель (специальные цены)',
                level: 25,
                permissions: JSON.stringify([
                    { resource: 'products', action: 'read' },
                    { resource: 'categories', action: 'read' },
                    { resource: 'cart', action: 'manage' },
                    { resource: 'orders', action: 'create' },
                    { resource: 'orders', action: 'read' }, // только свои
                ]),
                is_system_role: false,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'CUSTOMER',
                description: 'Обычный клиент (стандартные покупки)',
                level: 20,
                permissions: JSON.stringify([
                    { resource: 'products', action: 'read' },
                    { resource: 'categories', action: 'read' },
                    { resource: 'cart', action: 'manage' },
                    { resource: 'orders', action: 'create' },
                    { resource: 'orders', action: 'read' }, // только свои
                ]),
                is_system_role: false,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'AFFILIATE',
                description: 'Партнёр (реферальная программа)',
                level: 15,
                permissions: JSON.stringify([
                    { resource: 'products', action: 'read' },
                    { resource: 'categories', action: 'read' },
                    { resource: 'cart', action: 'manage' },
                    { resource: 'orders', action: 'create' },
                    { resource: 'orders', action: 'read' }, // только свои
                    { resource: 'analytics', action: 'read' }, // партнёрская статистика
                ]),
                is_system_role: false,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                role: 'GUEST',
                description:
                    'Гость (незарегистрированный пользователь, только просмотр)',
                level: 5,
                permissions: JSON.stringify([
                    { resource: 'products', action: 'read' },
                    { resource: 'categories', action: 'read' },
                ]),
                is_system_role: false,
                is_active: true,
                tenant_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]);

        console.log(
            '✅ Successfully seeded 14 roles with hierarchy (levels 5-100)',
        );
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Откат: удаляем только созданные нами роли (по is_system_role и названию)
        await queryInterface.bulkDelete(
            'roles',
            {
                role: [
                    'SUPER_ADMIN',
                    'PLATFORM_ADMIN',
                    'BILLING_ADMIN',
                    'SUPPORT',
                    'TENANT_OWNER',
                    'TENANT_ADMIN',
                    'MANAGER',
                    'CONTENT_MANAGER',
                    'CUSTOMER_SERVICE',
                    'VIP_CUSTOMER',
                    'WHOLESALE',
                    'CUSTOMER',
                    'AFFILIATE',
                    'GUEST',
                ],
            },
            {},
        );

        console.log('✅ Successfully rolled back roles seed');
    },
};

export default seeder;
