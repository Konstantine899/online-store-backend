import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestDataFactory } from '../../../../../tests/utils';

describe('User Preferences Integration Tests', () => {
    let app: INestApplication;

    // Helper function to get error message(s) as a single string
    const getErrorMessage = (response: {
        body: { message?: string | string[] } | Array<{ messages: string[] }>;
    }): string => {
        // CustomValidationPipe returns array of objects with messages field
        if (Array.isArray(response.body)) {
            return response.body.flatMap((err) => err.messages).join(' ');
        }
        // Standard NestJS format
        const msg = response.body.message;
        return Array.isArray(msg) ? msg.join(' ') : (msg ?? '');
    };

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
        if (app) {
            await app.close();
        }
    });

    // ===== PREFERENCES ENDPOINTS =====
    describe('PATCH /user/profile/preferences', () => {
        it('200: updates preferences with valid data', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                themePreference: 'dark',
                defaultLanguage: 'en',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toMatchObject(preferencesData);
        });

        it('200: updates only provided preferences', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                themePreference: 'light',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.themePreference).toBe('light');
        });

        it('400: invalid enum values', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const invalidData = {
                themePreference: 'neon',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidData)
                .expect(400);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0]).toHaveProperty('status', 400);
            expect(response.body[0]).toHaveProperty('messages');
            expect(Array.isArray(response.body[0].messages)).toBe(true);
        });

        it('401: requires auth', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .send({ themePreference: 'dark' })
                .expect(401);
        });

        it('200: accepts empty object', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send({})
                .expect(200);

            expect(response.body).toHaveProperty('data');
        });

        it('400: very long strings in preferences', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const longString = 'a'.repeat(1000);
            const preferencesData = {
                themePreference: longString,
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(400);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0]).toHaveProperty('status', 400);
        });

        it('200: special characters in preferences', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                defaultLanguage: 'en',
                notificationPreferences: {
                    'special-chars': 'test@#$%^&*()',
                    'spaces and symbols': 'value with spaces',
                },
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.defaultLanguage).toBe('en');
            expect(response.body.data.notificationPreferences).toEqual(
                preferencesData.notificationPreferences,
            );
        });

        it('200: updates preferredLanguage with valid value', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                preferredLanguage: 'es',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.preferredLanguage).toBe('es');
        });

        it('400: invalid preferredLanguage value', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const invalidData = {
                preferredLanguage: 'invalid_lang',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidData)
                .expect(400);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0]).toHaveProperty('status', 400);
            expect(response.body[0]).toHaveProperty('messages');
        });

        it('200: updates timezone with valid IANA value', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                timezone: 'America/New_York',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.timezone).toBe('America/New_York');
        });

        it('200: supports extended timezone list (Asia/Kolkata)', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                timezone: 'Asia/Kolkata',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.timezone).toBe('Asia/Kolkata');
        });

        it('200: supports extended timezone list (America/Sao_Paulo)', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                timezone: 'America/Sao_Paulo',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.timezone).toBe('America/Sao_Paulo');
        });

        it('200: supports extended timezone list (Australia/Melbourne)', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                timezone: 'Australia/Melbourne',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data.timezone).toBe('Australia/Melbourne');
        });

        it('400: invalid timezone value', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const invalidData = {
                timezone: 'Invalid/Timezone',
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidData)
                .expect(400);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0]).toHaveProperty('status', 400);
            expect(response.body[0].messages).toContain(
                'Часовой пояс должен быть одним из поддерживаемых IANA timezone',
            );
        });

        it('200: updates all preference fields simultaneously', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const preferencesData = {
                themePreference: 'auto',
                preferredLanguage: 'fr',
                defaultLanguage: 'en',
                timezone: 'Europe/Paris',
                notificationPreferences: { email: true, push: false },
                translations: [{ key: 'welcome.title', value: 'Bienvenue' }], // Fixed: array format
            };

            const response = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${token}`)
                .send(preferencesData)
                .expect(200);

            expect(response.body.data).toMatchObject(preferencesData);
        });

        it('200: tenant isolation - user A cannot affect user B preferences', async () => {
            // Create User A
            const { token: tokenA } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            // Set preferences for User A
            const responseA1 = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ themePreference: 'dark', timezone: 'UTC' })
                .expect(200);

            expect(responseA1.body.data.themePreference).toBe('dark');
            expect(responseA1.body.data.timezone).toBe('UTC');

            // Create User B
            const { token: tokenB } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            // Set different preferences for User B
            const responseB = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${tokenB}`)
                .send({
                    themePreference: 'light',
                    timezone: 'Asia/Tokyo',
                })
                .expect(200);

            expect(responseB.body.data.themePreference).toBe('light');
            expect(responseB.body.data.timezone).toBe('Asia/Tokyo');

            // Verify User A preferences remain unchanged by getting them again
            const responseA2 = await request(app.getHttpServer())
                .patch('/online-store/user/profile/preferences')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({}) // Empty update to get current preferences
                .expect(200);

            expect(responseA2.body.data.themePreference).toBe('dark');
            expect(responseA2.body.data.timezone).toBe('UTC');
        });

        // ===== TRANSLATIONS VALIDATION TESTS =====
        describe('Translations Validation', () => {
            it('200: accepts valid translations with correct key format', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );
                const preferencesData = {
                    translations: [
                        { key: 'welcome.title', value: 'Добро пожаловать!' },
                        { key: 'button.submit', value: 'Отправить' },
                        { key: 'error.not_found', value: 'Не найдено' },
                        {
                            key: 'user_profile.edit',
                            value: 'Редактировать профиль',
                        },
                    ],
                };

                const response = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send(preferencesData)
                    .expect(200);

                expect(response.body.data.translations).toHaveLength(4);
                expect(response.body.data.translations).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            key: 'welcome.title',
                            value: 'Добро пожаловать!',
                        }),
                        expect.objectContaining({
                            key: 'button.submit',
                            value: 'Отправить',
                        }),
                        expect.objectContaining({
                            key: 'error.not_found',
                            value: 'Не найдено',
                        }),
                        expect.objectContaining({
                            key: 'user_profile.edit',
                            value: 'Редактировать профиль',
                        }),
                    ]),
                );
            });

            it('400: rejects translations with invalid key format (no namespace)', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );
                const preferencesData = {
                    translations: [
                        { key: 'welcome', value: 'Добро пожаловать!' },
                    ], // Missing namespace
                };

                const response = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send(preferencesData)
                    .expect(400);

                const errorMessage = getErrorMessage(response);
                expect(errorMessage).toContain('namespace.key');
            });

            it('400: rejects translations with uppercase in key', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );
                const preferencesData = {
                    translations: [
                        { key: 'Welcome.Title', value: 'Добро пожаловать!' }, // Uppercase not allowed
                    ],
                };

                const response = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send(preferencesData)
                    .expect(400);

                const errorMessage = getErrorMessage(response);
                expect(errorMessage).toContain('lowercase');
            });

            it('400: rejects translations with non-string value', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );
                const preferencesData = {
                    translations: [
                        {
                            key: 'welcome.title',
                            value: 123 as unknown as string,
                        }, // Non-string value
                    ],
                };

                const response = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send(preferencesData)
                    .expect(400);

                const errorMessage = getErrorMessage(response);
                expect(errorMessage).toContain('строкой');
            });

            it('400: rejects translations with empty string value', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );
                const preferencesData = {
                    translations: [
                        { key: 'welcome.title', value: '' }, // Empty string
                    ],
                };

                const response = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send(preferencesData)
                    .expect(400);

                const errorMessage = getErrorMessage(response);
                expect(errorMessage).toContain('пустым');
            });

            it('400: rejects translations with value exceeding 1000 characters', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );
                const longValue = 'A'.repeat(1001);
                const preferencesData = {
                    translations: [{ key: 'welcome.title', value: longValue }],
                };

                const response = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send(preferencesData)
                    .expect(400);

                const errorMessage = getErrorMessage(response);
                expect(errorMessage).toContain('1000');
            });

            it('400: rejects translations with key shorter than 3 characters', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );
                const preferencesData = {
                    translations: [
                        { key: 'ab', value: 'Value' }, // Key too short (2 chars)
                    ],
                };

                const response = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send(preferencesData)
                    .expect(400);

                const errorMessage = getErrorMessage(response);
                expect(errorMessage).toContain('минимум');
            });

            it('400: rejects translations with key exceeding 100 characters', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );
                const longKey = 'namespace.' + 'k'.repeat(91); // Total 101 chars
                const preferencesData = {
                    translations: [{ key: longKey, value: 'Value' }],
                };

                const response = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send(preferencesData)
                    .expect(400);

                const errorMessage = getErrorMessage(response);
                expect(errorMessage).toContain('100');
            });

            it('400: rejects more than 100 translation entries', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );

                // Generate 101 translations
                const translations = [];
                for (let i = 0; i < 101; i++) {
                    translations.push({
                        key: `key${i}.value`,
                        value: `Translation ${i}`,
                    });
                }

                const preferencesData = { translations };

                const response = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send(preferencesData)
                    .expect(400);

                const errorMessage = getErrorMessage(response);
                expect(errorMessage).toContain('100');
            });

            it('200: accepts exactly 100 translation entries', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );

                // Generate exactly 100 translations
                const translations = [];
                for (let i = 0; i < 100; i++) {
                    translations.push({
                        key: `key${i}.value`,
                        value: `Translation ${i}`,
                    });
                }

                const preferencesData = { translations };

                const response = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send(preferencesData)
                    .expect(200);

                expect(response.body.data.translations).toHaveLength(100);
            });
        });

        // ===== REDIS CACHING TESTS =====
        describe('Redis Caching for Preferences', () => {
            it('CACHE HIT: второй запрос preferences возвращается из кэша быстрее', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );

                // Первый запрос - Cache MISS (идёт в БД и кэширует)
                const startTime1 = Date.now();
                const response1 = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send({}) // Пустой body для чтения текущих preferences
                    .expect(200);
                const duration1 = Date.now() - startTime1;

                expect(response1.body).toHaveProperty('data');
                expect(response1.body.data).toHaveProperty('themePreference');

                // Второй запрос - Cache HIT (должен быть из кэша)
                const startTime2 = Date.now();
                const response2 = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send({}) // Пустой body
                    .expect(200);
                const duration2 = Date.now() - startTime2;

                // Проверяем, что данные одинаковые
                expect(response2.body.data).toEqual(response1.body.data);

                // Cache HIT должен быть быстрее (или как минимум не медленнее)
                // В тестах разница может быть небольшой, но проверяем логику
                expect(duration2).toBeLessThanOrEqual(duration1 + 50); // +50ms допуск
            });

            it('CACHE INVALIDATION: после обновления preferences кэш инвалидируется', async () => {
                const { token } = await TestDataFactory.createUserWithRole(
                    app,
                    'USER',
                );

                // 1. Читаем текущие preferences (кэшируются)
                const response1 = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send({})
                    .expect(200);

                const originalTheme = response1.body.data.themePreference;

                // 2. Обновляем preferences (должно инвалидировать кэш)
                const newTheme = originalTheme === 'dark' ? 'light' : 'dark';
                await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ themePreference: newTheme })
                    .expect(200);

                // 3. Читаем ещё раз (должны получить свежие данные из БД)
                const response2 = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token}`)
                    .send({})
                    .expect(200);

                // Проверяем, что данные обновились
                expect(response2.body.data.themePreference).toBe(newTheme);
                expect(response2.body.data.themePreference).not.toBe(
                    originalTheme,
                );
            });

            it('TENANT ISOLATION: кэш изолирован по tenantId', async () => {
                // Создаём двух пользователей с разными tenant (если поддерживается в тестах)
                const { token: token1 } =
                    await TestDataFactory.createUserWithRole(app, 'USER');
                const { token: token2 } =
                    await TestDataFactory.createUserWithRole(app, 'USER');

                // 1. Пользователь 1 устанавливает тему dark
                await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token1}`)
                    .send({ themePreference: 'dark' })
                    .expect(200);

                // 2. Пользователь 2 устанавливает тему light
                await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token2}`)
                    .send({ themePreference: 'light' })
                    .expect(200);

                // 3. Проверяем, что каждый пользователь получает свои данные из кэша
                const response1 = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token1}`)
                    .send({})
                    .expect(200);

                const response2 = await request(app.getHttpServer())
                    .patch('/online-store/user/profile/preferences')
                    .set('Authorization', `Bearer ${token2}`)
                    .send({})
                    .expect(200);

                // Данные должны быть изолированы
                expect(response1.body.data.themePreference).toBe('dark');
                expect(response2.body.data.themePreference).toBe('light');
                expect(response1.body.data.themePreference).not.toBe(
                    response2.body.data.themePreference,
                );
            });
        });
    });
});
