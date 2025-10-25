import type { UpdateUserDto } from '@app/infrastructure/dto';
import type { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestDataFactory } from '../../../../../tests/utils';

describe('User Admin Integration Tests', () => {
    let app: INestApplication;

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
    }, 30000);

    afterAll(async () => {
        await app.close();
    });

    // ===== ADMIN STATS ENDPOINT =====
    describe('GET /user/admin/stats', () => {
        it('200: returns user statistics for admin', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );
            const response = await request(app.getHttpServer())
                .get('/online-store/user/admin/stats')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('totalUsers');
            expect(response.body.data).toHaveProperty('activeUsers');
            expect(response.body.data).toHaveProperty('blockedUsers');
            expect(response.body.data).toHaveProperty('newsletterSubscribers');

            // Проверяем, что все значения - числа
            Object.values(response.body.data).forEach((value) => {
                expect(typeof value).toBe('number');
                expect(value).toBeGreaterThanOrEqual(0);
            });
        });

        it('403: regular user cannot access admin stats', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            await request(app.getHttpServer())
                .get('/online-store/user/admin/stats')
                .set('Authorization', `Bearer ${token}`)
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
        let adminToken: string;
        let userToken: string;
        let targetUserId: number;

        beforeAll(async () => {
            const sequelize = app.get(Sequelize);
            // Создаём админа, юзера и target user для этого describe блока
            const [admin, user, targetUser] = await Promise.all([
                TestDataFactory.createUserWithRole(app, 'ADMIN'),
                TestDataFactory.createUserWithRole(app, 'USER'),
                TestDataFactory.createUserInDB(sequelize),
            ]);
            adminToken = admin.token;
            userToken = user.token;
            targetUserId = targetUser.id;
        });

        // SAAS-002: Removed business-specific endpoints (VIP/Premium/Employee/Wholesale/Affiliate/HighValue)
        // Only universal lifecycle management endpoints remain
        const getAdminCases = (userId: number) => [
            { path: `/online-store/user/admin/block/${userId}` },
            { path: `/online-store/user/admin/unblock/${userId}` },
            { path: `/online-store/user/admin/suspend/${userId}` },
            { path: `/online-store/user/admin/unsuspend/${userId}` },
            { path: `/online-store/user/admin/delete/${userId}` },
            { path: `/online-store/user/admin/restore/${userId}` },
        ];

        it.each(getAdminCases(0))('ADMIN 200 -> %s', async ({ path }) => {
            const actualPath = path.replace('/0', `/${targetUserId}`);
            await request(app.getHttpServer())
                .patch(actualPath)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
        });

        it.each(getAdminCases(0))('USER 403 -> %s', async ({ path }) => {
            const actualPath = path.replace('/0', `/${targetUserId}`);
            await request(app.getHttpServer())
                .patch(actualPath)
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
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            await request(app.getHttpServer())
                .get('/online-store/user/get-list-users')
                .set('Authorization', `Bearer ${token}`)
                .expect(403);

            await request(app.getHttpServer())
                .get('/online-store/user/1')
                .set('Authorization', `Bearer ${token}`)
                .expect(403);

            await request(app.getHttpServer())
                .post('/online-store/user/create')
                .set('Authorization', `Bearer ${token}`)
                .send({ email: 'x@y.z', password: 'Strong123!' })
                .expect(403);
        });

        it('200: admin can list users', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );
            await request(app.getHttpServer())
                .get('/online-store/user/get-list-users?page=1&limit=5')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });

        it('400: invalid query parameters', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );
            await request(app.getHttpServer())
                .get('/online-store/user/get-list-users?page=abc&limit=NaN')
                .set('Authorization', `Bearer ${token}`)
                .expect(400);
        });

        it('200: admin can create and delete users', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );
            const uniqueEmail = TestDataFactory.uniqueEmail();
            const createRes = await request(app.getHttpServer())
                .post('/online-store/user/create')
                .set('Authorization', `Bearer ${token}`)
                .send({ email: uniqueEmail, password: 'StrongPass123!' })
                .expect(201);

            const newUserId = createRes.body?.data?.id ?? createRes.body?.id;
            expect(newUserId).toBeTruthy();

            const delRes = await request(app.getHttpServer())
                .delete(`/online-store/user/delete/${newUserId}`)
                .set('Authorization', `Bearer ${token}`);
            expect([200, 404]).toContain(delRes.status);
        });

        it('200: admin can update user profile', async () => {
            const sequelize = app.get(Sequelize);
            const { token: adminToken } =
                await TestDataFactory.createUserWithRole(app, 'ADMIN');
            const { id: targetUserId } =
                await TestDataFactory.createUserInDB(sequelize);

            const payload = {
                firstName: 'Петр',
                lastName: 'Петров',
            };

            const response = await request(app.getHttpServer())
                .put(`/online-store/user/update/${targetUserId}`)
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
            const sequelize = app.get(Sequelize);
            const { token: adminToken, user: admin } =
                await TestDataFactory.createUserWithRole(app, 'ADMIN');
            const { id: targetUserId } =
                await TestDataFactory.createUserInDB(sequelize);

            const payload: Partial<UpdateUserDto> = {
                email: admin.email, // Попытка установить email админа
            };
            await request(app.getHttpServer())
                .put(`/online-store/user/update/${targetUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(payload)
                .expect(409);
        });
    });

    // ===== ROLE MANAGEMENT =====
    describe('Role management', () => {
        it('200: admin can add and remove roles', async () => {
            const sequelize = app.get(Sequelize);
            const { token: adminToken } =
                await TestDataFactory.createUserWithRole(app, 'ADMIN');
            const { id: targetUserId } =
                await TestDataFactory.createUserInDB(sequelize);

            // Добавляем роль ADMIN пользователю, затем удаляем ADMIN
            await request(app.getHttpServer())
                .post('/online-store/user/role/add')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ userId: targetUserId, role: 'ADMIN' })
                .expect(201);

            await request(app.getHttpServer())
                .delete('/online-store/user/role/delete')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ userId: targetUserId, role: 'ADMIN' })
                .expect(200);
        });
    });
});
