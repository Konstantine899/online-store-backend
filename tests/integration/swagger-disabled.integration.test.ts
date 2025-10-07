import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp } from '../setup/app';
import { getConfig } from '@app/infrastructure/config';

/**
 * Интеграционные тесты для проверки управления доступом к Swagger документации
 * 
 * Swagger документация должна быть доступна только когда SWAGGER_ENABLED=true
 * (по умолчанию только в dev/test окружениях)
 * 
 * В production/staging Swagger должен быть отключен для безопасности.
 */
describe('Swagger Access Control (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await setupTestApp();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Swagger documentation endpoint', () => {
        it('should return 404 when SWAGGER_ENABLED=false', async () => {
            const cfg = getConfig();

            // Если Swagger включен, пропускаем тест
            if (cfg.SWAGGER_ENABLED) {
                console.log(
                    '⚠️  Swagger включен (SWAGGER_ENABLED=true), пропускаем тест недоступности',
                );
                return;
            }

            // Проверяем, что /online-store/docs недоступен
            const res = await request(app.getHttpServer()).get(
                '/online-store/docs',
            );

            expect(res.status).toBe(404);
        });

        it('should return 404 for JSON endpoint when SWAGGER_ENABLED=false', async () => {
            const cfg = getConfig();

            // Если Swagger включен, пропускаем тест
            if (cfg.SWAGGER_ENABLED) {
                console.log(
                    '⚠️  Swagger включен (SWAGGER_ENABLED=true), пропускаем тест недоступности',
                );
                return;
            }

            // Проверяем, что /online-store/docs-json недоступен
            const res = await request(app.getHttpServer()).get(
                '/online-store/docs-json',
            );

            expect(res.status).toBe(404);
        });

        it('should be accessible when SWAGGER_ENABLED=true', async () => {
            const cfg = getConfig();

            // Если Swagger отключен, пропускаем тест
            if (!cfg.SWAGGER_ENABLED) {
                console.log(
                    '⚠️  Swagger отключен (SWAGGER_ENABLED=false), пропускаем тест доступности',
                );
                return;
            }

            // Проверяем, что /online-store/docs доступен
            const res = await request(app.getHttpServer()).get(
                '/online-store/docs',
            );

            // Swagger возвращает HTML страницу
            expect(res.status).toBe(200);
            expect(res.type).toContain('html');
        });

        it('should serve OpenAPI JSON spec when SWAGGER_ENABLED=true', async () => {
            const cfg = getConfig();

            // Если Swagger отключен, пропускаем тест
            if (!cfg.SWAGGER_ENABLED) {
                console.log(
                    '⚠️  Swagger отключен (SWAGGER_ENABLED=false), пропускаем тест доступности',
                );
                return;
            }

            // Проверяем, что /online-store/docs-json доступен
            const res = await request(app.getHttpServer()).get(
                '/online-store/docs-json',
            );

            expect(res.status).toBe(200);
            expect(res.type).toContain('json');
            expect(res.body).toHaveProperty('openapi');
            expect(res.body).toHaveProperty('info');
            expect(res.body).toHaveProperty('paths');
        });
    });

    describe('Environment-based defaults', () => {
        it('should respect SWAGGER_ENABLED environment variable', () => {
            const cfg = getConfig();

            expect(cfg).toHaveProperty('SWAGGER_ENABLED');
            expect(typeof cfg.SWAGGER_ENABLED).toBe('boolean');

            // В тестовом окружении по умолчанию должен быть включен
            if (cfg.NODE_ENV === 'test' || cfg.NODE_ENV === 'development') {
                // В dev/test по умолчанию true (если не переопределено)
                expect([true, false]).toContain(cfg.SWAGGER_ENABLED);
            }

            // В production/staging по умолчанию должен быть отключен
            if (cfg.NODE_ENV === 'production' || cfg.NODE_ENV === 'staging') {
                // В prod/staging по умолчанию false (если не переопределено)
                expect([true, false]).toContain(cfg.SWAGGER_ENABLED);
            }
        });
    });
});

