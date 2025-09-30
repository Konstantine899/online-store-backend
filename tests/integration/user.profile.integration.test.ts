import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp } from '../setup/app';
import { authLoginAs } from '../setup/auth';

describe('User profile & admin endpoints (401 without token)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await setupTestApp();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('PATCH /user/profile/flags -> 401 без токена', async () => {
        await request(app.getHttpServer())
            .patch('/user/profile/flags')
            .send({ isActive: false })
            .expect(401);
    });

    it('PATCH /user/profile/preferences -> 401 без токена', async () => {
        await request(app.getHttpServer())
            .patch('/user/profile/preferences')
            .send({ themePreference: 'dark' })
            .expect(401);
    });

    it('PATCH /user/verify/email/1 -> 401 без токена', async () => {
        await request(app.getHttpServer())
            .patch('/user/verify/email/1')
            .expect(401);
    });

    it('PATCH /user/verify/phone/1 -> 401 без токена', async () => {
        await request(app.getHttpServer())
            .patch('/user/verify/phone/1')
            .expect(401);
    });

    it('PUT /user/update/1 -> 401 без токена', async () => {
        await request(app.getHttpServer())
            .put('/user/update/1')
            .expect(401);
    });

    it('PATCH /user/profile/preferences -> 200 с токеном USER', async () => {
        const token = await authLoginAs(app, 'user');
        await request(app.getHttpServer())
            .patch('/user/profile/preferences')
            .set('Authorization', `Bearer ${token}`)
            .send({ themePreference: 'dark' })
            .expect(200);
    });

    it('PATCH /user/verify/email/99999 -> 404 с токеном ADMIN', async () => {
        const token = await authLoginAs(app, 'admin');
        await request(app.getHttpServer())
            .patch('/user/verify/email/99999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });

    it('PUT /user/update/1 -> 403 с токеном USER', async () => {
        const token = await authLoginAs(app, 'user');
        await request(app.getHttpServer())
            .put('/user/update/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });

    // Self-service verification (email/phone)
    it('POST /user/verify/email/request -> 401 без токена', async () => {
        await request(app.getHttpServer())
            .post('/user/verify/email/request')
            .expect(401);
    });

    it('POST /user/verify/email/request -> 200 с токеном USER', async () => {
        const token = await authLoginAs(app, 'user');
        await request(app.getHttpServer())
            .post('/user/verify/email/request')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });

    it('POST /user/verify/email/confirm -> 400 при неверном коде', async () => {
        const token = await authLoginAs(app, 'user');
        await request(app.getHttpServer())
            .post('/user/verify/email/confirm')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: 'wrong' })
            .expect(400);
    });

    it('POST /user/verify/phone/request -> 401 без токена', async () => {
        await request(app.getHttpServer())
            .post('/user/verify/phone/request')
            .expect(401);
    });

    it('POST /user/verify/phone/request -> 200 с токеном USER', async () => {
        const token = await authLoginAs(app, 'user');
        await request(app.getHttpServer())
            .post('/user/verify/phone/request')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });

    it('POST /user/verify/phone/confirm -> 400 при неверном коде', async () => {
        const token = await authLoginAs(app, 'user');
        await request(app.getHttpServer())
            .post('/user/verify/phone/confirm')
            .set('Authorization', `Bearer ${token}`)
            .send({ code: 'wrong' })
            .expect(400);
    });
});


