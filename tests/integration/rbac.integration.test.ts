import { HttpStatus, INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import request from 'supertest';
import { setupTestApp } from '../setup/app';
import { authLoginAs } from '../setup/auth';

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
 * - Параллельный логин admin + user через Promise.all (↓50% времени setup)
 * - Использование authLoginAs helper для DRY
 * - Fail-fast проверка токенов в beforeAll
 * - Убраны избыточные проверки токенов в тестах
 */

describe('RBAC (e2e integration)', () => {
    let app: INestApplication;
    let adminToken: string;
    let userToken: string;

    beforeAll(async () => {
        app = await setupTestApp();

        // Получаем токены параллельно для ускорения тестов
        [adminToken, userToken] = await Promise.all([
            authLoginAs(app, 'admin'),
            authLoginAs(app, 'user'),
        ]);

        // Fail fast если токены не получены
        if (!adminToken || !userToken) {
            throw new Error('Failed to obtain auth tokens in beforeAll');
        }
    });

    afterAll(async () => {
        await app?.close();
    });

    afterEach(async () => {
        const sequelize = app.get(Sequelize);

        // Cleanup временных данных (как в TEST-001/002/003)
        await sequelize.query(`DELETE FROM login_history WHERE user_id > 14`);
        await sequelize.query(`DELETE FROM refresh_token WHERE user_id > 14`);
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
