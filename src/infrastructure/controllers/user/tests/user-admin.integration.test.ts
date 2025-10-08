import { UpdateUserDto } from '@app/infrastructure/dto';
import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { authLoginAs } from '../../../../../tests/setup/auth';

describe('User Admin Integration Tests', () => {
    let app: INestApplication;
    let userToken: string;
    let adminToken: string;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        // Минимальные переменные для тестового запуска (подхватываются Joi)
        process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
        process.env.COOKIE_PARSER_SECRET_KEY = 'test-secret-12345';
        process.env.JWT_PRIVATE_KEY = 'a'.repeat(64);
        process.env.JWT_ACCESS_SECRET = 'access-secret-123456';
        process.env.JWT_REFRESH_SECRET = 'refresh-secret-123456';
        process.env.JWT_ACCESS_EXPIRES = '15m';
        process.env.JWT_REFRESH_EXPIRES = '30d';

        app = await setupTestApp();

        // Получаем токены для тестирования
        userToken = await authLoginAs(app, 'user');
        adminToken = await authLoginAs(app, 'admin');
    }, 30000);

    afterAll(async () => {
        await app.close();
    });

    afterEach(async () => {
        const sequelize = app.get(Sequelize);

        // Сбрасываем флаги пользователя 13 (user@example.com) в дефолтное состояние
        await sequelize.query(`
            UPDATE user SET
                is_blocked = 0,
                is_suspended = 0,
                is_deleted = 0,
                is_premium = 0,
                is_employee = 0,
                is_vip_customer = 0,
                is_high_value = 0,
                is_wholesale = 0,
                is_affiliate = 0,
                is_active = 1
            WHERE id = 13
        `);

        // Очищаем добавленные роли (оставляем только CUSTOMER с role_id = 10)
        await sequelize.query(`
            DELETE FROM user_role
            WHERE user_id = 13 AND role_id != 10
        `);

        // Убеждаемся что роль CUSTOMER существует для пользователя 13
        await sequelize.query(`
            INSERT IGNORE INTO user_role (user_id, role_id, created_at, updated_at)
            VALUES (13, 10, NOW(), NOW())
        `);

        // Очищаем временные данные тестов (пользователи созданные в тестах)
        // Порядок важен из-за foreign key constraints
        await sequelize.query(`DELETE FROM user_role WHERE user_id > 14`);
        await sequelize.query(`DELETE FROM refresh_token WHERE user_id > 14`);
        await sequelize.query(`DELETE FROM login_history WHERE user_id > 14`);
        await sequelize.query(`DELETE FROM user_address WHERE user_id > 14`);
        await sequelize.query(`DELETE FROM user WHERE id > 14`);
    });

    // ===== ADMIN STATS ENDPOINT =====
    describe('GET /user/admin/stats', () => {
        it('200: returns user statistics for admin', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/user/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('totalUsers');
            expect(response.body.data).toHaveProperty('activeUsers');
            expect(response.body.data).toHaveProperty('blockedUsers');
            expect(response.body.data).toHaveProperty('vipUsers');
            expect(response.body.data).toHaveProperty('newsletterSubscribers');
            expect(response.body.data).toHaveProperty('premiumUsers');
            expect(response.body.data).toHaveProperty('employees');
            expect(response.body.data).toHaveProperty('affiliates');
            expect(response.body.data).toHaveProperty('wholesaleUsers');
            expect(response.body.data).toHaveProperty('highValueUsers');

            // Проверяем, что все значения - числа
            Object.values(response.body.data).forEach((value) => {
                expect(typeof value).toBe('number');
                expect(value).toBeGreaterThanOrEqual(0);
            });
        });

        it('403: regular user cannot access admin stats', async () => {
            await request(app.getHttpServer())
                .get('/online-store/user/admin/stats')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('401: requires auth', async () => {
            await request(app.getHttpServer())
                .get('/online-store/user/admin/stats')
                .expect(401);
        });
    });

    // ===== ADMIN FLAG ENDPOINTS =====
    describe('Admin flag endpoints', () => {
        const targetUserId = 13; // user@example.com // существующий user из сидов
        const adminCases: Array<{ path: string }> = [
            { path: `/online-store/user/admin/block/${targetUserId}` },
            { path: `/online-store/user/admin/unblock/${targetUserId}` },
            { path: `/online-store/user/admin/suspend/${targetUserId}` },
            { path: `/online-store/user/admin/unsuspend/${targetUserId}` },
            { path: `/online-store/user/admin/delete/${targetUserId}` },
            { path: `/online-store/user/admin/restore/${targetUserId}` },
            {
                path: `/online-store/user/admin/premium/upgrade/${targetUserId}`,
            },
            {
                path: `/online-store/user/admin/premium/downgrade/${targetUserId}`,
            },
            { path: `/online-store/user/admin/employee/set/${targetUserId}` },
            { path: `/online-store/user/admin/employee/unset/${targetUserId}` },
            { path: `/online-store/user/admin/vip/set/${targetUserId}` },
            { path: `/online-store/user/admin/vip/unset/${targetUserId}` },
            { path: `/online-store/user/admin/highvalue/set/${targetUserId}` },
            {
                path: `/online-store/user/admin/highvalue/unset/${targetUserId}`,
            },
            { path: `/online-store/user/admin/wholesale/set/${targetUserId}` },
            {
                path: `/online-store/user/admin/wholesale/unset/${targetUserId}`,
            },
            { path: `/online-store/user/admin/affiliate/set/${targetUserId}` },
            {
                path: `/online-store/user/admin/affiliate/unset/${targetUserId}`,
            },
        ];

        it.each(adminCases)('ADMIN 200 -> %s', async ({ path }) => {
            await request(app.getHttpServer())
                .patch(path)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it.each(adminCases)('USER 403 -> %s', async ({ path }) => {
            await request(app.getHttpServer())
                .patch(path)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });

    // ===== ADMIN USER MANAGEMENT =====
    describe('Admin user management', () => {
        it('401: admin endpoints require auth', async () => {
            await request(app.getHttpServer())
                .get('/online-store/user/get-list-users')
                .expect(401);
        });

        it('403: regular user cannot access admin endpoints', async () => {
            await request(app.getHttpServer())
                .get('/online-store/user/get-list-users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            await request(app.getHttpServer())
                .get('/online-store/user/1')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            await request(app.getHttpServer())
                .post('/online-store/user/create')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ email: 'x@y.z', password: 'Strong123!' })
                .expect(403);
        });

        it('200: admin can list users', async () => {
            await request(app.getHttpServer())
                .get('/online-store/user/get-list-users?page=1&limit=5')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it('400: invalid query parameters', async () => {
            await request(app.getHttpServer())
                .get('/online-store/user/get-list-users?page=abc&limit=NaN')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });

        it('200: admin can create and delete users', async () => {
            const uniqueEmail = `newuser+${Date.now()}@example.com`;
            const createRes = await request(app.getHttpServer())
                .post('/online-store/user/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: uniqueEmail, password: 'StrongPass123!' })
                .expect(201);

            const newUserId = createRes.body?.data?.id || createRes.body?.id;
            expect(newUserId).toBeTruthy();

            const delRes = await request(app.getHttpServer())
                .delete(`/online-store/user/delete/${newUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect([200, 404]).toContain(delRes.status);
        });

        it('200: admin can update user profile', async () => {
            const userId = 13; // user@example.com
            const payload = {
                firstName: 'Петр',
                lastName: 'Петров',
            };

            const response = await request(app.getHttpServer())
                .put(`/online-store/user/update/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(payload)
                .expect(200);

            expect(response.body).toHaveProperty('email');
            expect(response.body).toHaveProperty('firstName');
            expect(response.body).toHaveProperty('lastName');
            expect(response.body.firstName).toBe(payload.firstName);
            expect(response.body.lastName).toBe(payload.lastName);
        });

        it('409: duplicate email on update', async () => {
            const userId = 13; // user@example.com
            const payload: Partial<UpdateUserDto> = {
                email: 'admin@example.com',
            };
            await request(app.getHttpServer())
                .put(`/online-store/user/update/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(payload)
                .expect(409);
        });
    });

    // ===== ROLE MANAGEMENT =====
    describe('Role management', () => {
        it('200: admin can add and remove roles', async () => {
            // Добавляем роль ADMIN пользователю 13, затем удаляем ADMIN
            await request(app.getHttpServer())
                .post('/online-store/user/role/add')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ userId: 13, role: 'ADMIN' })
                .expect(201);

            await request(app.getHttpServer())
                .delete('/online-store/user/role/delete')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ userId: 13, role: 'ADMIN' })
                .expect(200);
        });
    });
});
