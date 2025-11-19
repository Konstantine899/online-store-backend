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

    afterEach(async () => {
        // Cleanup: удаляем тестовых пользователей из tenant 2 после каждого теста
        const sequelize = app.get(Sequelize);
        await sequelize.query(
            `DELETE FROM user_role WHERE user_id IN (SELECT id FROM user WHERE tenant_id = 2)`,
        );
        await sequelize.query(`DELETE FROM user WHERE tenant_id = 2`);
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

            expect(response.body).toHaveProperty('totalUsers');
            expect(response.body).toHaveProperty('activeUsers');
            expect(response.body).toHaveProperty('blockedUsers');
            expect(response.body).toHaveProperty('newsletterSubscribers');

            // Проверяем, что все значения - числа
            Object.values(response.body).forEach((value) => {
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

        // 🔒 USER-001-11-E1: TENANT ISOLATION TEST
        it('🔒 SECURITY: getUserStats returns only same tenant users (tenant isolation)', async () => {
            const sequelize = app.get(Sequelize);

            // Создаём администратора в tenant 1
            const tenant1Admin = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    role: 'ADMIN',
                    tenantId: 1,
                },
            );

            // Создаём 2 пользователей в tenant 1
            await Promise.all([
                TestDataFactory.createUserInDB(sequelize, {
                    email: TestDataFactory.uniqueEmail(),
                    tenantId: 1,
                }),
                TestDataFactory.createUserInDB(sequelize, {
                    email: TestDataFactory.uniqueEmail(),
                    tenantId: 1,
                }),
            ]);

            // Создаём 3 пользователей в tenant 2 (НЕ должны попасть в статистику)
            await Promise.all([
                TestDataFactory.createUserInDB(sequelize, {
                    email: TestDataFactory.uniqueEmail(),
                    tenantId: 2,
                }),
                TestDataFactory.createUserInDB(sequelize, {
                    email: TestDataFactory.uniqueEmail(),
                    tenantId: 2,
                }),
                TestDataFactory.createUserInDB(sequelize, {
                    email: TestDataFactory.uniqueEmail(),
                    tenantId: 2,
                }),
            ]);

            // Логинимся как админ tenant 1
            const loginRes = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: tenant1Admin.email,
                    password: tenant1Admin.password,
                })
                .expect(200);

            const token = loginRes.body.accessToken;

            // Запрашиваем статистику
            const statsRes = await request(app.getHttpServer())
                .get('/online-store/user/admin/stats')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const stats = statsRes.body; // Direct response, не обернут в { data: ... }

            // Проверяем, что в статистике ТОЛЬКО пользователи из tenant 1
            // totalUsers >= 3 (tenant1Admin + 2 созданных) + возможно другие пользователи из сидов
            expect(stats.totalUsers).toBeGreaterThanOrEqual(3);

            // ❌ ВАЖНО: Если бы tenant isolation НЕ работал, totalUsers был бы >= 6 (tenant1 + tenant2)
            // Проверка: запросим напрямую БД для tenant 2
            const [tenant2Users] = await sequelize.query(
                `SELECT COUNT(*) as count FROM user WHERE tenant_id = 2 AND is_deleted = 0`,
            );
            const tenant2Count = (tenant2Users as Array<{ count: number }>)[0]
                .count;

            // Убеждаемся, что в tenant 2 есть пользователи (иначе тест бессмысленный)
            expect(tenant2Count).toBeGreaterThanOrEqual(3);

            // Убеждаемся, что stats.totalUsers НЕ включает пользователей из tenant 2
            // Если бы tenant isolation НЕ работал, stats.totalUsers был бы больше
            const [tenant1Users] = await sequelize.query(
                `SELECT COUNT(*) as count FROM user WHERE tenant_id = 1 AND is_deleted = 0`,
            );
            const tenant1Count = (tenant1Users as Array<{ count: number }>)[0]
                .count;

            // ✅ КРИТИЧНАЯ ПРОВЕРКА: stats.totalUsers === tenant1Count (не больше!)
            expect(stats.totalUsers).toBe(tenant1Count);
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

        // 🔒 USER-001-11-E1: TENANT ISOLATION TEST
        it('🔒 SECURITY: getListUsers returns only same tenant users (tenant isolation)', async () => {
            const sequelize = app.get(Sequelize);

            // Создаём администратора в tenant 1
            const tenant1Admin = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    role: 'ADMIN',
                    tenantId: 1,
                },
            );

            // Создаём 2 пользователей в tenant 1
            const tenant1User1 = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'Tenant1User1',
                    tenantId: 1,
                },
            );
            const tenant1User2 = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'Tenant1User2',
                    tenantId: 1,
                },
            );

            // Создаём 3 пользователей в tenant 2 (НЕ должны попасть в список)
            const tenant2User1 = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'Tenant2User1',
                    tenantId: 2,
                },
            );
            const tenant2User2 = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'Tenant2User2',
                    tenantId: 2,
                },
            );
            const tenant2User3 = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'Tenant2User3',
                    tenantId: 2,
                },
            );

            // Логинимся как админ tenant 1
            const loginRes = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: tenant1Admin.email,
                    password: tenant1Admin.password,
                })
                .expect(200);

            const token = loginRes.body.accessToken;

            // Запрашиваем список пользователей (большой limit, чтобы получить всех)
            const listRes = await request(app.getHttpServer())
                .get('/online-store/user/get-list-users?page=1&limit=100')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const users = listRes.body.data;
            const userIds = users.map((u: { id: number }) => u.id);

            // ✅ КРИТИЧНАЯ ПРОВЕРКА 1: В списке ЕСТЬ пользователи из tenant 1
            expect(userIds).toContain(tenant1Admin.id);
            expect(userIds).toContain(tenant1User1.id);
            expect(userIds).toContain(tenant1User2.id);

            // ✅ КРИТИЧНАЯ ПРОВЕРКА 2: В списке НЕТ пользователей из tenant 2
            expect(userIds).not.toContain(tenant2User1.id);
            expect(userIds).not.toContain(tenant2User2.id);
            expect(userIds).not.toContain(tenant2User3.id);

            // ✅ КРИТИЧНАЯ ПРОВЕРКА 3: Все user IDs в списке принадлежат tenant 1
            const tenant1UserIds = new Set<number>();
            const [tenant1UsersRaw] = await sequelize.query(
                `SELECT id FROM user WHERE tenant_id = 1 AND is_deleted = 0`,
            );
            (tenant1UsersRaw as Array<{ id: number }>).forEach((u) =>
                tenant1UserIds.add(u.id),
            );

            userIds.forEach((userId: number) => {
                expect(tenant1UserIds.has(userId)).toBe(true);
            });
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
    // ⚠️ DEPRECATED: Endpoint /user/:id/status больше не используется
    // Поля isPremium, isVipCustomer, isBetaTester удалены из БД миграцией 20251015135614-drop-is-beta-tester-saas-002.js
    // Endpoint оставлен только для обратной совместимости (возвращает только id пользователя)
    // Тесты удалены, так как функциональность deprecated

    // ===== USER FILTERING ENDPOINT =====
    describe('GET /user/list (filtering)', () => {
        it('200: GET /user/list?filterType=active returns only active users', async () => {
            const sequelize = app.get(Sequelize);

            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            // Создаём 2 активных пользователей
            const activeUser1 = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    tenantId: 1,
                    isActive: true,
                    isBlocked: false,
                    isDeleted: false,
                } as never,
            );
            const activeUser2 = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    tenantId: 1,
                    isActive: true,
                    isBlocked: false,
                    isDeleted: false,
                } as never,
            );

            // Создаём заблокированного пользователя (НЕ должен попасть в результат)
            await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                tenantId: 1,
                isActive: false,
                isBlocked: true,
                isDeleted: false,
            } as never);

            const response = await request(app.getHttpServer())
                .get(
                    '/online-store/user/list?filterType=active&page=1&limit=100',
                )
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(Array.isArray(response.body.data)).toBe(true);

            const userIds = response.body.data.map((u: { id: number }) => u.id);

            // Проверяем, что активные пользователи в списке
            expect(userIds).toContain(activeUser1.id);
            expect(userIds).toContain(activeUser2.id);

            // Проверяем, что все пользователи в результате - активные
            response.body.data.forEach(
                (user: { isActive: boolean; isBlocked: boolean }) => {
                    expect(user.isActive).toBe(true);
                    expect(user.isBlocked).toBe(false);
                },
            );
        });

        it('200: GET /user/list?filterType=blocked returns only blocked users', async () => {
            const sequelize = app.get(Sequelize);

            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            // Создаём заблокированного пользователя
            const blockedUser = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    tenantId: 1,
                },
            );

            // Обновляем флаг isBlocked через прямой SQL
            await sequelize.query(
                `UPDATE user SET is_blocked = 1 WHERE id = ?`,
                { replacements: [blockedUser.id] },
            );

            // Создаём активного пользователя (НЕ должен попасть в результат)
            await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                tenantId: 1,
            });

            const response = await request(app.getHttpServer())
                .get(
                    '/online-store/user/list?filterType=blocked&page=1&limit=100',
                )
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');

            const userIds = response.body.data.map((u: { id: number }) => u.id);
            expect(userIds).toContain(blockedUser.id);

            // Все пользователи в результате - заблокированы
            response.body.data.forEach((user: { isBlocked: boolean }) => {
                expect(user.isBlocked).toBe(true);
            });
        });

        it('200: GET /user/list?filterType=verified returns only verified users', async () => {
            const sequelize = app.get(Sequelize);

            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            // Создаём верифицированного пользователя
            const verifiedUser = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    tenantId: 1,
                },
            );

            // Обновляем флаг isVerified через прямой SQL
            await sequelize.query(
                `UPDATE user SET is_verified = 1 WHERE id = ?`,
                { replacements: [verifiedUser.id] },
            );

            // Создаём неверифицированного пользователя (НЕ должен попасть в результат)
            await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                tenantId: 1,
            });

            const response = await request(app.getHttpServer())
                .get(
                    '/online-store/user/list?filterType=verified&page=1&limit=100',
                )
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            const userIds = response.body.data.map((u: { id: number }) => u.id);
            expect(userIds).toContain(verifiedUser.id);

            // Все пользователи в результате - верифицированы
            response.body.data.forEach((user: { isVerified: boolean }) => {
                expect(user.isVerified).toBe(true);
            });
        });

        it('200: GET /user/list?filterType=unverified returns only unverified users', async () => {
            const sequelize = app.get(Sequelize);

            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            // Создаём неверифицированного пользователя
            const unverifiedUser = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    tenantId: 1,
                    isVerified: false,
                    isDeleted: false,
                } as never,
            );

            // Создаём верифицированного пользователя (НЕ должен попасть в результат)
            await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                tenantId: 1,
                isVerified: true,
                isDeleted: false,
            } as never);

            const response = await request(app.getHttpServer())
                .get(
                    '/online-store/user/list?filterType=unverified&page=1&limit=100',
                )
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            const userIds = response.body.data.map((u: { id: number }) => u.id);
            expect(userIds).toContain(unverifiedUser.id);

            // Все пользователи в результате - неверифицированы
            response.body.data.forEach((user: { isVerified: boolean }) => {
                expect(user.isVerified).toBe(false);
            });
        });

        it('200: GET /user/list?filterType=newsletter returns only newsletter subscribers', async () => {
            const sequelize = app.get(Sequelize);

            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            // Создаём подписчика на рассылку
            const subscribedUser = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    tenantId: 1,
                },
            );

            // Обновляем флаг isNewsletterSubscribed через прямой SQL
            await sequelize.query(
                `UPDATE user SET is_newsletter_subscribed = 1 WHERE id = ?`,
                { replacements: [subscribedUser.id] },
            );

            // Создаём не подписанного пользователя (НЕ должен попасть в результат)
            await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                tenantId: 1,
            });

            const response = await request(app.getHttpServer())
                .get(
                    '/online-store/user/list?filterType=newsletter&page=1&limit=100',
                )
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            const userIds = response.body.data.map((u: { id: number }) => u.id);
            expect(userIds).toContain(subscribedUser.id);

            // Все пользователи в результате - подписаны на рассылку
            response.body.data.forEach(
                (user: { isNewsletterSubscribed: boolean }) => {
                    expect(user.isNewsletterSubscribed).toBe(true);
                },
            );
        });

        it('400: GET /user/list?filterType=invalid returns error for invalid filter type', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            const response = await request(app.getHttpServer())
                .get('/online-store/user/list?filterType=invalid')
                .set('Authorization', `Bearer ${token}`)
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Неизвестный тип фильтра');
        });

        it('403: regular user cannot access filtered list', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            await request(app.getHttpServer())
                .get('/online-store/user/list?filterType=active')
                .set('Authorization', `Bearer ${token}`)
                .expect(403);
        });
    });

    // ===== USER SEARCH ENDPOINTS =====
    describe('GET /user/search (search endpoints)', () => {
        it('200: GET /user/search?q=Иван finds users by name', async () => {
            const sequelize = app.get(Sequelize);
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            // Создаём пользователей с разными именами
            const userIvan = await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                firstName: 'Иван',
                lastName: 'Петров',
                tenantId: 1,
            } as never);

            const userIvanova = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'Мария',
                    lastName: 'Иванова',
                    tenantId: 1,
                } as never,
            );

            // Создаём пользователя без "Иван" в имени (не должен попасть)
            await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                firstName: 'Петр',
                lastName: 'Сидоров',
                tenantId: 1,
            } as never);

            const response = await request(app.getHttpServer())
                .get('/online-store/user/search?q=Иван&page=1&limit=10')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(Array.isArray(response.body.data)).toBe(true);

            const userIds = response.body.data.map((u: { id: number }) => u.id);

            // Проверяем, что найдены пользователи с "Иван" в имени/фамилии
            expect(userIds).toContain(userIvan.id);
            expect(userIds).toContain(userIvanova.id);

            // Проверяем, что все найденные пользователи содержат "Иван"
            response.body.data.forEach(
                (user: { firstName: string; lastName: string }) => {
                    const fullName = `${user.firstName} ${user.lastName}`;
                    expect(fullName.toLowerCase()).toContain('иван');
                },
            );
        });

        it('200: GET /user/search/phone?phone=+7999 autocomplete by phone prefix', async () => {
            const sequelize = app.get(Sequelize);
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            // Создаём пользователей с телефонами начинающимися с +7999
            const user1 = await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                phone: '+79991234567',
                tenantId: 1,
            } as never);

            const user2 = await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                phone: '+79998887766',
                tenantId: 1,
            } as never);

            // Создаём пользователя с другим префиксом (не должен попасть)
            await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                phone: '+79881234567',
                tenantId: 1,
            } as never);

            const response = await request(app.getHttpServer())
                .get('/online-store/user/search/phone?phone=+7999')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);

            const userIds = response.body.map((u: { id: number }) => u.id);

            // Проверяем, что найдены пользователи с префиксом +7999
            expect(userIds).toContain(user1.id);
            expect(userIds).toContain(user2.id);

            // Проверяем, что все телефоны начинаются с +7999
            response.body.forEach((user: { phone: string }) => {
                expect(user.phone).toMatch(/^\+7999/);
            });
        });

        it('200: GET /user/batch?ids=1,2,3 returns users by IDs', async () => {
            const sequelize = app.get(Sequelize);
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            // Создаём 3 пользователей
            const user1 = await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                tenantId: 1,
            });
            const user2 = await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                tenantId: 1,
            });
            const user3 = await TestDataFactory.createUserInDB(sequelize, {
                email: TestDataFactory.uniqueEmail(),
                tenantId: 1,
            });

            const idsString = `${user1.id},${user2.id},${user3.id}`;

            const response = await request(app.getHttpServer())
                .get(`/online-store/user/batch?ids=${idsString}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toHaveLength(3);

            const returnedIds = response.body.map((u: { id: number }) => u.id);
            expect(returnedIds).toContain(user1.id);
            expect(returnedIds).toContain(user2.id);
            expect(returnedIds).toContain(user3.id);
        });

        it('🔒 SECURITY: search endpoints respect tenant isolation', async () => {
            const sequelize = app.get(Sequelize);

            // Создаём администратора в tenant 1
            const tenant1Admin = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    role: 'ADMIN',
                    tenantId: 1,
                },
            );

            // Создаём пользователя в tenant 1
            const tenant1User = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'TenantOneUser',
                    phone: '+79991111111',
                    tenantId: 1,
                },
            );

            // Создаём пользователя в tenant 2 (НЕ должен попасть в результаты)
            const tenant2User = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'TenantTwoUser',
                    phone: '+79992222222',
                    tenantId: 2,
                },
            );

            // Логинимся как админ tenant 1
            const loginRes = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: tenant1Admin.email,
                    password: tenant1Admin.password,
                })
                .expect(200);

            const token = loginRes.body.accessToken;

            // 1. Проверяем tenant isolation для /user/search
            const searchRes = await request(app.getHttpServer())
                .get('/online-store/user/search?q=Tenant')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const searchIds = searchRes.body.data.map(
                (u: { id: number }) => u.id,
            );
            expect(searchIds).toContain(tenant1User.id);
            expect(searchIds).not.toContain(tenant2User.id);

            // 2. Проверяем tenant isolation для /user/search/phone
            const phoneRes = await request(app.getHttpServer())
                .get('/online-store/user/search/phone?phone=+7999')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const phoneIds = phoneRes.body.map((u: { id: number }) => u.id);
            expect(phoneIds).toContain(tenant1User.id);
            expect(phoneIds).not.toContain(tenant2User.id);

            // 3. Проверяем tenant isolation для /user/batch
            // Пытаемся запросить пользователей из обоих tenants
            const batchRes = await request(app.getHttpServer())
                .get(
                    `/online-store/user/batch?ids=${tenant1User.id},${tenant2User.id}`,
                )
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const batchIds = batchRes.body.map((u: { id: number }) => u.id);
            // ✅ Должен вернуться ТОЛЬКО tenant1User (tenant isolation)
            expect(batchIds).toContain(tenant1User.id);
            expect(batchIds).not.toContain(tenant2User.id);
            expect(batchRes.body).toHaveLength(1); // Только 1 пользователь из tenant 1
        });

        it('400: GET /user/search?q= returns error for empty query', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            await request(app.getHttpServer())
                .get('/online-store/user/search?q=')
                .set('Authorization', `Bearer ${token}`)
                .expect(400);
        });

        it('400: GET /user/search?q=ab returns error for short query', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            await request(app.getHttpServer())
                .get('/online-store/user/search?q=ab')
                .set('Authorization', `Bearer ${token}`)
                .expect(400);
        });

        it('400: GET /user/batch?ids= returns error for empty IDs', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            await request(app.getHttpServer())
                .get('/online-store/user/batch?ids=')
                .set('Authorization', `Bearer ${token}`)
                .expect(400);
        });
    });

    describe('GET /user/admin/stats (statistics endpoints)', () => {
        it('200: GET /user/admin/stats returns general user statistics', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            const response = await request(app.getHttpServer())
                .get('/online-store/user/admin/stats')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('totalUsers');
            expect(response.body).toHaveProperty('activeUsers');
            expect(response.body).toHaveProperty('blockedUsers');
            expect(response.body).toHaveProperty('newsletterSubscribers');

            // Проверяем типы
            expect(typeof response.body.totalUsers).toBe('number');
            expect(typeof response.body.activeUsers).toBe('number');
            expect(typeof response.body.blockedUsers).toBe('number');
            expect(typeof response.body.newsletterSubscribers).toBe('number');

            // Проверяем логику
            expect(response.body.totalUsers).toBeGreaterThanOrEqual(0);
            expect(response.body.activeUsers).toBeLessThanOrEqual(
                response.body.totalUsers,
            );
        });

        it('200: GET /user/admin/stats/by-role returns statistics by roles', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            const response = await request(app.getHttpServer())
                .get('/online-store/user/admin/stats/by-role')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('roles');
            expect(response.body).toHaveProperty('totalUsers');
            expect(Array.isArray(response.body.roles)).toBe(true);

            // Проверяем структуру каждой роли
            if (response.body.roles.length > 0) {
                const firstRole = response.body.roles[0];
                expect(firstRole).toHaveProperty('role');
                expect(firstRole).toHaveProperty('count');
                expect(firstRole).toHaveProperty('percentage');

                expect(typeof firstRole.role).toBe('string');
                expect(typeof firstRole.count).toBe('number');
                expect(typeof firstRole.percentage).toBe('number');

                // Проценты должны быть от 0 до 100
                expect(firstRole.percentage).toBeGreaterThanOrEqual(0);
                expect(firstRole.percentage).toBeLessThanOrEqual(100);
            }
        });

        it('200: GET /user/admin/stats/activity returns activity statistics', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            const response = await request(app.getHttpServer())
                .get('/online-store/user/admin/stats/activity')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('activeInLast24Hours');
            expect(response.body).toHaveProperty('activeInLast7Days');
            expect(response.body).toHaveProperty('activeInLast30Days');
            expect(response.body).toHaveProperty('neverLoggedIn');
            expect(response.body).toHaveProperty('totalUsers');

            // Проверяем типы
            expect(typeof response.body.activeInLast24Hours).toBe('number');
            expect(typeof response.body.activeInLast7Days).toBe('number');
            expect(typeof response.body.activeInLast30Days).toBe('number');
            expect(typeof response.body.neverLoggedIn).toBe('number');
            expect(typeof response.body.totalUsers).toBe('number');

            // Проверяем логику: каждый следующий период должен включать предыдущий
            expect(response.body.activeInLast24Hours).toBeLessThanOrEqual(
                response.body.activeInLast7Days,
            );
            expect(response.body.activeInLast7Days).toBeLessThanOrEqual(
                response.body.activeInLast30Days,
            );
            expect(response.body.activeInLast30Days).toBeLessThanOrEqual(
                response.body.totalUsers,
            );
        });
    });

    // ===== BULK OPERATIONS =====
    describe('POST /user/bulk/* - Bulk User Operations', () => {
        let adminToken: string;
        let userToken: string;
        let testUserIds: number[];

        beforeAll(async () => {
            const sequelize = app.get(Sequelize);
            const [admin, user] = await Promise.all([
                TestDataFactory.createUserWithRole(app, 'ADMIN'),
                TestDataFactory.createUserWithRole(app, 'USER'),
            ]);
            adminToken = admin.token;
            userToken = user.token;

            // Создаём 5 тестовых пользователей для bulk операций
            const testUsers = await Promise.all([
                TestDataFactory.createUserInDB(sequelize, {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'BulkTest1',
                }),
                TestDataFactory.createUserInDB(sequelize, {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'BulkTest2',
                }),
                TestDataFactory.createUserInDB(sequelize, {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'BulkTest3',
                }),
                TestDataFactory.createUserInDB(sequelize, {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'BulkTest4',
                }),
                TestDataFactory.createUserInDB(sequelize, {
                    email: TestDataFactory.uniqueEmail(),
                    firstName: 'BulkTest5',
                }),
            ]);

            testUserIds = testUsers.map((u) => u.id);

            // Деактивируем первых двух пользователей для теста bulk activate
            await sequelize.query(
                `UPDATE user SET is_active = 0 WHERE id IN (?, ?)`,
                { replacements: [testUserIds[0], testUserIds[1]] },
            );
        });

        // 1. Bulk Activate
        describe('POST /user/bulk/activate', () => {
            it('200: admin can bulk activate users', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/user/bulk/activate')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ userIds: [testUserIds[0], testUserIds[1]] })
                    .expect(200);

                expect(response.body).toHaveProperty('affectedCount');
                expect(response.body.affectedCount).toBeGreaterThanOrEqual(1);
                expect(response.body).toHaveProperty('message');
                expect(response.body.message).toContain('активировано');
            });

            it('403: regular user cannot bulk activate', async () => {
                await request(app.getHttpServer())
                    .post('/online-store/user/bulk/activate')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ userIds: [testUserIds[0]] })
                    .expect(403);
            });

            it('400: empty array validation', async () => {
                await request(app.getHttpServer())
                    .post('/online-store/user/bulk/activate')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ userIds: [] })
                    .expect(400);
            });

            it('400: exceeds maximum limit (101 users)', async () => {
                const tooManyIds = Array.from({ length: 101 }, (_, i) => i + 1);
                await request(app.getHttpServer())
                    .post('/online-store/user/bulk/activate')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ userIds: tooManyIds })
                    .expect(400);
            });
        });

        // 2. Bulk Deactivate
        describe('POST /user/bulk/deactivate', () => {
            it('200: admin can bulk deactivate users', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/user/bulk/deactivate')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ userIds: [testUserIds[1], testUserIds[2]] })
                    .expect(200);

                expect(response.body).toHaveProperty('affectedCount');
                expect(response.body.affectedCount).toBeGreaterThanOrEqual(1);
                expect(response.body.message).toContain('деактивировано');
            });

            it('403: regular user cannot bulk deactivate', async () => {
                await request(app.getHttpServer())
                    .post('/online-store/user/bulk/deactivate')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ userIds: [testUserIds[0]] })
                    .expect(403);
            });
        });

        // 3. Bulk Block
        describe('POST /user/bulk/block', () => {
            it('200: admin can bulk block users', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/user/bulk/block')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ userIds: [testUserIds[2], testUserIds[3]] })
                    .expect(200);

                expect(response.body).toHaveProperty('affectedCount');
                expect(response.body.affectedCount).toBeGreaterThanOrEqual(1);
                expect(response.body.message).toContain('заблокировано');
            });

            it('403: regular user cannot bulk block', async () => {
                await request(app.getHttpServer())
                    .post('/online-store/user/bulk/block')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ userIds: [testUserIds[0]] })
                    .expect(403);
            });
        });

        // 4. Bulk Unblock
        describe('POST /user/bulk/unblock', () => {
            it('200: admin can bulk unblock users', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/user/bulk/unblock')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ userIds: [testUserIds[2], testUserIds[3]] })
                    .expect(200);

                expect(response.body).toHaveProperty('affectedCount');
                expect(response.body).toHaveProperty('message');
                expect(response.body.message).toContain('разблокировано');
            });

            it('403: regular user cannot bulk unblock', async () => {
                await request(app.getHttpServer())
                    .post('/online-store/user/bulk/unblock')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ userIds: [testUserIds[0]] })
                    .expect(403);
            });
        });

        // 5. Bulk Verify
        describe('POST /user/bulk/verify', () => {
            it('200: admin can bulk verify users', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/user/bulk/verify')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ userIds: [testUserIds[3], testUserIds[4]] })
                    .expect(200);

                expect(response.body).toHaveProperty('affectedCount');
                expect(response.body.affectedCount).toBeGreaterThanOrEqual(1);
                expect(response.body.message).toContain('верифицировано');
            });

            it('403: regular user cannot bulk verify', async () => {
                await request(app.getHttpServer())
                    .post('/online-store/user/bulk/verify')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ userIds: [testUserIds[0]] })
                    .expect(403);
            });
        });

        // 6. Bulk Delete
        describe('DELETE /user/bulk/delete', () => {
            it('200: admin can bulk delete users (soft delete)', async () => {
                const response = await request(app.getHttpServer())
                    .delete('/online-store/user/bulk/delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ userIds: [testUserIds[4]] })
                    .expect(200);

                expect(response.body).toHaveProperty('affectedCount');
                expect(response.body).toHaveProperty('message');
                expect(response.body.message).toContain('удалено');
            });

            it('403: regular user cannot bulk delete', async () => {
                await request(app.getHttpServer())
                    .delete('/online-store/user/bulk/delete')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ userIds: [testUserIds[0]] })
                    .expect(403);
            });

            it('400: invalid userIds type (not array)', async () => {
                await request(app.getHttpServer())
                    .delete('/online-store/user/bulk/delete')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ userIds: 'not-an-array' })
                    .expect(400);
            });
        });
    });

    // ===== SPECIALIZED QUERIES =====
    describe('GET /user/inactive - Inactive Users', () => {
        let adminToken: string;
        let userToken: string;

        beforeAll(async () => {
            const [admin, user] = await Promise.all([
                TestDataFactory.createUserWithRole(app, 'ADMIN'),
                TestDataFactory.createUserWithRole(app, 'USER'),
            ]);
            adminToken = admin.token;
            userToken = user.token;
        });

        it('200: admin can get inactive users (30 days)', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/user/inactive?days=30&page=1&limit=5')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.meta).toHaveProperty('totalCount');
        });

        it('403: regular user cannot access inactive users', async () => {
            await request(app.getHttpServer())
                .get('/online-store/user/inactive?days=30')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('400: invalid days parameter (0 days)', async () => {
            await request(app.getHttpServer())
                .get('/online-store/user/inactive?days=0')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });
    });

    describe('GET /user/incomplete-profiles - Incomplete Profiles', () => {
        let adminToken: string;
        let userToken: string;

        beforeAll(async () => {
            const [admin, user] = await Promise.all([
                TestDataFactory.createUserWithRole(app, 'ADMIN'),
                TestDataFactory.createUserWithRole(app, 'USER'),
            ]);
            adminToken = admin.token;
            userToken = user.token;
        });

        it('200: admin can get users with incomplete profiles', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/user/incomplete-profiles?page=1&limit=5')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.meta).toHaveProperty('totalCount');
        });

        it('403: regular user cannot access incomplete profiles', async () => {
            await request(app.getHttpServer())
                .get('/online-store/user/incomplete-profiles')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });

    describe('GET /user/date-range - Users by Date Range', () => {
        let adminToken: string;
        let userToken: string;

        beforeAll(async () => {
            const [admin, user] = await Promise.all([
                TestDataFactory.createUserWithRole(app, 'ADMIN'),
                TestDataFactory.createUserWithRole(app, 'USER'),
            ]);
            adminToken = admin.token;
            userToken = user.token;
        });

        it('200: admin can get users by date range (createdAt)', async () => {
            const startDate = new Date('2024-01-01').toISOString();
            const endDate = new Date('2025-12-31').toISOString();

            const response = await request(app.getHttpServer())
                .get(
                    `/online-store/user/date-range?field=createdAt&startDate=${startDate}&endDate=${endDate}&page=1&limit=5`,
                )
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.meta).toHaveProperty('totalCount');
        });

        it('403: regular user cannot access date range query', async () => {
            const startDate = new Date('2024-01-01').toISOString();
            const endDate = new Date('2025-12-31').toISOString();

            await request(app.getHttpServer())
                .get(
                    `/online-store/user/date-range?field=createdAt&startDate=${startDate}&endDate=${endDate}`,
                )
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('400: invalid date range (startDate >= endDate)', async () => {
            const startDate = new Date('2025-12-31').toISOString();
            const endDate = new Date('2024-01-01').toISOString();

            await request(app.getHttpServer())
                .get(
                    `/online-store/user/date-range?field=createdAt&startDate=${startDate}&endDate=${endDate}`,
                )
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });
    });

    // ===== METRICS ENDPOINT =====
    describe('GET /user/admin/metrics', () => {
        let adminToken: string;
        let userToken: string;

        beforeAll(async () => {
            // Создаём admin пользователя для тестирования metrics
            const [admin] = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );
            const [regularUser] = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            // Логинимся за admin
            const adminLoginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: admin.email,
                    password: 'Test123!@#',
                })
                .expect(200);
            adminToken = adminLoginResponse.body.accessToken;

            // Логинимся за user
            const userLoginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: regularUser.email,
                    password: 'Test123!@#',
                })
                .expect(200);
            userToken = userLoginResponse.body.accessToken;
        });

        it('200: admin can get user module performance metrics', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/user/admin/metrics')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // Проверка структуры ответа
            expect(response.body).toHaveProperty('slowQueriesCount');
            expect(response.body).toHaveProperty('avgBulkOperationTime');
            expect(response.body).toHaveProperty('totalBulkOperations');
            expect(response.body).toHaveProperty('bulkOperationsByType');
            expect(response.body).toHaveProperty('errorRate');
            expect(response.body).toHaveProperty('timestamp');

            // Проверка типов данных
            expect(typeof response.body.slowQueriesCount).toBe('number');
            expect(typeof response.body.avgBulkOperationTime).toBe('number');
            expect(typeof response.body.totalBulkOperations).toBe('number');
            expect(typeof response.body.errorRate).toBe('number');
            expect(typeof response.body.timestamp).toBe('string');

            // Проверка bulkOperationsByType
            expect(response.body.bulkOperationsByType).toHaveProperty(
                'bulkActivateUsers',
            );
            expect(response.body.bulkOperationsByType).toHaveProperty(
                'bulkDeactivateUsers',
            );
            expect(response.body.bulkOperationsByType).toHaveProperty(
                'bulkBlockUsers',
            );
            expect(response.body.bulkOperationsByType).toHaveProperty(
                'bulkUnblockUsers',
            );
            expect(response.body.bulkOperationsByType).toHaveProperty(
                'bulkDeleteUsers',
            );
            expect(response.body.bulkOperationsByType).toHaveProperty(
                'bulkVerifyUsers',
            );

            // Проверка валидности данных
            expect(response.body.slowQueriesCount).toBeGreaterThanOrEqual(0);
            expect(response.body.avgBulkOperationTime).toBeGreaterThanOrEqual(0);
            expect(response.body.totalBulkOperations).toBeGreaterThanOrEqual(0);
            expect(response.body.errorRate).toBeGreaterThanOrEqual(0);
            expect(response.body.errorRate).toBeLessThanOrEqual(1);
        });

        it('403: regular user cannot access metrics endpoint', async () => {
            await request(app.getHttpServer())
                .get('/online-store/user/admin/metrics')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('401: unauthorized request to metrics endpoint', async () => {
            await request(app.getHttpServer())
                .get('/online-store/user/admin/metrics')
                .expect(401);
        });
    });
});
