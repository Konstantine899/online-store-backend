"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const bcrypt = __importStar(require("bcrypt"));
const seeder = {
    async up(queryInterface) {
        await queryInterface.bulkDelete('user_role', {}, {});
        await queryInterface.bulkDelete('user', {}, {});
        const passwordHash = await bcrypt.hash('Password123!', 10);
        const defaultFlags = {
            is_active: true,
            is_newsletter_subscribed: false,
            is_marketing_consent: false,
            is_cookie_consent: false,
            is_profile_completed: false,
            is_vip_customer: false,
            is_beta_tester: false,
            is_blocked: false,
            is_verified: false,
            is_premium: false,
            is_email_verified: false,
            is_phone_verified: false,
            is_terms_accepted: false,
            is_privacy_accepted: false,
            is_age_verified: false,
            is_two_factor_enabled: false,
            is_deleted: false,
            is_suspended: false,
            is_affiliate: false,
            is_employee: false,
            is_high_value: false,
            is_wholesale: false,
            preferred_language: 'ru',
            timezone: 'Europe/Moscow',
            notification_preferences: '{}',
            theme_preference: 'light',
            default_language: 'ru',
            translations: '{}',
        };
        const baseUsers = [
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
            {
                email: 'vip.customer@example.com',
                password: passwordHash,
                phone: '+79990000008',
                first_name: 'VIP',
                last_name: 'Customer',
                is_vip_customer: true,
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
                is_wholesale: true,
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
                is_affiliate: true,
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
        const roles = await queryInterface.sequelize.query("SELECT id, role FROM role WHERE role IN ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'CONTENT_MANAGER', 'CUSTOMER_SERVICE', 'VIP_CUSTOMER', 'WHOLESALE', 'CUSTOMER', 'AFFILIATE', 'GUEST', 'USER', 'ADMIN');", { type: sequelize_1.QueryTypes.SELECT });
        const users = await queryInterface.sequelize.query("SELECT id, email FROM user WHERE email IN ('super.admin@platform.com', 'platform.admin@platform.com', 'tenant.owner@store.com', 'tenant.admin@store.com', 'manager@store.com', 'content.manager@store.com', 'support@store.com', 'vip.customer@example.com', 'wholesale@example.com', 'customer@example.com', 'affiliate@example.com', 'guest@example.com', 'user@example.com', 'admin@example.com');", { type: sequelize_1.QueryTypes.SELECT });
        const emailToRoleMap = {
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
        const now = new Date();
        const rowsToInsert = [];
        for (const user of users) {
            const roleName = emailToRoleMap[user.email];
            if (roleName) {
                const role = roles.find((r) => r.role === roleName);
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
    async down(queryInterface) {
        const users = await queryInterface.sequelize.query("SELECT id FROM user WHERE email IN ('super.admin@platform.com', 'platform.admin@platform.com', 'tenant.owner@store.com', 'tenant.admin@store.com', 'manager@store.com', 'content.manager@store.com', 'support@store.com', 'vip.customer@example.com', 'wholesale@example.com', 'customer@example.com', 'affiliate@example.com', 'guest@example.com');", { type: sequelize_1.QueryTypes.SELECT });
        const userIds = users.map((u) => u.id);
        if (userIds.length > 0) {
            await queryInterface.bulkDelete('user_role', { user_id: userIds }, {});
        }
        await queryInterface.bulkDelete('user', {
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
        }, {});
    },
};
exports.default = seeder;
