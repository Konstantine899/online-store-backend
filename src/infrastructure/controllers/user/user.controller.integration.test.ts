import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp } from './../../../../tests/setup/app';
import { authLoginAs } from './../../../../tests/setup/auth';

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
            .send({ phone: '+79991234567' })
            .expect(200)
            .expect(({ body }) => {
                expect(body?.data?.phone).toBe('+79991234567');
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
});