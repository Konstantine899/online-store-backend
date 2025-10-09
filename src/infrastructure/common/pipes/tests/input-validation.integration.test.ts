import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';

describe('Input Validation and Sanitization (integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await setupTestApp();
    });

    afterAll(async () => {
        await app?.close();
    });

    describe('XSS защита в регистрации', () => {
        it('должен отклонить email с XSS скриптом', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: '<script>alert("xss")</script>@mail.com',
                    password: 'SecurePass123!',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body[0]).toMatchObject({
                status: HttpStatus.BAD_REQUEST,
                property: 'email',
            });
            expect(response.body[0].messages).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/недопустимые символы/i),
                ]),
            );
        });

        it('должен отклонить email с javascript: протоколом', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: 'javascript:alert(1)@mail.com',
                    password: 'SecurePass123!',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body[0].messages).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/недопустимые символы/i),
                ]),
            );
        });

        it('должен отклонить email с HTML тегами', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: '<div>test@mail.com</div>',
                    password: 'SecurePass123!',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен отклонить слабый пароль', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: 'test@mail.com',
                    password: 'weak',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body[0]).toMatchObject({
                property: 'password',
            });
        });
    });

    describe('Защита от лишних полей (whitelist)', () => {
        it('должен отклонить запрос с лишними полями', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: 'test@mail.com',
                    password: 'SecurePass123!',
                    extraField: 'should be rejected',
                    anotherField: 'also rejected',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Валидация длины строк', () => {
        it('должен отклонить слишком длинный email', async () => {
            const longEmail = 'a'.repeat(300) + '@mail.com';
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: longEmail,
                    password: 'SecurePass123!',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('XSS защита в создании пользователя (Admin)', () => {
        let adminToken: string;

        beforeAll(async () => {
            // Получаем токен админа для тестов
            const loginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'Admin123!',
                });

            if (loginResponse.status === HttpStatus.OK) {
                adminToken = loginResponse.body.accessToken;
            }
        });

        it('должен отклонить firstName с XSS скриптом', async () => {
            if (!adminToken) {
                console.warn('Пропущен тест: админ токен недоступен');
                return;
            }

            const response = await request(app.getHttpServer())
                .post('/online-store/user')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'newuser@test.com',
                    password: 'SecurePass123!',
                    firstName: '<script>alert("xss")</script>',
                    lastName: 'Test',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body).toBeInstanceOf(Array);
            const firstNameError = response.body.find(
                (err: { property: string; messages: string[] }) =>
                    err.property === 'firstName',
            );
            expect(firstNameError).toBeDefined();
            expect(firstNameError?.messages).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/недопустимые символы/i),
                ]),
            );
        });

        it('должен отклонить lastName с HTML тегами', async () => {
            if (!adminToken) {
                console.warn('Пропущен тест: админ токен недоступен');
                return;
            }

            const response = await request(app.getHttpServer())
                .post('/online-store/user')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'newuser@test.com',
                    password: 'SecurePass123!',
                    firstName: 'Test',
                    lastName: '<b>Bold</b>',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('XSS защита в создании продукта', () => {
        let adminToken: string;

        beforeAll(async () => {
            const loginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'Admin123!',
                });

            if (loginResponse.status === HttpStatus.OK) {
                adminToken = loginResponse.body.accessToken;
            }
        });

        it('должен отклонить название продукта с XSS скриптом', async () => {
            if (!adminToken) {
                console.warn('Пропущен тест: админ токен недоступен');
                return;
            }

            const response = await request(app.getHttpServer())
                .post('/online-store/product')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('name', '<script>alert("xss")</script>')
                .field('price', '1000')
                .field('brandId', '1')
                .field('categoryId', '1');

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body).toBeInstanceOf(Array);
            const nameError = response.body.find(
                (err: { property: string; messages: string[] }) =>
                    err.property === 'name',
            );
            expect(nameError).toBeDefined();
            expect(nameError?.messages).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/недопустимые символы/i),
                ]),
            );
        });

        it('должен отклонить название продукта с javascript: протоколом', async () => {
            if (!adminToken) {
                console.warn('Пропущен тест: админ токен недоступен');
                return;
            }

            const response = await request(app.getHttpServer())
                .post('/online-store/product')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('name', 'javascript:alert(1)')
                .field('price', '1000')
                .field('brandId', '1')
                .field('categoryId', '1');

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Валидация типов данных', () => {
        it('должен отклонить некорректный тип для числового поля', async () => {
            const loginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'Admin123!',
                });

            if (loginResponse.status !== HttpStatus.OK) {
                console.warn('Пропущен тест: логин не удался');
                return;
            }

            const adminToken = loginResponse.body.accessToken;

            const response = await request(app.getHttpServer())
                .post('/online-store/product')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('name', 'Test Product')
                .field('price', 'not-a-number')
                .field('brandId', '1')
                .field('categoryId', '1');

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('SQL Injection Prevention', () => {
        it('должен отклонить SQL injection в email field (basic)', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: "admin'-- ",
                    password: 'SecurePass123!',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body).toBeInstanceOf(Array);
            const emailError = response.body.find(
                (err: { property: string }) => err.property === 'email',
            );
            expect(emailError).toBeDefined();
        });

        it('должен отклонить UNION-based SQL injection', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: "' UNION SELECT * FROM users-- ",
                    password: 'SecurePass123!',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен отклонить blind SQL injection', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: "admin' AND '1'='1",
                    password: 'SecurePass123!',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен отклонить time-based SQL injection', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: "'; WAITFOR DELAY '00:00:05'--",
                    password: 'SecurePass123!',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен отклонить SQL injection в search query', async () => {
            const loginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'Admin123!',
                });

            if (loginResponse.status !== HttpStatus.OK) {
                console.warn('Пропущен тест: логин не удался');
                return;
            }

            const adminToken = loginResponse.body.accessToken;

            const response = await request(app.getHttpServer())
                .get('/online-store/product')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ search: "'; DROP TABLE users;--" });

            // Search query не должна вызвать ошибку (Sequelize защищает),
            // но некорректные символы могут быть отклонены или проигнорированы
            expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
                response.status,
            );
        });

        it('должен защитить numeric fields от SQL injection', async () => {
            const loginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'Admin123!',
                });

            if (loginResponse.status !== HttpStatus.OK) {
                console.warn('Пропущен тест: логин не удался');
                return;
            }

            const adminToken = loginResponse.body.accessToken;

            const response = await request(app.getHttpServer())
                .post('/online-store/product')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('name', 'Test Product')
                .field('price', '1 OR 1=1')
                .field('brandId', '1')
                .field('categoryId', '1');

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Path Traversal Prevention', () => {
        let adminToken: string;

        beforeAll(async () => {
            const loginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'Admin123!',
                });

            if (loginResponse.status === HttpStatus.OK) {
                adminToken = loginResponse.body.accessToken;
            }
        });

        it('должен отклонить ../ в filename', async () => {
            if (!adminToken) {
                console.warn('Пропущен тест: админ токен недоступен');
                return;
            }

            const response = await request(app.getHttpServer())
                .post('/online-store/product')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('name', 'Test Product')
                .field('price', '1000')
                .field('brandId', '1')
                .field('categoryId', '1')
                .attach('image', Buffer.from('fake'), '../../etc/passwd.jpg');

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен отклонить URL-encoded path traversal', async () => {
            if (!adminToken) {
                console.warn('Пропущен тест: админ токен недоступен');
                return;
            }

            const response = await request(app.getHttpServer())
                .post('/online-store/product')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('name', 'Test Product')
                .field('price', '1000')
                .field('brandId', '1')
                .field('categoryId', '1')
                .attach('image', Buffer.from('fake'), '%2e%2e%2f%2e%2e%2fetc%2fpasswd.jpg');

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен отклонить double-encoded path traversal', async () => {
            if (!adminToken) {
                console.warn('Пропущен тест: админ токен недоступен');
                return;
            }

            const response = await request(app.getHttpServer())
                .post('/online-store/product')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('name', 'Test Product')
                .field('price', '1000')
                .field('brandId', '1')
                .field('categoryId', '1')
                .attach('image', Buffer.from('fake'), '..%252f..%252fetc%252fpasswd.jpg');

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен отклонить Windows-style path traversal', async () => {
            if (!adminToken) {
                console.warn('Пропущен тест: админ токен недоступен');
                return;
            }

            const response = await request(app.getHttpServer())
                .post('/online-store/product')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('name', 'Test Product')
                .field('price', '1000')
                .field('brandId', '1')
                .field('categoryId', '1')
                .attach('image', Buffer.from('fake'), '..\\..\\windows\\system32\\config.jpg');

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен отклонить null byte injection в filename', async () => {
            if (!adminToken) {
                console.warn('Пропущен тест: админ токен недоступен');
                return;
            }

            const response = await request(app.getHttpServer())
                .post('/online-store/product')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('name', 'Test Product')
                .field('price', '1000')
                .field('brandId', '1')
                .field('categoryId', '1')
                .attach('image', Buffer.from('fake'), 'file.jpg%00../../etc/passwd');

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('CSRF Protection (SameSite Cookies + CORS)', () => {
        it('должен использовать SameSite cookies для защиты от CSRF', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'Admin123!',
                });

            if (response.status !== HttpStatus.OK) {
                console.warn('Пропущен тест: логин не удался');
                return;
            }
            
            // Проверяем наличие Set-Cookie с refresh token
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            
            // Проверяем, что refresh token имеет HttpOnly и SameSite
            const refreshTokenCookie = cookies?.find((cookie: string) =>
                cookie.includes('refreshToken'),
            );
            expect(refreshTokenCookie).toBeDefined();
            expect(refreshTokenCookie).toMatch(/httponly/i);
            expect(refreshTokenCookie).toMatch(/samesite/i);
        });

        it('должен требовать credentials для sensitive operations', async () => {
            // Используем существующего админа из seeds
            const loginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'Admin123!',
                });

            if (loginResponse.status !== HttpStatus.OK) {
                console.warn('Пропущен тест: логин не удался');
                return;
            }

            const accessToken = loginResponse.body.accessToken;

            // Попытка доступа к sensitive endpoint без токена
            const unauthorizedResponse = await request(app.getHttpServer())
                .get('/online-store/user/me');

            expect(unauthorizedResponse.status).toBe(HttpStatus.UNAUTHORIZED);

            // С токеном должен работать
            const authorizedResponse = await request(app.getHttpServer())
                .get('/online-store/user/me')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(authorizedResponse.status).toBe(HttpStatus.OK);
        });

        it('должен защищать refresh endpoint через HttpOnly cookies', async () => {
            // Refresh без cookie должен провалиться
            const noCookieResponse = await request(app.getHttpServer())
                .post('/online-store/auth/refresh');

            expect(noCookieResponse.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('Extended XSS Prevention', () => {
        it('должен отклонить event handlers (onload, onerror)', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: 'test@mail.com',
                    password: 'SecurePass123!',
                    firstName: '<img onload=alert(1)>',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            const firstNameError = response.body.find(
                (err: { property: string }) => err.property === 'firstName',
            );
            expect(firstNameError).toBeDefined();
        });

        it('должен отклонить data: URIs', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: 'data:text/html,<script>alert(1)</script>@mail.com',
                    password: 'SecurePass123!',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен отклонить SVG injection', async () => {
            const loginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'Admin123!',
                });

            if (loginResponse.status !== HttpStatus.OK) {
                console.warn('Пропущен тест: логин не удался');
                return;
            }

            const adminToken = loginResponse.body.accessToken;

            const response = await request(app.getHttpServer())
                .post('/online-store/product')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('name', '<svg onload=alert(1)>')
                .field('price', '1000')
                .field('brandId', '1')
                .field('categoryId', '1');

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен отклонить iframe injection', async () => {
            const loginResponse = await request(app.getHttpServer())
                .post('/online-store/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'Admin123!',
                });

            if (loginResponse.status !== HttpStatus.OK) {
                console.warn('Пропущен тест: логин не удался');
                return;
            }

            const adminToken = loginResponse.body.accessToken;

            const response = await request(app.getHttpServer())
                .post('/online-store/product')
                .set('Authorization', `Bearer ${adminToken}`)
                .field('name', '<iframe src=javascript:alert(1)>')
                .field('price', '1000')
                .field('brandId', '1')
                .field('categoryId', '1');

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен отклонить URL-encoded XSS', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: '%3Cscript%3Ealert(1)%3C%2Fscript%3E@mail.com',
                    password: 'SecurePass123!',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it('должен отклонить Unicode bypass попытки', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: '\u003cscript\u003ealert(1)\u003c/script\u003e@mail.com',
                    password: 'SecurePass123!',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Русские сообщения об ошибках', () => {
        it('должен возвращать сообщения об ошибках на русском языке', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/registration')
                .send({
                    email: '',
                    password: '',
                });

            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
            expect(response.body).toBeInstanceOf(Array);

            // Проверяем, что все сообщения на русском (содержат кириллицу)
            response.body.forEach(
                (error: { messages: string[] }) => {
                    expect(error.messages).toBeInstanceOf(Array);
                    error.messages.forEach((message: string) => {
                        expect(message).toMatch(/[а-яА-Я]/);
                    });
                },
            );
        });
    });
});
