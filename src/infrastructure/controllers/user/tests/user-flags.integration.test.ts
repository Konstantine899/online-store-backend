import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestCleanup, TestDataFactory } from '../../../../../tests/utils';

describe('User Flags Integration Tests', () => {
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
        await app.close();
    });

    // ===== FLAGS ENDPOINTS =====
    describe('PATCH /user/profile/flags', () => {
        it('200: updates flags with valid data', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const flagsData = {
                isActive: true,
                isNewsletterSubscribed: true,
                isMarketingConsent: false,
                isCookieConsent: true,
                isVipCustomer: false,
                isBetaTester: true,
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/flags')
                .set('Authorization', `Bearer ${token}`)
                .send(flagsData)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toMatchObject(flagsData);
        });

        it('200: updates only provided flags', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const flagsData = {
                isActive: false,
                isVipCustomer: true,
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/flags')
                .set('Authorization', `Bearer ${token}`)
                .send(flagsData)
                .expect(200);

            expect(response.body.data.isActive).toBe(false);
            expect(response.body.data.isVipCustomer).toBe(true);
        });

        it('400: invalid data types', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const invalidData = {
                isActive: 'invalid_boolean',
                isVipCustomer: 123,
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/flags')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidData)
                .expect(400);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0]).toHaveProperty('messages');
            expect(Array.isArray(response.body[0].messages)).toBe(true);
        });

        it('401: requires auth', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/flags')
                .send({ isActive: true })
                .expect(401);
        });

        it('200: accepts empty object', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/flags')
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(typeof response.body.data).toBe('object');
        });

        it('400: null and undefined values in flags', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const flagsData = {
                isActive: null,
                isVipCustomer: undefined,
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/flags')
                .set('Authorization', `Bearer ${token}`)
                .send(flagsData)
                .expect(400);

            expect(response.body).toHaveProperty('statusCode', 400);
        });

        it('400: array instead of object', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/flags')
                .set('Authorization', `Bearer ${token}`)
                .send([{ isActive: true }])
                .expect(400);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});
