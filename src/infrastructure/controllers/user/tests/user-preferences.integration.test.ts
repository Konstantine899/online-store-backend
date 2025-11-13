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

        it('200: updates preferredLanguage with valid value', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                preferredLanguage: 'es',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.preferredLanguage).toBe('es');
        });

        it('400: invalid preferredLanguage value', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const invalidData = {
                preferredLanguage: 'invalid_lang',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidData)
                .expect(400);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0]).toHaveProperty('status', 400);
            expect(response.body[0]).toHaveProperty('messages');
        });

        it('200: updates timezone with valid IANA value', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                timezone: 'America/New_York',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.timezone).toBe('America/New_York');
        });

        it('400: invalid timezone value', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const invalidData = {
                timezone: 'Invalid/Timezone',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidData)
                .expect(400);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0]).toHaveProperty('status', 400);
            expect(response.body[0].messages).toContain(
                'Часовой пояс должен быть одним из поддерживаемых IANA timezone',
            );
        });

        it('200: updates all preference fields simultaneously', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                themePreference: 'auto',
                preferredLanguage: 'fr',
                defaultLanguage: 'en',
                timezone: 'Europe/Paris',
                notificationPreferences: { email: true, push: false },
                translations: { welcome: 'Bienvenue' },
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data).toMatchObject(preferencesData);
        });

        it('200: tenant isolation - user A cannot affect user B preferences', async () => {
            // Create User A
            const { token: tokenA } =
                await TestDataFactory.createUserWithRole(app, 'USER');

            // Set preferences for User A
            const responseA1 = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ themePreference: 'dark', timezone: 'UTC' })
                .expect(200);

            expect(responseA1.body.data.themePreference).toBe('dark');
            expect(responseA1.body.data.timezone).toBe('UTC');

            // Create User B
            const { token: tokenB } =
                await TestDataFactory.createUserWithRole(app, 'USER');

            // Set different preferences for User B
            const responseB = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${tokenB}`)
                .send({
                    themePreference: 'light',
                    timezone: 'Asia/Tokyo',
                })
                .expect(200);

            expect(responseB.body.data.themePreference).toBe('light');
            expect(responseB.body.data.timezone).toBe('Asia/Tokyo');

            // Verify User A preferences remain unchanged by getting them again
            const responseA2 = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({}) // Empty update to get current preferences
                .expect(200);

            expect(responseA2.body.data.themePreference).toBe('dark');
            expect(responseA2.body.data.timezone).toBe('UTC');
        });
    });
});
