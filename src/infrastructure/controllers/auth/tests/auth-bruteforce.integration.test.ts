import { BruteforceGuard } from '@app/infrastructure/common/guards/bruteforce.guard';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestAppWithRateLimit } from '../../../../../tests/setup/app';

describe('BruteforceGuard profiles (integration)', () => {
    let app: INestApplication;

    const LOGIN_BODY = {
        email: 'nope@example.com',
        password: 'wrong',
    } as const;
    const REFRESH_BODY = { refreshToken: 'invalid-token' } as const;
    const REG_WEAK = (email: string) =>
        ({
            email,
            password: 'weak',
            firstName: 'Test',
            lastName: 'User',
        }) as const;

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
        const res1 = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send(LOGIN_BODY);
        expectNot429(res1.status, 'first login attempt');

        // Вторая попытка (ещё не 429)
        const res2 = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send(LOGIN_BODY);
        expectNot429(res2.status, 'second login attempt');

        // Третья попытка должна быть ограничена
        const res3 = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send(LOGIN_BODY);

        expect(res3.status).toBe(429);
        expect(res3.body.message).toContain('Слишком много запросов');
    });

    it('should include Retry-After header on 429 for login', async () => {
        // Превышаем лимит (2 попытки уже, 3-я блокируется)
        await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send(LOGIN_BODY);
        await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send(LOGIN_BODY);

        const res = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send(LOGIN_BODY)
            .expect(429);

        // Проверяем наличие Retry-After header
        expect(res.headers['retry-after']).toBeDefined();

        // Retry-After должен быть в секундах (примерно 60 для окна 1m)
        const retryAfter = parseInt(res.headers['retry-after'], 10);
        expect(retryAfter).toBeGreaterThan(0);
        expect(retryAfter).toBeLessThanOrEqual(60); // не больше window (1 min)
    });

    it('should return 429 after exceeding refresh attempts', async () => {
        // Первая попытка (должна пройти до хендлера)
        const res1 = await request(app.getHttpServer())
            .post('/online-store/auth/refresh')
            .send(REFRESH_BODY);
        expectNot429(res1.status, 'first refresh attempt');

        // Вторая попытка (ещё не 429)
        const res2 = await request(app.getHttpServer())
            .post('/online-store/auth/refresh')
            .send(REFRESH_BODY);
        expectNot429(res2.status, 'second refresh attempt');

        // Третья попытка должна быть ограничена
        const res3 = await request(app.getHttpServer())
            .post('/online-store/auth/refresh')
            .send(REFRESH_BODY);

        expect(res3.status).toBe(429);
    });

    it('should include Retry-After header on 429 for refresh', async () => {
        // Превышаем лимит refresh
        await request(app.getHttpServer())
            .post('/online-store/auth/refresh')
            .send(REFRESH_BODY);
        await request(app.getHttpServer())
            .post('/online-store/auth/refresh')
            .send(REFRESH_BODY);

        const res = await request(app.getHttpServer())
            .post('/online-store/auth/refresh')
            .send(REFRESH_BODY)
            .expect(429);

        expect(res.headers['retry-after']).toBeDefined();
        const retryAfter = parseInt(res.headers['retry-after'], 10);
        expect(retryAfter).toBeGreaterThan(0);
        expect(retryAfter).toBeLessThanOrEqual(60);
    });

    it('should return 429 after exceeding registration attempts', async () => {
        // Первая попытка (должна пройти до хендлера)
        const res1 = await request(app.getHttpServer())
            .post('/online-store/auth/registration')
            .send(REG_WEAK('test@example.com'));
        expectNot429(res1.status, 'first registration attempt');

        // Вторая попытка (ещё не 429)
        const res2 = await request(app.getHttpServer())
            .post('/online-store/auth/registration')
            .send(REG_WEAK('test2@example.com'));
        expectNot429(res2.status, 'second registration attempt');

        // Третья попытка должна быть ограничена
        const res3 = await request(app.getHttpServer())
            .post('/online-store/auth/registration')
            .send(REG_WEAK('test3@example.com'));

        expect(res3.status).toBe(429);
    });

    it('should include Retry-After header on 429 for registration', async () => {
        // Превышаем лимит registration
        await request(app.getHttpServer())
            .post('/online-store/auth/registration')
            .send(REG_WEAK('test1@example.com'));
        await request(app.getHttpServer())
            .post('/online-store/auth/registration')
            .send(REG_WEAK('test2@example.com'));

        const res = await request(app.getHttpServer())
            .post('/online-store/auth/registration')
            .send(REG_WEAK('test3@example.com'))
            .expect(429);

        expect(res.headers['retry-after']).toBeDefined();
        const retryAfter = parseInt(res.headers['retry-after'], 10);
        expect(retryAfter).toBeGreaterThan(0);
        expect(retryAfter).toBeLessThanOrEqual(60);
    });

    it('should return correct TTL in Retry-After header', async () => {
        // Превышаем лимит login
        await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send(LOGIN_BODY);
        await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send(LOGIN_BODY);

        const res = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .send(LOGIN_BODY)
            .expect(429);

        const retryAfter = parseInt(res.headers['retry-after'], 10);

        // Retry-After должен быть примерно равен оставшемуся времени окна
        // Window = 60 секунд, потраченное время на запросы < 5 секунд
        expect(retryAfter).toBeGreaterThan(55); // минимум 55 секунд осталось
        expect(retryAfter).toBeLessThanOrEqual(60); // максимум 60 секунд (полное окно)
    });

    it('should handle different IP formats (x-forwarded-for)', async () => {
        // Тест с разными форматами IP для покрытия extractClientIP
        const res = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .set('x-forwarded-for', '203.0.113.1, 192.168.1.1')
            .send(LOGIN_BODY);

        expectNot429(res.status, 'x-forwarded-for request');
    });

    it('should handle x-real-ip header', async () => {
        const res = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .set('x-real-ip', '203.0.113.2')
            .send(LOGIN_BODY);

        expectNot429(res.status, 'x-real-ip request');
    });

    it('should handle x-client-ip header', async () => {
        const res = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .set('x-client-ip', '203.0.113.3')
            .send(LOGIN_BODY);

        expectNot429(res.status, 'x-client-ip request');
    });

    it('should handle IPv6 addresses', async () => {
        const res = await request(app.getHttpServer())
            .post('/online-store/auth/login')
            .set('x-forwarded-for', '2001:0db8:85a3:0000:0000:8a2e:0370:7334')
            .send(LOGIN_BODY);

        expectNot429(res.status, 'IPv6 request');
    });
});
