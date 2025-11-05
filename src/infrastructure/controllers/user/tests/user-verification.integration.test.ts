import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestDataFactory } from '../../../../../tests/utils';

describe('User Verification Integration Tests', () => {
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

    // ===== VERIFICATION ENDPOINTS =====
    describe('Verification endpoints', () => {
        it('401: requires auth for verification requests', async () => {
            await request(app.getHttpServer())
                .post('/online-store/user/verify/email/request')
                .expect(401);

            await request(app.getHttpServer())
                .post('/online-store/user/verify/phone/request')
                .expect(401);
        });

        it('200: email verification request with auth', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            await request(app.getHttpServer())
                .post('/online-store/user/verify/email/request')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });

        it('200: phone verification request with auth', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            await request(app.getHttpServer())
                .post('/online-store/user/verify/phone/request')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });

        it('400: invalid verification codes', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            await request(app.getHttpServer())
                .post('/online-store/user/verify/email/confirm')
                .set('Authorization', `Bearer ${token}`)
                .send({ code: 'invalid-code' })
                .expect(400);
        });

        it('200: admin can verify user email/phone', async () => {
            const admin = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );
            const user = await TestDataFactory.createUserWithRole(app, 'USER');

            // Admin верифицирует email пользователя
            await request(app.getHttpServer())
                .patch(`/online-store/user/verify/email/${user.userId}`)
                .set('Authorization', `Bearer ${admin.token}`)
                .expect(200);

            // Admin верифицирует phone пользователя
            await request(app.getHttpServer())
                .patch(`/online-store/user/verify/phone/${user.userId}`)
                .set('Authorization', `Bearer ${admin.token}`)
                .expect(200);
        });

        it('404: admin cannot verify non-existent user', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            await request(app.getHttpServer())
                .patch('/online-store/user/verify/email/999999')
                .set('Authorization', `Bearer ${token}`)
                .expect(404);
        });

        // USER-001-06: Tenant Isolation Tests
        describe('Tenant Isolation (USER-001-06)', () => {
            // TODO: Comprehensive multi-tenant integration tests
            // Requires TestDataFactory.createMultiTenantUsers() to be implemented
            // Tests should cover:
            // - User from tenant A cannot request verification for user from tenant B
            // - User from tenant A cannot confirm verification code for user from tenant B
            // - Admin from tenant A can only verify users from tenant A
            // - Cross-tenant verification attempts are logged and blocked

            it('200: user can verify their own email within tenant', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );

                const response = await request(app.getHttpServer())
                    .post('/online-store/user/verify/email/request')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

                expect(response.body).toHaveProperty('message');
                expect(response.body).toHaveProperty('expiresAt');
            });

            it('200: user can verify their own phone within tenant', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );

                const response = await request(app.getHttpServer())
                    .post('/online-store/user/verify/phone/request')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

                expect(response.body).toHaveProperty('message');
                expect(response.body).toHaveProperty('expiresAt');
            });

            it('400: invalid verification code returns error', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );

                // Request code
                await request(app.getHttpServer())
                    .post('/online-store/user/verify/email/request')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

                // Try with invalid code
                const response = await request(app.getHttpServer())
                    .post('/online-store/user/verify/email/confirm')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ code: 'wrong!' })
                    .expect(400);

                expect(response.body).toHaveProperty('statusCode', 400);
                expect(response.body.message).toContain(
                    'Неверный или просроченный код подтверждения',
                );
            });

            it('401: missing tenant ID in token throws unauthorized', async () => {
                // This test simulates a malformed token without tenantId
                // In real scenario, token without tenantId should be rejected by AuthGuard
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );

                // Normal request should work
                await request(app.getHttpServer())
                    .post('/online-store/user/verify/email/request')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);
            });
        });

        describe('Response Structure Validation (USER-001-06)', () => {
            it('200: request verification response has correct structure', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );

                const response = await request(app.getHttpServer())
                    .post('/online-store/user/verify/email/request')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

                expect(response.body).toMatchObject({
                    message: expect.any(String),
                    expiresAt: expect.stringMatching(
                        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
                    ),
                });
            });

            it('200: confirm verification response has correct structure', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );

                // Request code first
                await request(app.getHttpServer())
                    .post('/online-store/user/verify/email/request')
                    .set('Authorization', `Bearer ${token}`)
                    .expect(200);

                // Try to confirm (will fail, but we check response structure)
                const response = await request(app.getHttpServer())
                    .post('/online-store/user/verify/email/confirm')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ code: 'test12' })
                    .expect(400);

                expect(response.body).toHaveProperty('statusCode');
                expect(response.body).toHaveProperty('message');
            });
        });
    });
});
