import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp } from '../../../../../tests/setup/app';
import { authLoginAs } from '../../../../../tests/setup/auth';
import { UpdateUserDto } from '@app/infrastructure/dto';

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
        await app.init();
        
        // Получаем токены для тестирования
        userToken = await authLoginAs(app, 'user');
        adminToken = await authLoginAs(app, 'admin');
    });

    afterAll(async () => {
        await app.close();
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
            Object.values(response.body.data).forEach(value => {
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
            { path: `/online-store/user/admin/premium/upgrade/${targetUserId}` },
            { path: `/online-store/user/admin/premium/downgrade/${targetUserId}` },
            { path: `/online-store/user/admin/employee/set/${targetUserId}` },
            { path: `/online-store/user/admin/employee/unset/${targetUserId}` },
            { path: `/online-store/user/admin/vip/set/${targetUserId}` },
            { path: `/online-store/user/admin/vip/unset/${targetUserId}` },
            { path: `/online-store/user/admin/highvalue/set/${targetUserId}` },
            { path: `/online-store/user/admin/highvalue/unset/${targetUserId}` },
            { path: `/online-store/user/admin/wholesale/set/${targetUserId}` },
            { path: `/online-store/user/admin/wholesale/unset/${targetUserId}` },
            { path: `/online-store/user/admin/affiliate/set/${targetUserId}` },
            { path: `/online-store/user/admin/affiliate/unset/${targetUserId}` },
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
            // Получаем свежий admin токен для этого теста
            const freshAdminToken = await authLoginAs(app, 'admin');
            
            await request(app.getHttpServer())
                .get('/online-store/user/get-list-users?page=1&limit=5')
                .set('Authorization', `Bearer ${freshAdminToken}`)
                .expect(200);
        });

        it('400: invalid query parameters', async () => {
            // Получаем свежий admin токен для этого теста
            const freshAdminToken = await authLoginAs(app, 'admin');
            
            await request(app.getHttpServer())
                .get('/online-store/user/get-list-users?page=abc&limit=NaN')
                .set('Authorization', `Bearer ${freshAdminToken}`)
                .expect(400);
        });

        it('200: admin can create and delete users', async () => {
            // Получаем свежий admin токен для этого теста
            const freshAdminToken = await authLoginAs(app, 'admin');
            
            const uniqueEmail = `newuser+${Date.now()}@example.com`;
            const createRes = await request(app.getHttpServer())
                .post('/online-store/user/create')
                .set('Authorization', `Bearer ${freshAdminToken}`)
                .send({ email: uniqueEmail, password: 'StrongPass123!' })
                .expect(201);

            const newUserId = createRes.body?.data?.id || createRes.body?.id;
            expect(newUserId).toBeTruthy();

            const delRes = await request(app.getHttpServer())
                .delete(`/online-store/user/delete/${newUserId}`)
                .set('Authorization', `Bearer ${freshAdminToken}`);
            expect([200, 404]).toContain(delRes.status);
        });

            it('200: admin can update user profile', async () => {
                // Получаем свежий admin токен для этого теста
                const freshAdminToken = await authLoginAs(app, 'admin');
                
                const userId = 13; // user@example.com
            const payload = {
                firstName: 'Петр',
                lastName: 'Петров',
            };

            const response = await request(app.getHttpServer())
                .put(`/online-store/user/update/${userId}`)
                .set('Authorization', `Bearer ${freshAdminToken}`)
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
            const payload: Partial<UpdateUserDto> = { email: 'admin@example.com' };
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
            // Получаем свежий admin токен для этого теста
            const freshAdminToken = await authLoginAs(app, 'admin');
            
            // Добавляем роль ADMIN пользователю 13, затем удаляем ADMIN
            await request(app.getHttpServer())
                .post('/online-store/user/role/add')
                .set('Authorization', `Bearer ${freshAdminToken}`)
                .send({ userId: 13, role: 'ADMIN' })
                .expect(201);

            await request(app.getHttpServer())
                .delete('/online-store/user/role/delete')
                .set('Authorization', `Bearer ${freshAdminToken}`)
                .send({ userId: 13, role: 'ADMIN' })
                .expect(200);
        });
    });
});
