import { validateEnv } from './validation';

describe('validateEnv', () => {
    it('should validate minimal valid env', () => {
        const env = validateEnv({
            NODE_ENV: 'development',
            PORT: '5000',
            ALLOWED_ORIGINS: 'http://localhost:3000',
            COOKIE_PARSER_SECRET_KEY: 'secret',
            JWT_ACCESS_SECRET: 'a',
            JWT_REFRESH_SECRET: 'b',
            JWT_ACCESS_TTL: '900s',
            JWT_REFRESH_TTL: '30d',
            SQL_LOGGING: 'false',
        } as unknown as NodeJS.ProcessEnv);
        expect(env.PORT).toBe(5000);
        expect(env.ALLOWED_ORIGINS).toEqual(['http://localhost:3000']);
        expect(env.SQL_LOGGING).toBe(false);
    });

    it('should throw on missing required keys', () => {
        expect(() => validateEnv({} as NodeJS.ProcessEnv)).toThrow();
    });

    it('should throw on invalid NODE_ENV', () => {
        expect(() =>
            validateEnv({
                NODE_ENV: 'invalid',
                PORT: '5000',
                ALLOWED_ORIGINS: '',
                COOKIE_PARSER_SECRET_KEY: 's',
                JWT_ACCESS_SECRET: 'a',
                JWT_REFRESH_SECRET: 'b',
                JWT_ACCESS_TTL: '900s',
                JWT_REFRESH_TTL: '30d',
                SQL_LOGGING: 'false',
            } as unknown as NodeJS.ProcessEnv),
        ).toThrow('NODE_ENV должен быть одним из');
    });
});
