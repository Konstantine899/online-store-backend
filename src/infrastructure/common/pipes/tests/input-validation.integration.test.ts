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
