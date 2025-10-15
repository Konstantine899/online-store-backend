import * as bcrypt from 'bcrypt';
import { QueryInterface, QueryTypes } from 'sequelize';

interface Seeder {
    up(queryInterface: QueryInterface): Promise<void>;
    down(queryInterface: QueryInterface): Promise<void>;
}

const seeder: Seeder = {
    async up(queryInterface: QueryInterface): Promise<void> {
        // Идемпотентность: очищаем таблицы перед вставкой (безопасно для тестовых окружений)
        await queryInterface.bulkDelete('user_role', {}, {});
        await queryInterface.bulkDelete('user', {}, {});

        const passwordHash = await bcrypt.hash('Password123!', 10);
        const defaultFlags = {
            is_active: true,
            is_newsletter_subscribed: false,
            is_marketing_consent: false,
            is_cookie_consent: false,
            is_profile_completed: false,
            is_blocked: false,
            is_verified: false,
            is_email_verified: false,
            is_phone_verified: false,
            is_terms_accepted: false,
            is_privacy_accepted: false,
            is_age_verified: false,
            is_two_factor_enabled: false,
            is_deleted: false,
            is_suspended: false,
            preferred_language: 'ru',
            timezone: 'Europe/Moscow',
            notification_preferences: '{}',
            theme_preference: 'light',
            default_language: 'ru',
            translations: '{}',
        } as const;

        // Создаем пользователей для каждой роли
        const baseUsers = [
            // Системные роли (платформенные)
            {
                email: 'super.admin@platform.com',
                password: passwordHash,
                phone: '+79990000001',
                first_name: 'Super',
                last_name: 'Admin',
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                email: 'platform.admin@platform.com',
                password: passwordHash,
                phone: '+79990000002',
                first_name: 'Platform',
                last_name: 'Admin',
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },

            // Тенантские роли (управление магазином)
            {
                email: 'tenant.owner@store.com',
                password: passwordHash,
                phone: '+79990000003',
                first_name: 'Store',
                last_name: 'Owner',
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                email: 'tenant.admin@store.com',
                password: passwordHash,
                phone: '+79990000004',
                first_name: 'Store',
                last_name: 'Admin',
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                email: 'manager@store.com',
                password: passwordHash,
                phone: '+79990000005',
                first_name: 'Store',
                last_name: 'Manager',
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                email: 'content.manager@store.com',
                password: passwordHash,
                phone: '+79990000006',
                first_name: 'Content',
                last_name: 'Manager',
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                email: 'support@store.com',
                password: passwordHash,
                phone: '+79990000007',
                first_name: 'Customer',
                last_name: 'Support',
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },

            // Клиентские роли (SAAS-002: бизнес-специфичные флаги удалены)
            {
                email: 'vip.customer@example.com',
                password: passwordHash,
                phone: '+79990000008',
                first_name: 'VIP',
                last_name: 'Customer',
                is_newsletter_subscribed: true,
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                email: 'wholesale@example.com',
                password: passwordHash,
                phone: '+79990000009',
                first_name: 'Wholesale',
                last_name: 'Buyer',
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                email: 'customer@example.com',
                password: passwordHash,
                phone: '+79990000010',
                first_name: 'Regular',
                last_name: 'Customer',
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                email: 'affiliate@example.com',
                password: passwordHash,
                phone: '+79990000011',
                first_name: 'Affiliate',
                last_name: 'Partner',
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                email: 'guest@example.com',
                password: passwordHash,
                phone: '+79990000012',
                first_name: 'Guest',
                last_name: 'User',
                is_verified: false,
                is_email_verified: false,
                is_phone_verified: false,
                created_at: new Date(),
                updated_at: new Date(),
            },

            // Тестовые пользователи для integration тестов
            {
                email: 'user@example.com',
                password: passwordHash,
                phone: '+79990000013',
                first_name: 'Test',
                last_name: 'User',
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                email: 'admin@example.com',
                password: passwordHash,
                phone: '+79990000014',
                first_name: 'Test',
                last_name: 'Admin',
                is_verified: true,
                is_email_verified: true,
                is_phone_verified: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
        ];

        const usersToInsert = baseUsers.map((u) => ({ ...defaultFlags, ...u }));
        await queryInterface.bulkInsert('user', usersToInsert);

        // Получаем все роли
        interface RoleRow {
            id: number;
            role: string;
        }
        const roles = await queryInterface.sequelize.query<RoleRow>(
            "SELECT id, role FROM role WHERE role IN ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'CONTENT_MANAGER', 'CUSTOMER_SERVICE', 'VIP_CUSTOMER', 'WHOLESALE', 'CUSTOMER', 'AFFILIATE', 'GUEST', 'USER', 'ADMIN');",
            { type: QueryTypes.SELECT },
        );

        // Получаем созданных пользователей
        interface UserRow {
            id: number;
            email: string;
        }
        const users = await queryInterface.sequelize.query<UserRow>(
            "SELECT id, email FROM user WHERE email IN ('super.admin@platform.com', 'platform.admin@platform.com', 'tenant.owner@store.com', 'tenant.admin@store.com', 'manager@store.com', 'content.manager@store.com', 'support@store.com', 'vip.customer@example.com', 'wholesale@example.com', 'customer@example.com', 'affiliate@example.com', 'guest@example.com', 'user@example.com', 'admin@example.com');",
            { type: QueryTypes.SELECT },
        );

        // Создаем маппинг email -> role
        const emailToRoleMap: Record<string, string> = {
            'super.admin@platform.com': 'SUPER_ADMIN',
            'platform.admin@platform.com': 'PLATFORM_ADMIN',
            'tenant.owner@store.com': 'TENANT_OWNER',
            'tenant.admin@store.com': 'TENANT_ADMIN',
            'manager@store.com': 'MANAGER',
            'content.manager@store.com': 'CONTENT_MANAGER',
            'support@store.com': 'CUSTOMER_SERVICE',
            'vip.customer@example.com': 'VIP_CUSTOMER',
            'wholesale@example.com': 'WHOLESALE',
            'customer@example.com': 'CUSTOMER',
            'affiliate@example.com': 'AFFILIATE',
            'guest@example.com': 'GUEST',
            'user@example.com': 'USER',
            'admin@example.com': 'ADMIN',
        };

        // Присваиваем роли через user_role
        const now = new Date();
        const rowsToInsert: Array<{
            role_id: number;
            user_id: number;
            created_at: Date;
            updated_at: Date;
        }> = [];

        for (const user of users) {
            const roleName = emailToRoleMap[user.email];
            if (roleName) {
                const role = roles.find((r: RoleRow) => r.role === roleName);
                if (role) {
                    rowsToInsert.push({
                        role_id: role.id,
                        user_id: user.id,
                        created_at: now,
                        updated_at: now,
                    });
                }
            }
        }

        if (rowsToInsert.length > 0) {
            await queryInterface.bulkInsert('user_role', rowsToInsert);
        }
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Находим id пользователей
        interface DownUserRow {
            id: number;
        }
        const users = await queryInterface.sequelize.query<DownUserRow>(
            "SELECT id FROM user WHERE email IN ('super.admin@platform.com', 'platform.admin@platform.com', 'tenant.owner@store.com', 'tenant.admin@store.com', 'manager@store.com', 'content.manager@store.com', 'support@store.com', 'vip.customer@example.com', 'wholesale@example.com', 'customer@example.com', 'affiliate@example.com', 'guest@example.com');",
            { type: QueryTypes.SELECT },
        );
        const userIds = users.map((u: DownUserRow) => u.id);

        // Чистим связи и пользователей
        if (userIds.length > 0) {
            await queryInterface.bulkDelete(
                'user_role',
                { user_id: userIds },
                {},
            );
        }
        await queryInterface.bulkDelete(
            'user',
            {
                email: [
                    'super.admin@platform.com',
                    'platform.admin@platform.com',
                    'tenant.owner@store.com',
                    'tenant.admin@store.com',
                    'manager@store.com',
                    'content.manager@store.com',
                    'support@store.com',
                    'vip.customer@example.com',
                    'wholesale@example.com',
                    'customer@example.com',
                    'affiliate@example.com',
                    'guest@example.com',
                ],
            },
            {},
        );
    },
};

export default seeder;
