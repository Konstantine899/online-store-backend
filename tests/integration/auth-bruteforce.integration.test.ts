import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestAppWithRateLimit } from '../setup/app';
import { BruteforceGuard } from '@app/infrastructure/common/guards/bruteforce.guard';

describe('BruteforceGuard profiles (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        // Включаем профиль BruteforceGuard, но отключаем глобальный лимитер
        process.env.NODE_ENV = 'test';
        process.env.RATE_LIMIT_ENABLED = 'true';
        process.env.RATE_LIMIT_LOGIN_ATTEMPTS = '2';
        process.env.RATE_LIMIT_LOGIN_WINDOW = '1m';
        process.env.RATE_LIMIT_REFRESH_ATTEMPTS = '2';
        process.env.RATE_LIMIT_REFRESH_WINDOW = '1m';
        process.env.RATE_LIMIT_REG_ATTEMPTS = '2';
        process.env.RATE_LIMIT_REG_WINDOW = '1m';
        
        // Устанавливаем переменные ДО создания приложения
        process.env.JWT_ACCESS_SECRET = 'test-access-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
        process.env.JWT_ACCESS_TTL = '15m';
        process.env.JWT_REFRESH_TTL = '30d';
        process.env.COOKIE_PARSER_SECRET_KEY = 'test-cookie-secret';

        app = await setupTestAppWithRateLimit();
        await app.init();
    });

    beforeEach(async () => {
        // Сброс счетчиков перед каждым тестом
        BruteforceGuard.resetCounters();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return 429 after exceeding login attempts', async () => {
        const server = app.getHttpServer();

        // Первая попытка (должна пройти до хендлера и дать 400/401)
        const res1 = await request(server)
            .post('/online-store/auth/login')
            .send({ email: 'nope@example.com', password: 'wrong' });
        
        if (res1.status === 429) {
            throw new Error('Unexpected 429 on first attempt');
        }

        // Вторая попытка (ещё не 429)
        await request(server)
            .post('/online-store/auth/login')
            .send({ email: 'nope@example.com', password: 'wrong' })
            .expect((res: request.Response) => {
                if (res.status === 429) {
                    throw new Error('Unexpected 429 on second attempt');
                }
            });

        // Третья попытка должна быть ограничена
        const res3 = await request(server)
            .post('/online-store/auth/login')
            .send({ email: 'nope@example.com', password: 'wrong' });

        expect(res3.status).toBe(429);
    });

    it('should return 429 after exceeding refresh attempts', async () => {
        const server = app.getHttpServer();

        // Первая попытка (должна пройти до хендлера)
        const res1 = await request(server)
            .post('/online-store/auth/refresh')
            .send({ refreshToken: 'invalid-token' });
        
        if (res1.status === 429) {
            throw new Error('Unexpected 429 on first refresh attempt');
        }

        // Вторая попытка (ещё не 429)
        await request(server)
            .post('/online-store/auth/refresh')
            .send({ refreshToken: 'invalid-token' })
            .expect((res: request.Response) => {
                if (res.status === 429) {
                    throw new Error('Unexpected 429 on second refresh attempt');
                }
            });

        // Третья попытка должна быть ограничена
        const res3 = await request(server)
            .post('/online-store/auth/refresh')
            .send({ refreshToken: 'invalid-token' });

        expect(res3.status).toBe(429);
    });

    it('should return 429 after exceeding registration attempts', async () => {
        const server = app.getHttpServer();

        // Первая попытка (должна пройти до хендлера)
        const res1 = await request(server)
            .post('/online-store/auth/registration')
            .send({ 
                email: 'test@example.com', 
                password: 'weak', 
                firstName: 'Test',
                lastName: 'User'
            });
        
        if (res1.status === 429) {
            throw new Error('Unexpected 429 on first registration attempt');
        }

        // Вторая попытка (ещё не 429)
        await request(server)
            .post('/online-store/auth/registration')
            .send({ 
                email: 'test2@example.com', 
                password: 'weak', 
                firstName: 'Test',
                lastName: 'User'
            })
            .expect((res: request.Response) => {
                if (res.status === 429) {
                    throw new Error('Unexpected 429 on second registration attempt');
                }
            });

        // Третья попытка должна быть ограничена
        const res3 = await request(server)
            .post('/online-store/auth/registration')
            .send({ 
                email: 'test3@example.com', 
                password: 'weak', 
                firstName: 'Test',
                lastName: 'User'
            });

        expect(res3.status).toBe(429);
    });
});


