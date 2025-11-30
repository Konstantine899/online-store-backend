import { QueryInterface } from 'sequelize';

/**
 * Сиды для тестовых данных audit_logs
 * Создаёт примеры различных типов аудит-логов для разработки и тестирования
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert('audit_logs', [
        // CREATE: Создание роли
        {
            entity_type: 'role',
            entity_id: 1,
            action: 'CREATE',
            user_id: 1, // SUPER_ADMIN
            old_values: null,
            new_values: JSON.stringify({
                role: 'MANAGER',
                level: 40,
                isSystemRole: false,
                tenantId: 1,
            }),
            ip_address: '192.168.1.10',
            user_agent:
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            request_id: 'req-001',
            tenant_id: 1,
            created_at: lastWeek,
        },
        // UPDATE: Обновление роли
        {
            entity_type: 'role',
            entity_id: 1,
            action: 'UPDATE',
            user_id: 1,
            old_values: JSON.stringify({
                role: 'MANAGER',
                level: 40,
                description: 'Менеджер магазина',
            }),
            new_values: JSON.stringify({
                role: 'MANAGER',
                level: 45,
                description: 'Старший менеджер магазина',
            }),
            ip_address: '192.168.1.10',
            user_agent:
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            request_id: 'req-002',
            tenant_id: 1,
            created_at: new Date(lastWeek.getTime() + 2 * 60 * 60 * 1000),
        },
        // ASSIGN: Назначение роли пользователю
        {
            entity_type: 'user_role',
            entity_id: 10,
            action: 'ASSIGN',
            user_id: 2, // TENANT_ADMIN
            old_values: null,
            new_values: JSON.stringify({
                userId: 5,
                roleId: 3,
                roleName: 'CUSTOMER',
                expiresAt: null,
                metadata: { source: 'manual' },
            }),
            ip_address: '192.168.1.20',
            user_agent:
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            request_id: 'req-003',
            tenant_id: 1,
            created_at: yesterday,
        },
        // REVOKE: Отзыв роли у пользователя
        {
            entity_type: 'user_role',
            entity_id: 11,
            action: 'REVOKE',
            user_id: 2,
            old_values: JSON.stringify({
                userId: 6,
                roleId: 4,
                roleName: 'VIP_CUSTOMER',
            }),
            new_values: null,
            ip_address: '192.168.1.20',
            user_agent:
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            request_id: 'req-004',
            tenant_id: 1,
            created_at: new Date(yesterday.getTime() + 3 * 60 * 60 * 1000),
        },
        // GRANT_PERMISSION: Добавление разрешения роли
        {
            entity_type: 'role_permission',
            entity_id: 20,
            action: 'GRANT_PERMISSION',
            user_id: 1,
            old_values: null,
            new_values: JSON.stringify({
                roleId: 1,
                permission: { resource: 'products', action: 'create' },
            }),
            ip_address: '192.168.1.10',
            user_agent:
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            request_id: 'req-005',
            tenant_id: 1,
            created_at: new Date(yesterday.getTime() + 6 * 60 * 60 * 1000),
        },
        // REVOKE_PERMISSION: Удаление разрешения роли
        {
            entity_type: 'role_permission',
            entity_id: 21,
            action: 'REVOKE_PERMISSION',
            user_id: 1,
            old_values: JSON.stringify({
                roleId: 1,
                permission: { resource: 'orders', action: 'delete' },
            }),
            new_values: null,
            ip_address: '192.168.1.10',
            user_agent:
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            request_id: 'req-006',
            tenant_id: 1,
            created_at: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000),
        },
        // DELETE: Удаление роли
        {
            entity_type: 'role',
            entity_id: 100,
            action: 'DELETE',
            user_id: 1,
            old_values: JSON.stringify({
                role: 'DEPRECATED_ROLE',
                level: 10,
                isSystemRole: false,
            }),
            new_values: null,
            ip_address: '192.168.1.10',
            user_agent:
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            request_id: 'req-007',
            tenant_id: 1,
            created_at: now,
        },
        // ASSIGN с metadata и expiresAt
        {
            entity_type: 'user_role',
            entity_id: 12,
            action: 'ASSIGN',
            user_id: 2,
            old_values: null,
            new_values: JSON.stringify({
                userId: 7,
                roleId: 5,
                roleName: 'WHOLESALE_BUYER',
                expiresAt: new Date(
                    now.getTime() + 30 * 24 * 60 * 60 * 1000,
                ).toISOString(),
                metadata: {
                    reason: 'Promotional period',
                    approvedBy: 'TENANT_ADMIN',
                },
            }),
            ip_address: '192.168.1.30',
            user_agent:
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            request_id: 'req-008',
            tenant_id: 1,
            created_at: now,
        },
        // Системная операция (без userId)
        {
            entity_type: 'user_role',
            entity_id: 13,
            action: 'ASSIGN',
            user_id: null,
            old_values: null,
            new_values: JSON.stringify({
                userId: 8,
                roleId: 4,
                roleName: 'VIP_CUSTOMER',
                metadata: { source: 'auto_assign', trigger: 'order_threshold' },
            }),
            ip_address: null,
            user_agent: null,
            request_id: 'system-auto-001',
            tenant_id: 1,
            created_at: now,
        },
        // Данные для второго тенанта
        {
            entity_type: 'role',
            entity_id: 200,
            action: 'CREATE',
            user_id: 10, // TENANT_ADMIN второго тенанта
            old_values: null,
            new_values: JSON.stringify({
                role: 'SALES_REP',
                level: 35,
                isSystemRole: false,
                tenantId: 2,
            }),
            ip_address: '192.168.2.10',
            user_agent:
                'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
            request_id: 'req-tenant2-001',
            tenant_id: 2,
            created_at: yesterday,
        },
    ]);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete('audit_logs', {});
}

