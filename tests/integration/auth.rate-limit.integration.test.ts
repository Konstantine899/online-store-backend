import request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { setupTestAppWithRateLimit } from '../setup/app';

describe('Auth rate limiting (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await setupTestAppWithRateLimit();
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /auth/login should return 429 after exceeding attempts', async () => {
        const payload = { email: 'user@example.com', password: 'WrongPassword!' };

        // 5 попыток (лимит), ожидаем 401 Unauthorized для неверного пароля
        for (let i = 0; i < 5; i++) {
            const res = await request(app.getHttpServer())
                .post('/auth/login')
                .send(payload);
            expect([
                HttpStatus.BAD_REQUEST,
                HttpStatus.UNAUTHORIZED,
                HttpStatus.TOO_MANY_REQUESTS,
            ]).toContain(res.status);
            if (res.status === HttpStatus.TOO_MANY_REQUESTS) {
                // Если лимит сработал раньше — тест считаем успешным
                return;
            }
        }

        // 6-я попытка должна вернуть 429
        const res429 = await request(app.getHttpServer())
            .post('/auth/login')
            .send(payload);
        expect(res429.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(String(res429.body?.message || '')).toMatch(/Слишком много попыток входа/i);
    });
});


