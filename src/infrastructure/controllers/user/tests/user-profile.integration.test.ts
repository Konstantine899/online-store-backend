import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestDataFactory } from '../../../../../tests/utils';

describe('User Profile Integration Tests', () => {
    let app: INestApplication;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        // Минимальные переменные для тестового запуска (подхватываются Joi)
        process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
        process.env.COOKIE_PARSER_SECRET_KEY = 'test-secret-12345';
        process.env.JWT_PRIVATE_KEY = 'a'.repeat(64);
        process.env.JWT_ACCESS_SECRET = 'access-secret-123456';
        process.env.JWT_REFRESH_SECRET = 'refresh-secret-123456';
        process.env.JWT_ACCESS_EXPIRES = '15m';
        process.env.JWT_REFRESH_EXPIRES = '30d';

        app = await setupTestApp();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    // ===== PHONE ENDPOINTS =====
    describe('PATCH /user/profile/phone', () => {
        it('200: updates phone with valid number', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const uniquePhone = TestDataFactory.uniquePhone();

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phone: uniquePhone })
                .expect(200)
                .expect(({ body }) => {
                    expect(body?.data?.phone).toBe(uniquePhone);
                });
        });

        it('400: rejects invalid phone format', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phone: 'invalid-phone' })
                .expect(400);
        });

        it('401: requires auth', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .send({ phone: '+79991234567' })
                .expect(401);
        });

        it('200: accepts Russian format with +7', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const uniquePhone = TestDataFactory.uniquePhone();

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phone: uniquePhone })
                .expect(200)
                .expect(({ body }) => {
                    expect(body?.data?.phone).toBe(uniquePhone);
                });
        });

        it('200: accepts Russian format with 8', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            // Генерируем уникальный номер, начинающийся с 8
            // uniquePhone() возвращает +799XXXXXXXXX (12 цифр), берем только цифры и обрезаем до 11
            const uniquePhoneDigits = TestDataFactory.uniquePhone()
                .slice(1)
                .slice(0, 11); // убираем +, берем первые 11 цифр
            const uniquePhone = `8${uniquePhoneDigits.slice(1)}`; // заменяем первую цифру на 8

            // Проверяем, что номер валидный (11 цифр, начинается с 8)
            expect(uniquePhone).toMatch(/^8\d{10}$/); // 8 + 10 цифр = 11 цифр всего
            expect(uniquePhone).toHaveLength(11);

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phone: uniquePhone })
                .expect(200)
                .expect(({ body }) => {
                    // После нормализации номер будет сохранен как +7XXXXXXXXXX
                    expect(body?.data?.phone).toMatch(/^\+7\d{10}$/);
                });
        });

        it('200: accepts Russian format without prefix (7)', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            // Генерируем уникальный номер, начинающийся с 7 (без +)
            // uniquePhone() возвращает +799XXXXXXXXX (12 цифр), берем только цифры и обрезаем до 11
            const uniquePhone = TestDataFactory.uniquePhone()
                .slice(1)
                .slice(0, 11); // убираем +, берем первые 11 цифр

            // Проверяем, что номер валидный (11 цифр, начинается с 7)
            expect(uniquePhone).toMatch(/^7\d{10}$/); // 7 + 10 цифр = 11 цифр всего
            expect(uniquePhone).toHaveLength(11);

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phone: uniquePhone })
                .expect(200)
                .expect(({ body }) => {
                    // После нормализации номер будет сохранен как +7XXXXXXXXXX
                    expect(body?.data?.phone).toMatch(/^\+7\d{10}$/);
                });
        });

        it('200: accepts Russian format with formatting (+7 with spaces)', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const uniquePhone = TestDataFactory.uniquePhone();
            // Форматируем номер с пробелами и скобками
            const formattedPhone = `+7 (${uniquePhone.slice(2, 5)}) ${uniquePhone.slice(5, 8)}-${uniquePhone.slice(8, 10)}-${uniquePhone.slice(10)}`;

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phone: formattedPhone })
                .expect(200)
                .expect(({ body }) => {
                    // После нормализации номер будет сохранен как +7XXXXXXXXXX
                    expect(body?.data?.phone).toBe(uniquePhone);
                });
        });

        it('400: rejects invalid Russian format (10 digits)', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phone: '7999123456' })
                .expect(400);
        });

        it('400: rejects invalid Russian format (wrong prefix)', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ phone: '69991234567' })
                .expect(400);
        });

        it('409: rejects duplicate phone for another user', async () => {
            const user1 = await TestDataFactory.createUserWithRole(app, 'USER');
            const user2 = await TestDataFactory.createUserWithRole(app, 'USER');
            const uniquePhone = TestDataFactory.uniquePhone();

            // User 1 устанавливает уникальный телефон
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${user1.token}`)
                .send({ phone: uniquePhone })
                .expect(200);

            // User 2 пытается установить тот же телефон - должна быть ошибка 409
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/phone')
                .set('Authorization', `Bearer ${user2.token}`)
                .send({ phone: uniquePhone })
                .expect(409);
        });
    });

    // ===== PROFILE ENDPOINTS =====
    describe('PATCH /user/profile', () => {
        it('200: user updates own profile', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const payload = {
                firstName: 'Владимир',
                lastName: 'Владимиров',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(payload)
                .expect(200);

            expect(response.body).toHaveProperty('firstName');
            expect(response.body).toHaveProperty('lastName');
            expect(response.body.firstName).toBe(payload.firstName);
            expect(response.body.lastName).toBe(payload.lastName);
        });

        it('200: partial update only firstName', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            // Сначала устанавливаем полный профиль
            await request(app.getHttpServer())
                .patch('/online-store/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ firstName: 'Иван', lastName: 'Иванов' })
                .expect(200);

            // Теперь обновляем только firstName
            const payload = {
                firstName: 'Алексей',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(payload)
                .expect(200);

            expect(response.body.firstName).toBe(payload.firstName);
            // lastName остался прежним (Иванов)
            expect(response.body.lastName).toBe('Иванов');
        });

        it('401: requires auth', async () => {
            const payload = {
                firstName: 'Тест',
            };

            await request(app.getHttpServer())
                .patch('/online-store/user/profile')
                .send(payload)
                .expect(401);
        });
    });

    // ===== PASSWORD MANAGEMENT =====
    describe('Password management', () => {
        it('400: wrong old password', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/password')
                .set('Authorization', `Bearer ${token}`)
                .send({ oldPassword: 'wrong-old', newPassword: 'NewPass123!' })
                .expect(400);
        });
    });

    // ===== MISC ENDPOINTS =====
    describe('Misc endpoints', () => {
        it('200: GET /user/me with minimal body', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            const res = await request(app.getHttpServer())
                .get('/online-store/user/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(res.body?.id).toBeDefined();
        });
    });

    describe('PATCH /user/profile/date-of-birth', () => {
        it('200: updates date of birth with valid date (18+)', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const validDateOfBirth = '1990-01-15'; // 34 года

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/date-of-birth')
                .set('Authorization', `Bearer ${token}`)
                .send({ dateOfBirth: validDateOfBirth })
                .expect(200)
                .expect(({ body }) => {
                    expect(body?.data?.dateOfBirth).toBe(validDateOfBirth);
                });
        });

        it('400: rejects date for user younger than 18 years', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            // Дата 17 лет назад
            const seventeenYearsAgo = new Date();
            seventeenYearsAgo.setFullYear(seventeenYearsAgo.getFullYear() - 17);
            const invalidDateOfBirth = seventeenYearsAgo
                .toISOString()
                .split('T')[0];

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/date-of-birth')
                .set('Authorization', `Bearer ${token}`)
                .send({ dateOfBirth: invalidDateOfBirth })
                .expect(400)
                .expect(({ body }) => {
                    expect(Array.isArray(body)).toBe(true);
                    expect(body[0]).toHaveProperty('messages');
                    expect(Array.isArray(body[0].messages)).toBe(true);
                    expect(
                        body[0].messages.some((msg: string) =>
                            msg.includes(
                                'Дата рождения должна соответствовать возрасту от 18 до 150 лет',
                            ),
                        ),
                    ).toBe(true);
                });
        });

        it('400: rejects future date', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const futureDateString = futureDate.toISOString().split('T')[0];

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/date-of-birth')
                .set('Authorization', `Bearer ${token}`)
                .send({ dateOfBirth: futureDateString })
                .expect(400);
        });

        it('400: rejects invalid date format', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/date-of-birth')
                .set('Authorization', `Bearer ${token}`)
                .send({ dateOfBirth: 'invalid-date' })
                .expect(400);
        });

        it('401: requires auth', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/date-of-birth')
                .send({ dateOfBirth: '1990-01-15' })
                .expect(401);
        });

        it('200: accepts date exactly 18 years ago', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            // Дата ровно 18 лет назад
            const eighteenYearsAgo = new Date();
            eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
            const validDateOfBirth = eighteenYearsAgo
                .toISOString()
                .split('T')[0];

            await request(app.getHttpServer())
                .patch('/online-store/user/profile/date-of-birth')
                .set('Authorization', `Bearer ${token}`)
                .send({ dateOfBirth: validDateOfBirth })
                .expect(200)
                .expect(({ body }) => {
                    expect(body?.data?.dateOfBirth).toBe(validDateOfBirth);
                });
        });
    });

    // ===== CONSENTS ENDPOINTS =====
    describe('PATCH /user/consents', () => {
        it('200: updates all consents with valid data', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const consentsData = {
                isNewsletterSubscribed: true,
                isMarketingConsent: true,
                isCookieConsent: true,
            };

            await request(app.getHttpServer())
                .patch('/online-store/user/consents')
                .set('Authorization', `Bearer ${token}`)
                .send(consentsData)
                .expect(200)
                .expect(({ body }) => {
                    expect(body?.data?.isNewsletterSubscribed).toBe(true);
                    expect(body?.data?.isMarketingConsent).toBe(true);
                    expect(body?.data?.isCookieConsent).toBe(true);
                });
        });

        it('200: updates only one consent', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const consentsData = {
                isNewsletterSubscribed: true,
            };

            await request(app.getHttpServer())
                .patch('/online-store/user/consents')
                .set('Authorization', `Bearer ${token}`)
                .send(consentsData)
                .expect(200)
                .expect(({ body }) => {
                    expect(body?.data?.isNewsletterSubscribed).toBe(true);
                });
        });

        it('200: updates multiple consents', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const consentsData = {
                isMarketingConsent: false,
                isCookieConsent: true,
            };

            await request(app.getHttpServer())
                .patch('/online-store/user/consents')
                .set('Authorization', `Bearer ${token}`)
                .send(consentsData)
                .expect(200)
                .expect(({ body }) => {
                    expect(body?.data?.isMarketingConsent).toBe(false);
                    expect(body?.data?.isCookieConsent).toBe(true);
                });
        });

        it('400: rejects invalid data types (non-boolean)', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            await request(app.getHttpServer())
                .patch('/online-store/user/consents')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    isNewsletterSubscribed: 'not-boolean',
                })
                .expect(400);
        });

        it('400: rejects invalid data types (string instead of boolean)', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            await request(app.getHttpServer())
                .patch('/online-store/user/consents')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    isMarketingConsent: 'true',
                })
                .expect(400);
        });

        it('401: requires auth', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/user/consents')
                .send({
                    isNewsletterSubscribed: true,
                })
                .expect(401);
        });

        it('200: accepts empty body (no changes)', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            await request(app.getHttpServer())
                .patch('/online-store/user/consents')
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(200)
                .expect(({ body }) => {
                    expect(body?.data).toHaveProperty('id');
                    expect(body?.data).toHaveProperty('isNewsletterSubscribed');
                    expect(body?.data).toHaveProperty('isMarketingConsent');
                    expect(body?.data).toHaveProperty('isCookieConsent');
                });
        });
    });
});
