/**
 * SEC-001-1: Password Update Token Invalidation Integration Tests
 * CRITICAL SECURITY: E2E тесты инвалидации refresh tokens
 */

import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp } from '../../setup/app';
import { TestDataFactory } from '../../utils/test-data-factory';

// Хелпер для создания запросов с tenant-id заголовком
const createRequest = (app: INestApplication) => {
    return request(app.getHttpServer()).set('x-tenant-id', '1');
};

describe('SEC-001-1: Password Update Invalidation (Integration)', () => {
    let app: INestApplication;
    let adminToken: string;

    beforeAll(async () => {
        app = await setupTestApp();

        // Создаём admin
        const admin = await TestDataFactory.createUserWithRole(app, 'ADMIN');
        adminToken = admin.token; // Правильное поле: token, не accessToken
    });

    afterAll(async () => {
        await app.close();
    });

    describe('🔒 CRITICAL: Token Invalidation on Password Update', () => {
        it('✅ E2E: refresh token должен перестать работать после admin password reset', async () => {
            // 1. Создаём пользователя и логинимся
            const user = await TestDataFactory.createUserWithRole(app, 'USER');
            const loginResponse = await createRequest(app)
                .post('/online-store/auth/login')
                .send({ email: user.email, password: user.password })
                .expect(HttpStatus.OK);

            // Извлекаем refresh token из cookies
            const setCookieHeader = loginResponse.headers[
                'set-cookie'
            ] as unknown as string[];
            const refreshTokenCookie = setCookieHeader.find((cookie: string) =>
                cookie.startsWith('refreshToken='),
            )!;
            expect(refreshTokenCookie).toBeDefined();

            // 2. Проверяем, что refresh токен работает ДО смены пароля
            await createRequest(app)
                .post('/online-store/auth/refresh')
                .set('Cookie', refreshTokenCookie)
                .expect(HttpStatus.OK);

            // 3. Admin меняет пароль пользователя
            await createRequest(app)
                .put(`/online-store/user/update/${user.userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: user.email,
                    password: 'NewSecurePassword123!',
                })
                .expect(HttpStatus.OK);

            // 4. CRITICAL: Старый refresh токен теперь НЕ должен работать
            await createRequest(app)
                .post('/online-store/auth/refresh')
                .set('Cookie', refreshTokenCookie)
                .expect(HttpStatus.UNAUTHORIZED); // ✅ Session invalidated!
        });

        it('✅ Множественные сессии: ВСЕ refresh токены инвалидируются', async () => {
            // Создаём пользователя
            const user = await TestDataFactory.createUserWithRole(app, 'USER');

            // Логинимся 2 раза (симулируем 2 устройства)
            const login1 = await createRequest(app)
                .post('/online-store/auth/login')
                .send({ email: user.email, password: user.password })
                .expect(HttpStatus.OK);

            const login2 = await createRequest(app)
                .post('/online-store/auth/login')
                .send({ email: user.email, password: user.password })
                .expect(HttpStatus.OK);

            const session1Cookie = (
                login1.headers['set-cookie'] as unknown as string[]
            ).find((c: string) => c.startsWith('refreshToken='))!;
            const session2Cookie = (
                login2.headers['set-cookie'] as unknown as string[]
            ).find((c: string) => c.startsWith('refreshToken='))!;

            // Проверяем, что оба токена работают ДО смены пароля
            await createRequest(app)
                .post('/online-store/auth/refresh')
                .set('Cookie', session1Cookie)
                .expect(HttpStatus.OK);

            await createRequest(app)
                .post('/online-store/auth/refresh')
                .set('Cookie', session2Cookie)
                .expect(HttpStatus.OK);

            // Admin меняет пароль
            await createRequest(app)
                .put(`/online-store/user/update/${user.userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: user.email,
                    password: 'NewPassword456!',
                })
                .expect(HttpStatus.OK);

            // CRITICAL: ОБА токена должны быть инвалидированы
            await createRequest(app)
                .post('/online-store/auth/refresh')
                .set('Cookie', session1Cookie)
                .expect(HttpStatus.UNAUTHORIZED);

            await createRequest(app)
                .post('/online-store/auth/refresh')
                .set('Cookie', session2Cookie)
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });
});
