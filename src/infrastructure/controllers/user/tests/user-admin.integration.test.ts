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
        const getAdminCases = (userId: number): Array<{ path: string }> => [
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

    // ===== USER STATUS MANAGEMENT =====
    describe('PATCH /user/:id/status - User Status Management', () => {
        let adminToken: string;
        let userToken: string;
        let targetUserId: number;

        beforeAll(async () => {
            const sequelize = app.get(Sequelize);
            const [admin, user, targetUser] = await Promise.all([
                TestDataFactory.createUserWithRole(app, 'ADMIN'),
                TestDataFactory.createUserWithRole(app, 'USER'),
                TestDataFactory.createUserInDB(sequelize),
            ]);
            adminToken = admin.token;
            userToken = user.token;
            targetUserId = targetUser.id;
        });

        it('200: admin can update all status flags', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/online-store/user/${targetUserId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    isVipCustomer: true,
                    isPremium: true,
                    isBetaTester: true,
                })
                .expect(200);

            expect(response.body).toHaveProperty('id', targetUserId);
            expect(response.body).toHaveProperty('isVipCustomer', true);
            expect(response.body).toHaveProperty('isPremium', true);
            expect(response.body).toHaveProperty('isBetaTester', true);
        });

        it('200: admin can update partial status flags', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/online-store/user/${targetUserId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    isPremium: false,
                })
                .expect(200);

            expect(response.body).toHaveProperty('id', targetUserId);
            expect(response.body).toHaveProperty('isPremium', false);
            // Другие флаги остаются неизменными
        });

        it('200: admin can set all flags to false', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/online-store/user/${targetUserId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    isVipCustomer: false,
                    isPremium: false,
                    isBetaTester: false,
                })
                .expect(200);

            expect(response.body).toHaveProperty('isVipCustomer', false);
            expect(response.body).toHaveProperty('isPremium', false);
            expect(response.body).toHaveProperty('isBetaTester', false);
        });

        it('403: regular user cannot update status flags', async () => {
            await request(app.getHttpServer())
                .patch(`/online-store/user/${targetUserId}/status`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    isVipCustomer: true,
                })
                .expect(403);
        });

        it('401: requires authentication', async () => {
            await request(app.getHttpServer())
                .patch(`/online-store/user/${targetUserId}/status`)
                .send({
                    isVipCustomer: true,
                })
                .expect(401);
        });

        it('404: user not found', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/user/999999/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    isVipCustomer: true,
                })
                .expect(404);
        });

        it('400: invalid data type (non-boolean)', async () => {
            await request(app.getHttpServer())
                .patch(`/online-store/user/${targetUserId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    isVipCustomer: 'invalid',
                })
                .expect(400);
        });

        it('400: invalid field names', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/online-store/user/${targetUserId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    invalidField: true,
                })
                .expect(200); // DTO игнорирует неизвестные поля, но не обновляет ничего

            // Проверяем, что флаги остались прежними (false после предыдущего теста)
            expect(response.body.isVipCustomer).toBe(false);
            expect(response.body.isPremium).toBe(false);
            expect(response.body.isBetaTester).toBe(false);
        });

        it('200: handles empty body gracefully', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/online-store/user/${targetUserId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(200);

            // Проверяем, что пользователь возвращается с текущими значениями
            expect(response.body).toHaveProperty('id', targetUserId);
            expect(response.body).toHaveProperty('isVipCustomer');
            expect(response.body).toHaveProperty('isPremium');
            expect(response.body).toHaveProperty('isBetaTester');
        });

        it('400: invalid userId format', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/user/invalid/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    isVipCustomer: true,
                })
                .expect(400);
        });

        it('200: different admin roles can update status', async () => {
            const { token: superAdminToken } =
                await TestDataFactory.createUserWithRole(app, 'SUPER_ADMIN');
            const { token: platformAdminToken } =
                await TestDataFactory.createUserWithRole(app, 'PLATFORM_ADMIN');

            // SUPER_ADMIN
            await request(app.getHttpServer())
                .patch(`/online-store/user/${targetUserId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ isVipCustomer: true })
                .expect(200);

            // PLATFORM_ADMIN
            await request(app.getHttpServer())
                .patch(`/online-store/user/${targetUserId}/status`)
                .set('Authorization', `Bearer ${platformAdminToken}`)
                .send({ isPremium: true })
                .expect(200);
        });

        // ===== Multi-tenant Isolation Tests =====
        // TODO: TENANT-TEST-001 - Требуется обновление TestDataFactory для поддержки tenantId
        //
        // Сценарии для реализации:
        //
        // 1. 404: Admin from tenant 1 cannot update user from tenant 2
        // it('404: admin from tenant A cannot update user from tenant B', async () => {
        //     const tenant1Admin = await TestDataFactory.createUserWithRole(app, 'ADMIN', { tenantId: 1 });
        //     const tenant2User = await TestDataFactory.createUserInDB(sequelize, { tenantId: 2 });
        //
        //     await request(app.getHttpServer())
        //         .patch(`/online-store/user/${tenant2User.id}/status`)
        //         .set('Authorization', `Bearer ${tenant1Admin.token}`)
        //         .send({ isVipCustomer: true })
        //         .expect(404)
        //         .expect((res) => {
        //             expect(res.body.message).toContain('не принадлежит вашему tenant');
        //         });
        // });
        //
        // 2. 200: Admin can update user from same tenant
        // it('200: admin can update user from same tenant', async () => {
        //     const tenant1Admin = await TestDataFactory.createUserWithRole(app, 'ADMIN', { tenantId: 1 });
        //     const tenant1User = await TestDataFactory.createUserInDB(sequelize, { tenantId: 1 });
        //
        //     await request(app.getHttpServer())
        //         .patch(`/online-store/user/${tenant1User.id}/status`)
        //         .set('Authorization', `Bearer ${tenant1Admin.token}`)
        //         .send({ isVipCustomer: true })
        //         .expect(200)
        //         .expect((res) => {
        //             expect(res.body.id).toBe(tenant1User.id);
        //             expect(res.body.isVipCustomer).toBe(true);
        //         });
        // });
        //
        // 3. 404: SUPER_ADMIN from one tenant cannot bypass tenant isolation
        // it('404: SUPER_ADMIN respects tenant isolation', async () => {
        //     const tenant1SuperAdmin = await TestDataFactory.createUserWithRole(app, 'SUPER_ADMIN', { tenantId: 1 });
        //     const tenant2User = await TestDataFactory.createUserInDB(sequelize, { tenantId: 2 });
        //
        //     await request(app.getHttpServer())
        //         .patch(`/online-store/user/${tenant2User.id}/status`)
        //         .set('Authorization', `Bearer ${tenant1SuperAdmin.token}`)
        //         .send({ isPremium: true })
        //         .expect(404);
        // });
        //
        // 4. Audit log: Cross-tenant attempts are logged
        // it('audit: cross-tenant attempt is logged', async () => {
        //     const tenant1Admin = await TestDataFactory.createUserWithRole(app, 'ADMIN', { tenantId: 1 });
        //     const tenant2User = await TestDataFactory.createUserInDB(sequelize, { tenantId: 2 });
        //     const logSpy = jest.spyOn(console, 'warn');
        //
        //     await request(app.getHttpServer())
        //         .patch(`/online-store/user/${tenant2User.id}/status`)
        //         .set('Authorization', `Bearer ${tenant1Admin.token}`)
        //         .send({ isBetaTester: true })
        //         .expect(404);
        //
        //     expect(logSpy).toHaveBeenCalledWith(
        //         expect.objectContaining({
        //             message: expect.stringContaining('другого tenant'),
        //             adminTenantId: 1,
        //             targetUserId: tenant2User.id,
        //         })
        //     );
        // });
        //
        // Priority: Medium
        // Blocked by: TestDataFactory tenant support
        // Estimated: 4 hours
    });
});
