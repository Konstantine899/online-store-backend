import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp } from '../../../../../tests/setup/app';
import { authLoginAs } from '../../../../../tests/setup/auth';

describe('User Verification Integration Tests', () => {
    let app: INestApplication;
    let userToken: string;
    let adminToken: string;

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
        
        // Получаем токены для тестирования
        userToken = await authLoginAs(app, 'user');
        adminToken = await authLoginAs(app, 'admin');
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
            // Получаем свежий токен для этого теста
            const freshToken = await authLoginAs(app, 'user');
            
            await request(app.getHttpServer())
                .post('/online-store/user/verify/email/request')
                .set('Authorization', `Bearer ${freshToken}`)
                .expect(200);
        });

        it('200: phone verification request with auth', async () => {
            // Получаем свежий токен для этого теста
            const freshToken = await authLoginAs(app, 'user');
            
            await request(app.getHttpServer())
                .post('/online-store/user/verify/phone/request')
                .set('Authorization', `Bearer ${freshToken}`)
                .expect(200);
        });

        it('400: invalid verification codes', async () => {
            // Получаем свежий токен для этого теста
            const freshToken = await authLoginAs(app, 'user');
            
            await request(app.getHttpServer())
                .post('/online-store/user/verify/email/confirm')
                .set('Authorization', `Bearer ${freshToken}`)
                .send({ code: 'wrong' })
                .expect(400);

            await request(app.getHttpServer())
                .post('/online-store/user/verify/phone/confirm')
                .set('Authorization', `Bearer ${freshToken}`)
                .send({ code: 'wrong' })
                .expect(400);
        });

            it('200: admin can verify user email/phone', async () => {
                // Получаем свежий admin токен для этого теста
                const freshAdminToken = await authLoginAs(app, 'admin');
                
                await request(app.getHttpServer())
                    .patch('/online-store/user/verify/email/13')
                    .set('Authorization', `Bearer ${freshAdminToken}`)
                    .expect(200);

                await request(app.getHttpServer())
                    .patch('/online-store/user/verify/phone/13')
                    .set('Authorization', `Bearer ${freshAdminToken}`)
                    .expect(200);
            });

        it('404: admin cannot verify non-existent user', async () => {
            // Получаем свежий admin токен для этого теста
            const freshAdminToken = await authLoginAs(app, 'admin');
            
            await request(app.getHttpServer())
                .patch('/online-store/user/verify/email/99999')
                .set('Authorization', `Bearer ${freshAdminToken}`)
                .expect(404);
        });
    });
});
