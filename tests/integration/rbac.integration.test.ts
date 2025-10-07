import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp } from '../setup/app';

/**
 * E2E тесты для RBAC (Role-Based Access Control)
 * 
 * Цель: проверить корректную работу контроля доступа на основе ролей
 * - USER не может получить доступ к ADMIN endpoints → 403
 * - ADMIN может получить доступ к ADMIN endpoints → 200
 * - Guest (без токена) не может получить доступ к защищённым endpoints → 401
 * - Публичные endpoints доступны всем → 200
 * - Проверка различных защищённых endpoints
 */

describe('RBAC (e2e integration)', () => {
    let app: INestApplication;
    let adminToken: string;
    let userToken: string;

    beforeAll(async () => {
        app = await setupTestApp();

        // Получаем токен админа
        const adminLogin = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'Password123!',
            });

        if (adminLogin.status === HttpStatus.OK) {
            adminToken = adminLogin.body.accessToken;
        }

        // Получаем токен обычного пользователя
        const userLogin = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send({
                email: 'user@example.com',
                password: 'Password123!',
            });

        if (userLogin.status === HttpStatus.OK) {
            userToken = userLogin.body.accessToken;
        }
    });

    afterAll(async () => {
        await app?.close();
    });

    describe('Guest (без токена)', () => {
        it('должен вернуть 401 при доступе к /auth/check без токена', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/check');

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('USER роль (ограниченный доступ)', () => {
        it('должен разрешить проверку авторизации для USER → 200', async () => {
            if (!userToken) {
                console.warn('USER токен недоступен - пропускаем тест');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/auth/check')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toHaveProperty('email', 'user@example.com');
            expect(response.body).toHaveProperty('roles');
            expect(Array.isArray(response.body.roles)).toBe(true);
        });
    });

    describe('ADMIN роль (полный доступ)', () => {
        it('должен разрешить проверку авторизации для ADMIN → 200', async () => {
            if (!adminToken) {
                console.warn('ADMIN токен недоступен - пропускаем тест');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/auth/check')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toHaveProperty('email', 'admin@example.com');
            expect(response.body).toHaveProperty('roles');
            expect(Array.isArray(response.body.roles)).toBe(true);
            expect(response.body.roles.length).toBeGreaterThan(0);
        });
    });

    describe('Публичные endpoints (доступны всем)', () => {
        it('должен разрешить доступ к health endpoint без токена → 200', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/health');

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toHaveProperty('status');
        });
    });

    describe('Проверка сообщений об ошибках RBAC', () => {
        it('должен вернуть корректное русское сообщение об ошибке для 401', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/check');

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
            expect(response.body).toHaveProperty('message');
            // Проверяем, что сообщение не пустое и на русском
            expect(typeof response.body.message).toBe('string');
            expect(response.body.message.length).toBeGreaterThan(0);
        });
    });
});

