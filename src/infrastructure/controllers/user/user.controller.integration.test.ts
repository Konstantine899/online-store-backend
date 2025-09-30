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