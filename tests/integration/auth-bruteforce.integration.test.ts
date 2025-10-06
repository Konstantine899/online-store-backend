import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestAppWithRateLimit } from '../setup/app';
import { BruteforceGuard } from '@app/infrastructure/common/guards/bruteforce.guard';

describe('BruteforceGuard profiles (integration)', () => {
    let app: INestApplication;

    const LOGIN_BODY = { email: 'nope@example.com', password: 'wrong' } as const;
    const REFRESH_BODY = { refreshToken: 'invalid-token' } as const;
    const REG_WEAK = (email: string) => ({ email, password: 'weak', firstName: 'Test', lastName: 'User' } as const);

    const expectNot429 = (status: number, ctx: string): void => {
        if (status === 429) throw new Error(`Unexpected 429 on ${ctx}`);
    };

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
        // Первая попытка (должна пройти до хендлера и дать 400/401)
        const res1 = await request(app.getHttpServer()).post('/online-store/auth/login').send(LOGIN_BODY);
        expectNot429(res1.status, 'first login attempt');

        // Вторая попытка (ещё не 429)
        const res2 = await request(app.getHttpServer()).post('/online-store/auth/login').send(LOGIN_BODY);
        expectNot429(res2.status, 'second login attempt');

        // Третья попытка должна быть ограничена
        const res3 = await request(app.getHttpServer()).post('/online-store/auth/login').send(LOGIN_BODY);

        expect(res3.status).toBe(429);
    });

    it('should return 429 after exceeding refresh attempts', async () => {
        // Первая попытка (должна пройти до хендлера)
        const res1 = await request(app.getHttpServer()).post('/online-store/auth/refresh').send(REFRESH_BODY);
        expectNot429(res1.status, 'first refresh attempt');

        // Вторая попытка (ещё не 429)
        const res2 = await request(app.getHttpServer()).post('/online-store/auth/refresh').send(REFRESH_BODY);
        expectNot429(res2.status, 'second refresh attempt');

        // Третья попытка должна быть ограничена
        const res3 = await request(app.getHttpServer()).post('/online-store/auth/refresh').send(REFRESH_BODY);

        expect(res3.status).toBe(429);
    });

    it('should return 429 after exceeding registration attempts', async () => {
        // Первая попытка (должна пройти до хендлера)
        const res1 = await request(app.getHttpServer()).post('/online-store/auth/registration').send(REG_WEAK('test@example.com'));
        expectNot429(res1.status, 'first registration attempt');

        // Вторая попытка (ещё не 429)
        const res2 = await request(app.getHttpServer()).post('/online-store/auth/registration').send(REG_WEAK('test2@example.com'));
        expectNot429(res2.status, 'second registration attempt');

        // Третья попытка должна быть ограничена
        const res3 = await request(app.getHttpServer()).post('/online-store/auth/registration').send(REG_WEAK('test3@example.com'));

        expect(res3.status).toBe(429);
    });
});


