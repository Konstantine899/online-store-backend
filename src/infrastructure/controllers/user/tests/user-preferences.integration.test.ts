import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestDataFactory } from '../../../../../tests/utils';

describe('User Preferences Integration Tests', () => {
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
        if (app) {
            await app.close();
        }
    });

    // ===== PREFERENCES ENDPOINTS =====
    describe('PATCH /user/profile/preferences', () => {
        it('200: updates preferences with valid data', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                themePreference: 'dark',
                defaultLanguage: 'en',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toMatchObject(preferencesData);
        });

        it('200: updates only provided preferences', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                themePreference: 'light',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.themePreference).toBe('light');
        });

        it('400: invalid enum values', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const invalidData = {
                themePreference: 'neon',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidData)
                .expect(400);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0]).toHaveProperty('status', 400);
            expect(response.body[0]).toHaveProperty('messages');
            expect(Array.isArray(response.body[0].messages)).toBe(true);
        });

        it('401: requires auth', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .send({ themePreference: 'dark' })
                .expect(401);
        });

        it('200: accepts empty object', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(200);

            expect(response.body).toHaveProperty('data');
        });

        it('400: very long strings in preferences', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const longString = 'a'.repeat(1000);
            const preferencesData = {
                themePreference: longString,
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(400);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0]).toHaveProperty('status', 400);
        });

        it('200: special characters in preferences', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                defaultLanguage: 'en',
                notificationPreferences: {
                    'special-chars': 'test@#$%^&*()',
                    'spaces and symbols': 'value with spaces',
                },
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.defaultLanguage).toBe('en');
            expect(response.body.data.notificationPreferences).toEqual(
                preferencesData.notificationPreferences,
            );
        });
    });
});
