import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { authLoginAs } from '../../../../../tests/setup/auth';
import { TestCleanup, TestDataFactory } from '../../../../../tests/utils';

describe('User Profile Integration Tests', () => {
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
    });

    afterAll(async () => {
        const sequelize = app.get(Sequelize);
        // Cleanup всех созданных пользователей (id > 14)
        await TestCleanup.cleanUsers(sequelize);
        await app.close();
    });

    // ===== PHONE ENDPOINTS =====
    describe('PATCH /user/profile/phone', () => {
        it('200: updates phone with valid number', async () => {
            const { token } = await TestDataFactory.createUserWithRole(app, 'USER');
            const uniquePhone = TestDataFactory.uniquePhone();
            
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phone: uniquePhone })
                .expect(200)
                .expect(({ body }) => {
                    expect(body?.data?.phone).toBe(uniquePhone);
                });
        });

        it('400: rejects invalid phone format', async () => {
            const { token } = await TestDataFactory.createUserWithRole(app, 'USER');
            
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phone: '8(999)123-45-67' })
                .expect(400)
                .expect(({ body }) => {
                    expect(body.message).toBe(
                        'Некорректные данные: обновление телефона',
                    );
                });
        });

        it('401: requires auth', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .send({ phone: '+79991234567' })
                .expect(401);
        });

        it('409: rejects duplicate phone for another user', async () => {
            const user1 = await TestDataFactory.createUserWithRole(app, 'USER');
            const user2 = await TestDataFactory.createUserWithRole(app, 'USER');
            const uniquePhone = TestDataFactory.uniquePhone();
            
            // User 1 устанавливает уникальный телефон
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${user1.token}`)
                .send({ phone: uniquePhone })
                .expect(200);

            // User 2 пытается установить тот же телефон - должна быть ошибка 409
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${user2.token}`)
                .send({ phone: uniquePhone })
                .expect(409);
        });
    });

    // ===== PROFILE ENDPOINTS =====
    describe('PATCH /user/profile', () => {
        it('200: user updates own profile', async () => {
            const { token } = await TestDataFactory.createUserWithRole(app, 'USER');
            const payload = {
                firstName: 'Владимир',
                lastName: 'Владимиров',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(payload)
                .expect(200);

            expect(response.body).toHaveProperty('firstName');
            expect(response.body).toHaveProperty('lastName');
            expect(response.body.firstName).toBe(payload.firstName);
            expect(response.body.lastName).toBe(payload.lastName);
        });

        it('200: partial update only firstName', async () => {
            const { token } = await TestDataFactory.createUserWithRole(app, 'USER');
            
            // Сначала устанавливаем полный профиль
            await request(app.getHttpServer())
                .patch('/online-store/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ firstName: 'Иван', lastName: 'Иванов' })
                .expect(200);

            // Теперь обновляем только firstName
            const payload = {
                firstName: 'Алексей',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(payload)
                .expect(200);

            expect(response.body.firstName).toBe(payload.firstName);
            // lastName остался прежним (Иванов)
            expect(response.body.lastName).toBe('Иванов');
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
            const { token } = await TestDataFactory.createUserWithRole(app, 'USER');
            
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/password')
                .set('Authorization', `Bearer ${token}`)
                .send({ oldPassword: 'wrong-old', newPassword: 'NewPass123!' })
                .expect(400);
        });
    });

    // ===== MISC ENDPOINTS =====
    describe('Misc endpoints', () => {
        it('200: GET /user/me with minimal body', async () => {
            const { token } = await TestDataFactory.createUserWithRole(app, 'USER');
            
            const res = await request(app.getHttpServer())
                .get('/online-store/user/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(res.body?.id).toBeDefined();
        });
    });
});
