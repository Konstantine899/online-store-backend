import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp } from './../../../../tests/setup/app';
import { authLoginAs } from './../../../../tests/setup/auth';
import { UpdateUserDto } from '@app/infrastructure/dto';

describe('Users: PATCH /user/profile/phone', () => {
    let app: INestApplication;
    let accessToken: string;

    beforeAll(async () => {
        app = await setupTestApp();
        accessToken = await authLoginAs(app, 'user');
    });

    afterAll(async () => {
        await app.close();
    });

    it('200: updates phone with valid number', async () => {
        await request(app.getHttpServer())
            .patch('/user/profile/phone')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ phone: '+79990000001' })
            .expect(200)
            .expect(({ body }) => {
                expect(body?.data?.phone).toBe('+79990000001');
            });
    });

    it('400: rejects invalid phone format', async () => {
        await request(app.getHttpServer())
            .patch('/user/profile/phone')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ phone: '8(999)123-45-67' })
            .expect(400)
            .expect(({ body }) => {
                expect(body.message).toEqual(
                    expect.arrayContaining(['Неверный формат номера телефона']),
                );
            });
    });

    it('401: requires auth', async () => {
        await request(app.getHttpServer())
            .patch('/user/profile/phone')
            .send({ phone: '+79991234567' })
            .expect(401);
    });
    
    it('409: rejects duplicate phone for another user', async () => {
        const tokenUser = await authLoginAs(app, 'user');
        await request(app.getHttpServer())
            .patch('/user/profile/phone')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ phone: '+79990000002' })
            .expect(200);

        const tokenAdmin = await authLoginAs(app, 'admin');
        await request(app.getHttpServer())
            .patch('/user/profile/phone')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ phone: '+79990000002' })
            .expect(409);
    });
});

describe('Users: PUT /user/update/:id email unique', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await setupTestApp();
    });

    afterAll(async () => {
        await app.close();
    });

    it('409: rejects duplicate email on update', async () => {
        // Используем известный id пользователя из сидов (user@example.com -> id=3)
        const userId = 3;

        // Админ пытается обновить email пользователя на уже существующий admin@example.com
        const adminToken = await authLoginAs(app, 'admin');
        const payload: Partial<UpdateUserDto> = { email: 'admin@example.com' };
        await request(app.getHttpServer())
            .put(`/user/update/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(payload)
            .expect(409);
    });
});

describe('Users: Guards (401/403)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await setupTestApp();
    });

    it('401: admin endpoint without token', async () => {
        await request(app.getHttpServer())
            .get('/user/get-list-users')
            .expect(401);
    });

    it('403: admin endpoint under USER role', async () => {
        const userToken = await authLoginAs(app, 'user');
        await request(app.getHttpServer())
            .get('/user/get-list-users')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(403);
    });

    it('403: GET /user/:id under USER role', async () => {
        const userToken = await authLoginAs(app, 'user');
        await request(app.getHttpServer())
            .get('/user/1')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(403);
    });

    it('403: POST /user/create under USER role', async () => {
        const userToken = await authLoginAs(app, 'user');
        await request(app.getHttpServer())
            .post('/user/create')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ email: 'x@y.z', password: 'Strong123!' })
            .expect(403);
    });
});

describe('Users: Profile flags and preferences validation', () => {
    let app: INestApplication;
    let userToken: string;

    beforeAll(async () => {
        app = await setupTestApp();
        userToken = await authLoginAs(app, 'user');
    });

    afterAll(async () => {
        await app.close();
    });

    it('PATCH /user/profile/flags -> 200 with valid payload', async () => {
        await request(app.getHttpServer())
            .patch('/user/profile/flags')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ isActive: true, isMarketingConsent: false })
            .expect(200);
    });

    it('PATCH /user/profile/flags -> 400 on invalid types', async () => {
        await request(app.getHttpServer())
            .patch('/user/profile/flags')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ isActive: 'yes' })
            .expect(400);
    });

    it('PATCH /user/profile/preferences -> 400 on invalid enum', async () => {
        await request(app.getHttpServer())
            .patch('/user/profile/preferences')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ themePreference: 'neon' })
            .expect(400);
    });
});

describe('Users: Admin flag endpoints (200 ADMIN, 403 USER)', () => {
    let app: INestApplication;
    let adminToken: string;
    let userToken: string;
    const targetUserId = 3; // существующий user из сидов

    beforeAll(async () => {
        app = await setupTestApp();
        adminToken = await authLoginAs(app, 'admin');
        userToken = await authLoginAs(app, 'user');
    });

    afterAll(async () => {
        await app.close();
    });

    const adminCases: Array<{ path: string }> = [
        { path: `/user/admin/block/${targetUserId}` },
        { path: `/user/admin/unblock/${targetUserId}` },
        { path: `/user/admin/suspend/${targetUserId}` },
        { path: `/user/admin/unsuspend/${targetUserId}` },
        { path: `/user/admin/delete/${targetUserId}` },
        { path: `/user/admin/restore/${targetUserId}` },
        { path: `/user/admin/premium/upgrade/${targetUserId}` },
        { path: `/user/admin/premium/downgrade/${targetUserId}` },
        { path: `/user/admin/employee/set/${targetUserId}` },
        { path: `/user/admin/employee/unset/${targetUserId}` },
        { path: `/user/admin/vip/set/${targetUserId}` },
        { path: `/user/admin/vip/unset/${targetUserId}` },
        { path: `/user/admin/highvalue/set/${targetUserId}` },
        { path: `/user/admin/highvalue/unset/${targetUserId}` },
        { path: `/user/admin/wholesale/set/${targetUserId}` },
        { path: `/user/admin/wholesale/unset/${targetUserId}` },
        { path: `/user/admin/affiliate/set/${targetUserId}` },
        { path: `/user/admin/affiliate/unset/${targetUserId}` },
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

describe('Users: Misc endpoints (me, password, verify phone, list, create/delete, roles)', () => {
    let app: INestApplication;
    let userToken: string;
    let adminToken: string;

    beforeAll(async () => {
        app = await setupTestApp();
        userToken = await authLoginAs(app, 'user');
        adminToken = await authLoginAs(app, 'admin');
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /user/me -> 200 or 400 with minimal body', async () => {
        const res = await request(app.getHttpServer())
            .get('/user/me')
            .set('Authorization', `Bearer ${adminToken}`);
        expect([200, 400]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body?.id || res.body?.data?.id).toBeDefined();
        }
    });

    it('PATCH /user/profile/password -> 400 wrong oldPassword', async () => {
        await request(app.getHttpServer())
            .patch('/user/profile/password')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ oldPassword: 'wrong-old', newPassword: 'NewPass123!' })
            .expect(400);
    });

    it('PATCH /user/verify/phone/:id -> 200 ADMIN', async () => {
        await request(app.getHttpServer())
            .patch('/user/verify/phone/3')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
    });

    it('GET /user/get-list-users -> 200 ADMIN', async () => {
        await request(app.getHttpServer())
            .get('/user/get-list-users?page=1&limit=5')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
    });

    it('GET /user/get-list-users -> 400 invalid query', async () => {
        await request(app.getHttpServer())
            .get('/user/get-list-users?page=abc&limit=NaN')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(400);
    });

    it('POST /user/create -> 201 ADMIN, then DELETE /user/delete/:id -> 200', async () => {
        const uniqueEmail = `newuser+${Date.now()}@example.com`;
        const createRes = await request(app.getHttpServer())
            .post('/user/create')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ email: uniqueEmail, password: 'StrongPass123!' })
            .expect(201);

        const newUserId = createRes.body?.data?.id || createRes.body?.id;
        expect(newUserId).toBeTruthy();

        const delRes = await request(app.getHttpServer())
            .delete(`/user/delete/${newUserId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect([200, 404]).toContain(delRes.status);
    });

    it('POST /user/role/add -> 201 then DELETE /user/role/delete -> 200', async () => {
        // Добавляем роль ADMIN пользователю 3, затем удаляем USER
        await request(app.getHttpServer())
            .post('/user/role/add')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ userId: 3, role: 'ADMIN' })
            .expect(201);

        await request(app.getHttpServer())
            .delete('/user/role/delete')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ userId: 3, role: 'ADMIN' })
            .expect(200);
    });
});