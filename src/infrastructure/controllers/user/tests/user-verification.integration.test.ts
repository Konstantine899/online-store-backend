import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestCleanup, TestDataFactory } from '../../../../../tests/utils';

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
                .post('/online-store/user/verify/email')
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
                .patch(`/online-store/user/admin/verify/${user.userId}/email`)
                .set('Authorization', `Bearer ${admin.token}`)
                .expect(200);

            // Admin верифицирует phone пользователя
            await request(app.getHttpServer())
                .patch(`/online-store/user/admin/verify/${user.userId}/phone`)
                .set('Authorization', `Bearer ${admin.token}`)
                .expect(200);
        });

        it('404: admin cannot verify non-existent user', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'ADMIN',
            );

            await request(app.getHttpServer())
                .patch('/online-store/user/admin/verify/999999/email')
                .set('Authorization', `Bearer ${token}`)
                .expect(404);
        });
    });
});
