import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp } from '../setup/app';
import { authLoginAs } from '../setup/auth';

describe('User Flags API Integration Tests', () => {
    let app: INestApplication;
    let userToken: string;
    let adminToken: string;

    beforeAll(async () => {
        app = await setupTestApp();
        await app.init();
        
        // Получаем токены для тестирования
        userToken = await authLoginAs(app, 'user');
        adminToken = await authLoginAs(app, 'admin');
    });

    afterAll(async () => {
        await app.close();
    });

    describe('PATCH /user/profile/flags', () => {
        it('должен обновить флаги пользователя с валидными данными', async () => {
            const flagsData = {
                is_active: true,
                is_newsletter_subscribed: true,
                is_marketing_consent: false,
                is_cookie_consent: true,
                is_vip_customer: false,
                is_beta_tester: true,
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

        it('должен обновить только переданные флаги', async () => {
            const flagsData = {
                is_active: false,
                is_vip_customer: true,
            };

            const response = await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .set('Authorization', `Bearer ${userToken}`)
                .send(flagsData)
                .expect(200);

            expect(response.body.data.is_active).toBe(false);
            expect(response.body.data.is_vip_customer).toBe(true);
        });

        it('должен вернуть 400 при невалидных данных', async () => {
            const invalidData = {
                is_active: 'invalid_boolean',
                is_vip_customer: 123,
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

        it('должен вернуть 401 без токена', async () => {
            await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .send({ is_active: true })
                .expect(401);
        });

        it('должен вернуть 401 с невалидным токеном', async () => {
            await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .set('Authorization', 'Bearer invalid_token')
                .send({ is_active: true })
                .expect(401);
        });

        it('должен принять пустой объект', async () => {
            const response = await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .set('Authorization', `Bearer ${userToken}`)
                .send({})
                .expect(200);

            expect(response.body).toHaveProperty('status', 200);
            expect(response.body).toHaveProperty('data');
        });
    });

    describe('PATCH /user/profile/preferences', () => {
        it('должен обновить предпочтения пользователя с валидными данными', async () => {
            const preferencesData = {
                preferred_language: 'en',
                timezone: 'America/New_York',
                theme_preference: 'dark',
                default_language: 'en',
            };

            const response = await request(app.getHttpServer())
                .patch('/user/profile/preferences')
                .set('Authorization', `Bearer ${userToken}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body).toHaveProperty('status', 200);
            expect(response.body).toHaveProperty('message', 'success');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toMatchObject(preferencesData);
        });

        it('должен обновить только переданные предпочтения', async () => {
            const preferencesData = {
                theme_preference: 'light',
            };

            const response = await request(app.getHttpServer())
                .patch('/user/profile/preferences')
                .set('Authorization', `Bearer ${userToken}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.theme_preference).toBe('light');
        });

        it('должен вернуть 400 при невалидных данных', async () => {
            const invalidData = {
                preferred_language: 123,
                theme_preference: 'invalid_theme',
            };

            const response = await request(app.getHttpServer())
                .patch('/user/profile/preferences')
                .set('Authorization', `Bearer ${userToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('statusCode', 400);
            expect(response.body).toHaveProperty('message');
            expect(Array.isArray(response.body.message)).toBe(true);
        });

        it('должен вернуть 401 без токена', async () => {
            await request(app.getHttpServer())
                .patch('/user/profile/preferences')
                .send({ theme_preference: 'dark' })
                .expect(401);
        });

        it('должен принять пустой объект', async () => {
            const response = await request(app.getHttpServer())
                .patch('/user/profile/preferences')
                .set('Authorization', `Bearer ${userToken}`)
                .send({})
                .expect(200);

            expect(response.body).toHaveProperty('status', 200);
            expect(response.body).toHaveProperty('data');
        });
    });

    describe('GET /user/admin/stats', () => {
        it('должен вернуть статистику пользователей для админа', async () => {
            const response = await request(app.getHttpServer())
                .get('/user/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('status', 200);
            expect(response.body).toHaveProperty('message', 'success');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('totalUsers');
            expect(response.body.data).toHaveProperty('activeUsers');
            expect(response.body.data).toHaveProperty('blockedUsers');
            expect(response.body.data).toHaveProperty('vipUsers');
            expect(response.body.data).toHaveProperty('newsletterSubscribers');
            expect(response.body.data).toHaveProperty('premiumUsers');
            expect(response.body.data).toHaveProperty('employees');
            expect(response.body.data).toHaveProperty('affiliates');
            expect(response.body.data).toHaveProperty('wholesaleUsers');
            expect(response.body.data).toHaveProperty('highValueUsers');
            
            // Проверяем, что все значения - числа
            Object.values(response.body.data).forEach(value => {
                expect(typeof value).toBe('number');
                expect(value).toBeGreaterThanOrEqual(0);
            });
        });

        it('должен вернуть 403 для обычного пользователя', async () => {
            await request(app.getHttpServer())
                .get('/user/admin/stats')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('должен вернуть 401 без токена', async () => {
            await request(app.getHttpServer())
                .get('/user/admin/stats')
                .expect(401);
        });
    });

    describe('Edge cases and error handling', () => {
        it('должен обработать очень длинные строки в предпочтениях', async () => {
            const longString = 'a'.repeat(1000);
            const preferencesData = {
                preferred_language: longString,
            };

            const response = await request(app.getHttpServer())
                .patch('/user/profile/preferences')
                .set('Authorization', `Bearer ${userToken}`)
                .send(preferencesData)
                .expect(400);

            expect(response.body).toHaveProperty('statusCode', 400);
        });

        it('должен обработать специальные символы в предпочтениях', async () => {
            const preferencesData = {
                theme_preference: 'dark-mode-v2.0',
                timezone: 'UTC+3',
            };

            const response = await request(app.getHttpServer())
                .patch('/user/profile/preferences')
                .set('Authorization', `Bearer ${userToken}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.theme_preference).toBe('dark-mode-v2.0');
            expect(response.body.data.timezone).toBe('UTC+3');
        });

        it('должен обработать null и undefined значения', async () => {
            const flagsData = {
                is_active: null,
                is_vip_customer: undefined,
            };

            const response = await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .set('Authorization', `Bearer ${userToken}`)
                .send(flagsData)
                .expect(400);

            expect(response.body).toHaveProperty('statusCode', 400);
        });

        it('должен обработать массив вместо объекта', async () => {
            const response = await request(app.getHttpServer())
                .patch('/user/profile/flags')
                .set('Authorization', `Bearer ${userToken}`)
                .send([{ is_active: true }])
                .expect(400);

            expect(response.body).toHaveProperty('statusCode', 400);
        });
    });
});
