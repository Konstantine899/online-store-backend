import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp } from '../../../../tests/setup/app';
import { authLoginAs } from '../../../../tests/setup/auth';

describe('User Flags Integration Tests', () => {
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

    // ===== FLAGS ENDPOINTS =====
    describe('PATCH /user/profile/flags', () => {
        it('200: updates flags with valid data', async () => {
            const flagsData = {
                isActive: true,
                isNewsletterSubscribed: true,
                isMarketingConsent: false,
                isCookieConsent: true,
                isVipCustomer: false,
                isBetaTester: true,
            };

            const response = await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .set('Authorization', `Bearer ${userToken}`)
                .send(flagsData)
                .expect(200);

            expect(response.body).toHaveProperty('status', 200);
            expect(response.body).toHaveProperty('message', 'success');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toMatchObject(flagsData);
        });

        it('200: updates only provided flags', async () => {
            const flagsData = {
                isActive: false,
                isVipCustomer: true,
            };

            const response = await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .set('Authorization', `Bearer ${userToken}`)
                .send(flagsData)
                .expect(200);

            expect(response.body.data.isActive).toBe(false);
            expect(response.body.data.isVipCustomer).toBe(true);
        });

        it('400: invalid data types', async () => {
            const invalidData = {
                isActive: 'invalid_boolean',
                isVipCustomer: 123,
            };

            const response = await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .set('Authorization', `Bearer ${userToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('statusCode', 400);
            expect(response.body).toHaveProperty('message');
            expect(Array.isArray(response.body.message)).toBe(true);
        });

        it('401: requires auth', async () => {
            await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .send({ isActive: true })
                .expect(401);
        });

        it('200: accepts empty object', async () => {
            const response = await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .set('Authorization', `Bearer ${userToken}`)
                .send({})
                .expect(200);

            expect(response.body).toHaveProperty('status', 200);
            expect(response.body).toHaveProperty('data');
        });

        it('400: null and undefined values in flags', async () => {
            const flagsData = {
                isActive: null,
                isVipCustomer: undefined,
            };

            const response = await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .set('Authorization', `Bearer ${userToken}`)
                .send(flagsData)
                .expect(400);

            expect(response.body).toHaveProperty('statusCode', 400);
        });

        it('400: array instead of object', async () => {
            const response = await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .set('Authorization', `Bearer ${userToken}`)
                .send([{ isActive: true }])
                .expect(400);

            expect(response.body).toHaveProperty('statusCode', 400);
        });
    });
});
