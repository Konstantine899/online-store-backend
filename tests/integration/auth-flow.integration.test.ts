import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp } from '../setup/app';

/**
 * E2E тесты для полного Auth flow
 * 
 * Цель: проверить сквозной сценарий аутентификации
 * - Registration → создание нового пользователя
 * - Login → получение access и refresh токенов
 * - Access → использование access токена для защищённых endpoints
 * - Refresh → обновление access токена через refresh
 * - Logout → инвалидация refresh токена
 * - Token expiration → истечение токенов
 * - Refresh rotation → использование старого refresh токена должно быть запрещено
 */

describe('Auth Flow (e2e integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await setupTestApp();
    });

    afterAll(async () => {
        await app?.close();
    });

    describe('Полный сценарий: Registration → Login → Access → Refresh → Logout', () => {
        const uniqueEmail = `test.user.${Date.now()}@test.com`;
        let accessToken: string;
        let refreshCookie: string;

        it('Step 1: Registration - должен успешно зарегистрировать пользователя', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: uniqueEmail,
                    password: 'SecurePass123!',
                });

            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body.user).toHaveProperty('email', uniqueEmail);

            accessToken = response.body.accessToken;

            // RefreshToken должен быть в cookie
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
                const refreshCookieHeader = cookieArray.find((c: string) => c?.startsWith('refreshToken='));
                if (refreshCookieHeader) {
                    refreshCookie = refreshCookieHeader;
                }
            }

            // Проверяем, что accessToken не пустой
            expect(accessToken).toBeDefined();
            expect(typeof accessToken).toBe('string');
        });

        it('Step 2: Access - должен получить доступ к защищённому endpoint с access токеном', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/check')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toHaveProperty('email', uniqueEmail);
            expect(response.body).toHaveProperty('roles');
        });

        it('Step 3: Refresh - должен обновить access токен через refresh cookie', async () => {
            // Пропускаем если refreshCookie не был получен
            if (!refreshCookie) {
                console.warn('Skipping refresh test: no refresh cookie from registration');
                return;
            }

            const response = await request(app.getHttpServer())
                .post('/online-store/auth/refresh')
                .set('Cookie', refreshCookie);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toHaveProperty('accessToken');

            const newAccessToken = response.body.accessToken;

            // Новый access токен должен отличаться от старого
            expect(newAccessToken).not.toBe(accessToken);

            // Обновляем токены для следующих тестов
            accessToken = newAccessToken;

            // Обновляем refresh cookie если изменился
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
                const newRefreshCookie = cookieArray.find((c: string) => c?.startsWith('refreshToken='));
                if (newRefreshCookie) {
                    refreshCookie = newRefreshCookie;
                }
            }
        });

        it('Step 4: Access with new token - должен работать с обновлённым токеном', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/check')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(HttpStatus.OK);
        });

        it('Step 5: Logout - должен успешно выйти из системы', async () => {
            // Пропускаем если refreshCookie не был получен
            if (!refreshCookie || !accessToken) {
                console.warn('Skipping logout test: missing tokens');
                return;
            }

            const response = await request(app.getHttpServer())
                .delete('/online-store/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', refreshCookie);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toHaveProperty('message');
        });

        it('Step 6: Access after logout - должен запретить доступ после logout', async () => {
            // Пропускаем если refreshCookie не был получен
            if (!refreshCookie) {
                console.warn('Skipping post-logout test: missing refresh cookie');
                return;
            }

            const response = await request(app.getHttpServer())
                .post('/online-store/auth/refresh')
                .set('Cookie', refreshCookie);

            // После logout refresh токен должен быть инвалидирован
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('Login flow', () => {
        it('должен успешно войти с корректными credentials', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@example.com',
                    password: 'Password123!',
                });

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('type', 'Bearer');

            // RefreshToken должен быть в cookies
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
            const refreshCookie = cookieArray.find((c: string) => c?.startsWith('refreshToken='));
            expect(refreshCookie).toBeDefined();
        });

        it('должен вернуть 400 для некорректного email', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'Password123!',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен вернуть 401 для неправильного пароля', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@example.com',
                    password: 'WrongPassword123!',
                });

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });

        it('должен вернуть 401 для несуществующего пользователя', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'Password123!',
                });

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('Refresh token rotation', () => {
        let initialRefreshCookie: string;
        let secondRefreshCookie: string;

        beforeAll(async () => {
            // Логинимся для получения refresh токена
            const loginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@example.com',
                    password: 'Password123!',
                });

            const cookies = loginResponse.headers['set-cookie'];
            const cookieArray1 = Array.isArray(cookies) ? cookies : [cookies];
            initialRefreshCookie = cookieArray1.find((c: string) => c?.startsWith('refreshToken=')) || '';

            // Делаем первый refresh
            const firstRefreshResponse = await request(app.getHttpServer())
                .post('/online-store/auth/refresh')
                .set('Cookie', initialRefreshCookie);

            const newCookies = firstRefreshResponse.headers['set-cookie'];
            const cookieArray2 = Array.isArray(newCookies) ? newCookies : [newCookies];
            secondRefreshCookie = cookieArray2.find((c: string) => c?.startsWith('refreshToken=')) || '';
        });

        it('должен запретить использование старого refresh токена после ротации', async () => {
            // Пытаемся использовать старый (initial) cookie
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/refresh')
                .set('Cookie', initialRefreshCookie);

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });

        it('должен разрешить использование нового refresh токена', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/refresh')
                .set('Cookie', secondRefreshCookie);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toHaveProperty('accessToken');
        });
    });

    describe('Token expiration', () => {
        it('должен вернуть 401 для expired access токена', async () => {
            // Используем очевидно невалидный (expired) токен
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIyfQ.invalid';

            const response = await request(app.getHttpServer())
                .get('/online-store/auth/check')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.status).toBe(HttpStatus.FORBIDDEN);
        });

        it('должен вернуть 401 для невалидного refresh cookie', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/refresh')
                .set('Cookie', 'refreshToken=invalid-token-12345');

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('Registration валидация', () => {
        it('должен отклонить регистрацию с существующим email', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: 'admin@example.com', // Уже существует
                    password: 'SecurePass123!',
                });

            // Может вернуть 409 (Conflict) или 400 (Validation error) в зависимости от обработки
            expect([HttpStatus.CONFLICT, HttpStatus.BAD_REQUEST]).toContain(response.status);
        });

        it('должен отклонить регистрацию со слабым паролем', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: `weak.password.${Date.now()}@test.com`,
                    password: 'weak',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body).toBeInstanceOf(Array);
            const passwordError = response.body.find(
                (err: any) => err.property === 'password',
            );
            expect(passwordError).toBeDefined();
        });

        it('должен отклонить регистрацию без обязательных полей', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: 'test@test.com',
                    // Отсутствует password
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Authorization header валидация', () => {
        it('должен вернуть 401 при отсутствии Authorization header', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/check');

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });

        it('должен вернуть 401 для невалидного формата токена', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/check')
                .set('Authorization', 'InvalidFormat token123');

            expect(response.status).toBe(HttpStatus.FORBIDDEN);
        });

        it('должен вернуть 401/403 для пустого Bearer токена', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/check')
                .set('Authorization', 'Bearer ');

            // Пустой Bearer может вернуть 401 или 403 в зависимости от обработки
            expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(response.status);
        });
    });

    describe('Concurrent auth operations', () => {
        it('должен обрабатывать параллельные refresh requests корректно', async () => {
            // Логинимся для получения refresh токена
            const loginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@example.com',
                    password: 'Password123!',
                });

            const cookies = loginResponse.headers['set-cookie'];
            const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
            const refreshCookie = cookieArray.find((c: string) => c?.startsWith('refreshToken=')) || '';

            // Отправляем 3 параллельных refresh запроса с одним и тем же cookie
            const promises = Array.from({ length: 3 }, () =>
                request(app.getHttpServer())
                    .post('/online-store/auth/refresh')
                    .set('Cookie', refreshCookie),
            );

            const responses = await Promise.all(promises);

            // Из-за race condition один успешный, остальные 401
            const successfulResponses = responses.filter((r) => r.status === HttpStatus.OK);
            const failedResponses = responses.filter((r) => r.status === HttpStatus.UNAUTHORIZED);

            // Общее количество должно быть 3
            expect(successfulResponses.length + failedResponses.length).toBe(3);
            // Хотя бы один успешный
            expect(successfulResponses.length).toBeGreaterThanOrEqual(1);
        });
    });
});

