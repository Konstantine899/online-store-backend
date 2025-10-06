import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp } from '../setup/app';
import { getConfig } from '@app/infrastructure/config';

describe('Security Headers (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await setupTestApp();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should include security headers on responses', async () => {
        const res = await request(app.getHttpServer()).get('/online-store/health');

        // Базовые заголовки (проверяем наличие)
        expect(res.headers['x-content-type-options']).toBeDefined();
        expect(res.headers['cross-origin-resource-policy']).toBeDefined();

        // CSP (if enabled)
        const cfg = getConfig();
        if (cfg.SECURITY_CSP_ENABLED) {
            expect(res.headers['content-security-policy']).toBeDefined();
        }
    });

    it('should not include ACAO for disallowed Origin when CORS is enabled', async () => {
        const cfg = getConfig();
        if (!cfg.SECURITY_CORS_ENABLED) {
            return; // skip when CORS disabled
        }

        const res = await request(app.getHttpServer())
            .get('/online-store/health')
            .set('Origin', 'http://invalid.example')
            .unset('Connection');

        // Для запрещённого Origin ответ остаётся 200, но без заголовка ACAO
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
});


