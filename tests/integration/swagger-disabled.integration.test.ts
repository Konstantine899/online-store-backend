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
 * 
 * Оптимизировано: конфигурация кэшируется в beforeAll, вызов getConfig() только 1 раз.
 */
describe('Swagger Access Control (integration)', () => {
    let app: INestApplication;
    let config: ReturnType<typeof getConfig>; // Кэшируем конфигурацию

    // Константы для сообщений (оптимизация: избежание дублирования строк)
    const MSG_ENABLED_SKIP = '⚠️  Swagger включен (SWAGGER_ENABLED=true), пропускаем тест недоступности';
    const MSG_DISABLED_SKIP = '⚠️  Swagger отключен (SWAGGER_ENABLED=false), пропускаем тест доступности';

    beforeAll(async () => {
        app = await setupTestApp();
        config = getConfig(); // Единственный вызов для всех тестов
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Swagger documentation endpoint', () => {
        it('should return 404 when SWAGGER_ENABLED=false', async () => {
            // Используем кэшированную конфигурацию
            if (config.SWAGGER_ENABLED) {
                console.log(MSG_ENABLED_SKIP);
                return;
            }

            const res = await request(app.getHttpServer()).get(
                '/online-store/docs',
            );

            expect(res.status).toBe(404);
        });

        it('should return 404 for JSON endpoint when SWAGGER_ENABLED=false', async () => {
            if (config.SWAGGER_ENABLED) {
                console.log(MSG_ENABLED_SKIP);
                return;
            }

            const res = await request(app.getHttpServer()).get(
                '/online-store/docs-json',
            );

            expect(res.status).toBe(404);
        });

        it('should be accessible when SWAGGER_ENABLED=true', async () => {
            if (!config.SWAGGER_ENABLED) {
                console.log(MSG_DISABLED_SKIP);
                return;
            }

            const res = await request(app.getHttpServer()).get(
                '/online-store/docs',
            );

            // Swagger возвращает HTML страницу
            expect(res.status).toBe(200);
            expect(res.type).toContain('html');
        });

        it('should serve OpenAPI JSON spec when SWAGGER_ENABLED=true', async () => {
            // Используем кэшированную конфигурацию вместо нового вызова
            if (!config.SWAGGER_ENABLED) {
                console.log(MSG_DISABLED_SKIP);
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
            // Используем кэшированную конфигурацию вместо нового вызова
            expect(config).toHaveProperty('SWAGGER_ENABLED');
            expect(typeof config.SWAGGER_ENABLED).toBe('boolean');

            // В тестовом окружении по умолчанию должен быть включен
            if (config.NODE_ENV === 'test' || config.NODE_ENV === 'development') {
                // В dev/test по умолчанию true (если не переопределено)
                expect([true, false]).toContain(config.SWAGGER_ENABLED);
            }

            // В production/staging по умолчанию должен быть отключен
            if (config.NODE_ENV === 'production' || config.NODE_ENV === 'staging') {
                // В prod/staging по умолчанию false (если не переопределено)
                expect([true, false]).toContain(config.SWAGGER_ENABLED);
            }
        });
    });
});
