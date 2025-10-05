import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp } from '../../../../../tests/setup/app';
import { authLoginAs } from '../../../../../tests/setup/auth';

describe('User Profile Integration Tests', () => {
    let app: INestApplication;
    let userToken: string;

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
    });

    afterAll(async () => {
        await app.close();
    });

    // ===== PHONE ENDPOINTS =====
    describe('PATCH /user/profile/phone', () => {
            it('200: updates phone with valid number', async () => {
                await request(app.getHttpServer())
                    .patch('/online-store/user/profile/phone')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ phone: '+79990000999' })
                    .expect(200)
                    .expect(({ body }) => {
                        expect(body?.data?.phone).toBe('+79990000999');
                    });
            });

        it('400: rejects invalid phone format', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ phone: '8(999)123-45-67' })
                .expect(400)
                .expect(({ body }) => {
                    expect(body.message).toBe('Некорректные данные: обновление телефона');
                });
        });

        it('401: requires auth', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .send({ phone: '+79991234567' })
                .expect(401);
        });
        
            it('409: rejects duplicate phone for another user', async () => {
                const tokenUser = await authLoginAs(app, 'user');
                await request(app.getHttpServer())
                    .patch('/online-store/user/profile/phone')
                    .set('Authorization', `Bearer ${tokenUser}`)
                    .send({ phone: '+79990000998' })
                    .expect(200);

                const tokenAdmin = await authLoginAs(app, 'admin');
                await request(app.getHttpServer())
                    .patch('/online-store/user/profile/phone')
                    .set('Authorization', `Bearer ${tokenAdmin}`)
                    .send({ phone: '+79990000998' })
                    .expect(409);
            });
    });

    // ===== PROFILE ENDPOINTS =====
    describe('PATCH /user/profile', () => {
        it('200: user updates own profile', async () => {
            const payload = {
                firstName: 'Владимир',
                lastName: 'Владимиров',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(payload)
                .expect(200);

            expect(response.body).toHaveProperty('firstName');
            expect(response.body).toHaveProperty('lastName');
            expect(response.body.firstName).toBe(payload.firstName);
            expect(response.body.lastName).toBe(payload.lastName);
        });

        it('200: partial update only firstName', async () => {
            const payload = {
                firstName: 'Алексей',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(payload)
                .expect(200);

            expect(response.body.firstName).toBe(payload.firstName);
            // lastName остался прежним
            expect(response.body.lastName).toBe('Владимиров');
        });

        it('401: requires auth', async () => {
            const payload = {
                firstName: 'Тест',
            };

            await request(app.getHttpServer())
                .patch('/online-store/user/profile')
                .send(payload)
                .expect(401);
        });
    });

    // ===== PASSWORD MANAGEMENT =====
    describe('Password management', () => {
        it('400: wrong old password', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/password')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ oldPassword: 'wrong-old', newPassword: 'NewPass123!' })
                .expect(400);
        });
    });

    // ===== MISC ENDPOINTS =====
    describe('Misc endpoints', () => {
        it('200: GET /user/me with minimal body', async () => {
            const res = await request(app.getHttpServer())
                .get('/online-store/user/me')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(res.body?.id).toBeDefined();
        });
    });
});
