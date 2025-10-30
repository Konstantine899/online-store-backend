import { validateEnv } from '@app/infrastructure/config/env/validation';

describe('Environment Validation - Secrets (unit)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Сохраняем оригинальное окружение
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        // Восстанавливаем оригинальное окружение
        process.env = originalEnv;
    });

    const getValidEnv = (
        overrides: Record<string, string | undefined> = {},
    ): Record<string, string | undefined> => ({
        NODE_ENV: 'development',
        PORT: '5000',
        ALLOWED_ORIGINS: 'http://localhost:3000',
        COOKIE_PARSER_SECRET_KEY: 'dev_secret',
        JWT_ACCESS_SECRET: 'dev_access',
        JWT_REFRESH_SECRET: 'dev_refresh',
        JWT_ACCESS_TTL: '15m',
        JWT_REFRESH_TTL: '30d',
        ...overrides,
    });

    describe('Production/Staging секреты - минимальная длина', () => {
        it('должен отклонить короткий COOKIE_PARSER_SECRET_KEY в production', () => {
            process.env = getValidEnv({
                NODE_ENV: 'production',
                COOKIE_PARSER_SECRET_KEY: 'short',
            });

            expect(() => validateEnv(process.env)).toThrow(
                /минимум 32 символов/,
            );
        });

        it('должен отклонить короткий JWT_ACCESS_SECRET в staging', () => {
            process.env = getValidEnv({
                NODE_ENV: 'staging',
                JWT_ACCESS_SECRET: 'short_secret',
            });

            expect(() => validateEnv(process.env)).toThrow(
                /минимум 32 символов/,
            );
        });

        it('должен принять секрет 32 символа в production', () => {
            const strongSecret = 'a'.repeat(32);
            process.env = getValidEnv({
                NODE_ENV: 'production',
                COOKIE_PARSER_SECRET_KEY: strongSecret,
                JWT_ACCESS_SECRET: strongSecret,
                JWT_REFRESH_SECRET: strongSecret,
            });

            expect(() => validateEnv(process.env)).not.toThrow();
        });

        it('должен принять секрет 64 символа в production', () => {
            const veryStrongSecret = 'a'.repeat(64);
            process.env = getValidEnv({
                NODE_ENV: 'production',
                COOKIE_PARSER_SECRET_KEY: veryStrongSecret,
                JWT_ACCESS_SECRET: veryStrongSecret,
                JWT_REFRESH_SECRET: veryStrongSecret,
            });

            expect(() => validateEnv(process.env)).not.toThrow();
        });
    });

    describe('Production/Staging секреты - слабые значения', () => {
        // Секреты должны быть >= 32 символов, но содержать слабые слова
        const weakSecrets = [
            'change-me-please-12345678901234567',
            'please_change_me_asap_123456789012',
            'replace-with-strong-secret-now12345',
            'secret123456789012345678901234567',
            'password1234567890123456789012345',
            'test1234567890123456789012345678',
        ];

        weakSecrets.forEach((weakSecret) => {
            it(`должен отклонить слабый секрет "${weakSecret.substring(0, 20)}..." в production`, () => {
                const strongSecret = 'a'.repeat(64); // Сильный секрет для других полей
                process.env = getValidEnv({
                    NODE_ENV: 'production',
                    COOKIE_PARSER_SECRET_KEY: strongSecret,
                    JWT_ACCESS_SECRET: weakSecret, // Слабый секрет для тестирования
                    JWT_REFRESH_SECRET: strongSecret,
                });

                expect(() => validateEnv(process.env)).toThrow(
                    /слабое значение/,
                );
            });
        });

        it('должен принять слабые секреты в development', () => {
            process.env = getValidEnv({
                NODE_ENV: 'development',
                JWT_ACCESS_SECRET: 'change-me',
                JWT_REFRESH_SECRET: 'test',
                COOKIE_PARSER_SECRET_KEY: 'secret',
            });

            expect(() => validateEnv(process.env)).not.toThrow();
        });

        it('должен принять слабые секреты в test', () => {
            process.env = getValidEnv({
                NODE_ENV: 'test',
                JWT_ACCESS_SECRET: 'test_secret',
                JWT_REFRESH_SECRET: 'password',
            });

            expect(() => validateEnv(process.env)).not.toThrow();
        });
    });

    describe('Ротация секретов', () => {
        it('должен принять опциональные параметры ротации', () => {
            process.env = getValidEnv({
                JWT_SECRET_ROTATION_DATE: '2026-12-31T00:00:00Z',
                JWT_SECRET_VERSION: 'v1',
            });

            const result = validateEnv(process.env);
            expect(result.JWT_SECRET_ROTATION_DATE).toBe(
                '2026-12-31T00:00:00Z',
            );
            expect(result.JWT_SECRET_VERSION).toBe('v1');
        });

        it('должен работать без параметров ротации', () => {
            process.env = getValidEnv();

            const result = validateEnv(process.env);
            expect(result.JWT_SECRET_ROTATION_DATE).toBeUndefined();
            expect(result.JWT_SECRET_VERSION).toBeUndefined();
        });
    });

    describe('Обязательные секреты', () => {
        it('должен требовать COOKIE_PARSER_SECRET_KEY', () => {
            process.env = getValidEnv({
                COOKIE_PARSER_SECRET_KEY: undefined,
            });

            expect(() => validateEnv(process.env)).toThrow(
                /COOKIE_PARSER_SECRET_KEY.*обязательна/,
            );
        });

        it('должен требовать JWT_ACCESS_SECRET', () => {
            process.env = getValidEnv({
                JWT_ACCESS_SECRET: undefined,
            });

            expect(() => validateEnv(process.env)).toThrow(
                /JWT_ACCESS_SECRET.*обязательна/,
            );
        });

        it('должен требовать JWT_REFRESH_SECRET', () => {
            process.env = getValidEnv({
                JWT_REFRESH_SECRET: undefined,
            });

            expect(() => validateEnv(process.env)).toThrow(
                /JWT_REFRESH_SECRET.*обязательна/,
            );
        });

        it('должен отклонить пустые секреты', () => {
            process.env = getValidEnv({
                JWT_ACCESS_SECRET: '   ',
            });

            expect(() => validateEnv(process.env)).toThrow(
                /не может быть пустой/,
            );
        });
    });
});
