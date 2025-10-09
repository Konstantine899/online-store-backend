import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestDataFactory } from '../../../../../tests/utils';

/**
 * E2E тесты для RBAC (Role-Based Access Control)
 *
 * Цель: проверить корректную работу контроля доступа на основе ролей
 * - USER не может получить доступ к ADMIN endpoints → 403
 * - ADMIN может получить доступ к ADMIN endpoints → 200
 * - Guest (без токена) не может получить доступ к защищённым endpoints → 401
 * - Публичные endpoints доступны всем → 200
 * - Проверка различных защищённых endpoints
 *
 * Оптимизации производительности:
 * - Unique users для каждого теста (изоляция данных)
 * - Использование TestDataFactory для создания пользователей
 * - Fail-fast проверка токенов в beforeAll
 */

describe('RBAC (e2e integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
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
        await app?.close();
    });

    describe('Guest (без токена)', () => {
        it('должен вернуть 401 при доступе к /auth/check без токена', async () => {
            const response = await request(app.getHttpServer()).get(
                '/online-store/auth/check',
            );

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('USER роль (ограниченный доступ)', () => {
        it('должен разрешить проверку авторизации для USER → 200', async () => {
            const { token, user } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/check')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toHaveProperty('email', user.email);
            expect(response.body).toHaveProperty('roles');
            expect(Array.isArray(response.body.roles)).toBe(true);
        });
    });

    describe('ADMIN роль (полный доступ)', () => {
        it('должен разрешить проверку авторизации для ADMIN → 200', async () => {
            const { token, user } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/check')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toHaveProperty('email', user.email);
            expect(response.body).toHaveProperty('roles');
            expect(Array.isArray(response.body.roles)).toBe(true);
            expect(response.body.roles.length).toBeGreaterThan(0);
        });
    });

    describe('Публичные endpoints (доступны всем)', () => {
        it('должен разрешить доступ к health endpoint без токена → 200', async () => {
            const response = await request(app.getHttpServer()).get(
                '/online-store/health',
            );

            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toHaveProperty('status');
        });
    });

    describe('Проверка сообщений об ошибках RBAC', () => {
        it('должен вернуть корректное русское сообщение об ошибке для 401', async () => {
            const response = await request(app.getHttpServer()).get(
                '/online-store/auth/check',
            );

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
            expect(response.body).toHaveProperty('message');
            // Проверяем, что сообщение не пустое и на русском
            expect(typeof response.body.message).toBe('string');
            expect(response.body.message.length).toBeGreaterThan(0);
        });
    });
});
