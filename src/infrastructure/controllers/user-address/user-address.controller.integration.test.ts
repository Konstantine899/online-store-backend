import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { setupTestApp } from '../../../../tests/setup/app';
import { TestDataFactory } from '../../../../tests/utils';

// Типы для тестов
interface TestAddressData {
    title: string;
    street: string;
    house: string;
    city: string;
    is_default?: boolean;
}

interface TestResponse {
    data?: {
        id: number;
        [key: string]: unknown;
    };
    message?: string;
}

// Статические константы для тестовых данных
const TEST_DATA = {
    ADDRESSES: {
        HOME: {
            title: 'Дом',
            street: 'ул. Пушкина',
            house: '10',
            city: 'Москва',
            is_default: true,
        },
        WORK: {
            title: 'Работа',
            street: 'Тверская',
            house: '1',
            city: 'Москва',
        },
        DACHA: {
            title: 'Дача',
            street: 'Сосновая',
            house: '7',
            city: 'Зеленоград',
        },
        TEMP: {
            title: 'Временный',
            street: 'Пробная',
            house: '9',
            city: 'Москва',
        },
    },
    ENDPOINTS: {
        ADDRESSES: '/online-store/user-addresses',
    },
} as const;

describe('UserAddressController (integration)', () => {
    let app: INestApplication;

    // Вспомогательные функции для создания тестовых объектов
    const createTestAddress = async (
        accessToken: string,
        addressData: TestAddressData,
    ): Promise<number> => {
        const response = await request(app.getHttpServer())
            .post(TEST_DATA.ENDPOINTS.ADDRESSES)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(addressData)
            .expect(201);
        return response.body?.data?.id;
    };

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
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

    describe('CRUD Operations', () => {
        it('should create address successfully', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const res = await request(app.getHttpServer())
                .post(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${token}`)
                .send(TEST_DATA.ADDRESSES.HOME)
                .expect((r: { status: number; body: unknown }) => {
                    if (r.status >= 500) {
                        // выводим тело при ошибке для диагностики
                        console.log('Create address 500 body:', r.body);
                    }
                })
                .expect(201);
            expect((res.body as TestResponse)?.data?.id).toBeDefined();
            expect((res.body as TestResponse)?.data?.is_default).toBe(true);
        });

        it('should get addresses list', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            // Сначала создадим адрес для этого пользователя
            await createTestAddress(token, TEST_DATA.ADDRESSES.HOME);

            const res = await request(app.getHttpServer())
                .get(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${token}`)
                .expect((r: { status: number; body: unknown }) => {
                    if (r.status >= 500) {
                        console.log('Get addresses 500 body:', r.body);
                    }
                })
                .expect(200);
            const data = (res.body as TestResponse)?.data as unknown;
            expect(Array.isArray(data)).toBe(true);
            if (Array.isArray(data)) {
                expect(data.length).toBeGreaterThan(0);
            }
        });

        it('should update address', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const id = await createTestAddress(token, TEST_DATA.ADDRESSES.WORK);

            await request(app.getHttpServer())
                .put(`${TEST_DATA.ENDPOINTS.ADDRESSES}/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ street: 'Новая' })
                .expect(200)
                .expect(({ body }: { body: TestResponse }) => {
                    expect(body?.data?.street).toBe('Новая');
                });
        });

        it('should set default address', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const id = await createTestAddress(
                token,
                TEST_DATA.ADDRESSES.DACHA,
            );

            await request(app.getHttpServer())
                .patch(`${TEST_DATA.ENDPOINTS.ADDRESSES}/${id}/set-default`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .expect(({ body }: { body: TestResponse }) => {
                    expect(body?.data?.is_default).toBe(true);
                });
        });

        it('should remove address', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const id = await createTestAddress(token, TEST_DATA.ADDRESSES.TEMP);

            await request(app.getHttpServer())
                .delete(`${TEST_DATA.ENDPOINTS.ADDRESSES}/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .expect(({ body }: { body: TestResponse }) => {
                    expect(body?.message).toBe('Адрес успешно удалён');
                });
        });
    });

    describe('Tenant Isolation & Cross-User Blocking', () => {
        it('должен блокировать доступ к адресу другого пользователя (GET one)', async () => {
            // Arrange: User A создает адрес
            const { token: tokenA } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const addressId = await createTestAddress(
                tokenA,
                TEST_DATA.ADDRESSES.HOME,
            );

            // Act: User B пытается получить адрес User A
            const { token: tokenB } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            // Assert: 404 (адрес не найден для User B)
            await request(app.getHttpServer())
                .get(`${TEST_DATA.ENDPOINTS.ADDRESSES}/${addressId}`)
                .set('Authorization', `Bearer ${tokenB}`)
                .expect(404);
        });

        it('должен блокировать изменение адреса другого пользователя (PUT)', async () => {
            // Arrange: User A создает адрес
            const { token: tokenA } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const addressId = await createTestAddress(
                tokenA,
                TEST_DATA.ADDRESSES.WORK,
            );

            // Act: User B пытается изменить адрес User A
            const { token: tokenB } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            // Assert: 404 (адрес не найден для User B)
            await request(app.getHttpServer())
                .put(`${TEST_DATA.ENDPOINTS.ADDRESSES}/${addressId}`)
                .set('Authorization', `Bearer ${tokenB}`)
                .send({ street: 'Попытка взлома' })
                .expect(404);
        });

        it('должен блокировать удаление адреса другого пользователя (DELETE)', async () => {
            // Arrange: User A создает адрес
            const { token: tokenA } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const addressId = await createTestAddress(
                tokenA,
                TEST_DATA.ADDRESSES.DACHA,
            );

            // Act: User B пытается удалить адрес User A
            const { token: tokenB } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            // Assert: 404 (адрес не найден для User B)
            await request(app.getHttpServer())
                .delete(`${TEST_DATA.ENDPOINTS.ADDRESSES}/${addressId}`)
                .set('Authorization', `Bearer ${tokenB}`)
                .expect(404);

            // Verify: адрес User A всё ещё существует
            const verifyRes = await request(app.getHttpServer())
                .get(`${TEST_DATA.ENDPOINTS.ADDRESSES}/${addressId}`)
                .set('Authorization', `Bearer ${tokenA}`)
                .expect(200);

            expect((verifyRes.body as TestResponse)?.data?.id).toBe(addressId);
        });

        it('должен блокировать установку default для адреса другого пользователя (PATCH)', async () => {
            // Arrange: User A создает адрес
            const { token: tokenA } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const addressId = await createTestAddress(
                tokenA,
                TEST_DATA.ADDRESSES.HOME,
            );

            // Act: User B пытается установить default для адреса User A
            const { token: tokenB } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );

            // Assert: 404 (адрес не найден для User B)
            await request(app.getHttpServer())
                .patch(
                    `${TEST_DATA.ENDPOINTS.ADDRESSES}/${addressId}/set-default`,
                )
                .set('Authorization', `Bearer ${tokenB}`)
                .expect(404);
        });

        it('GET /addresses должен возвращать только адреса текущего пользователя', async () => {
            // Arrange: User A создает 2 адреса
            const { token: tokenA } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            await createTestAddress(tokenA, TEST_DATA.ADDRESSES.HOME);
            await createTestAddress(tokenA, TEST_DATA.ADDRESSES.WORK);

            // User B создает 1 адрес
            const { token: tokenB } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            await createTestAddress(tokenB, TEST_DATA.ADDRESSES.DACHA);

            // Act & Assert: User A видит только свои 2 адреса
            const resA = await request(app.getHttpServer())
                .get(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${tokenA}`)
                .expect(200);

            const dataA = (resA.body as TestResponse)?.data as unknown;
            expect(Array.isArray(dataA)).toBe(true);
            if (Array.isArray(dataA)) {
                expect(dataA.length).toBe(2);
            }

            // Act & Assert: User B видит только свой 1 адрес
            const resB = await request(app.getHttpServer())
                .get(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${tokenB}`)
                .expect(200);

            const dataB = (resB.body as TestResponse)?.data as unknown;
            expect(Array.isArray(dataB)).toBe(true);
            if (Array.isArray(dataB)) {
                expect(dataB.length).toBe(1);
            }
        });

        it('должен изолировать default address между пользователями', async () => {
            // Arrange: User A устанавливает default адрес
            const { token: tokenA } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const addressIdA = await createTestAddress(
                tokenA,
                TEST_DATA.ADDRESSES.HOME,
            );
            await request(app.getHttpServer())
                .patch(
                    `${TEST_DATA.ENDPOINTS.ADDRESSES}/${addressIdA}/set-default`,
                )
                .set('Authorization', `Bearer ${tokenA}`)
                .expect(200);

            // User B устанавливает свой default адрес
            const { token: tokenB } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            const addressIdB = await createTestAddress(
                tokenB,
                TEST_DATA.ADDRESSES.WORK,
            );
            await request(app.getHttpServer())
                .patch(
                    `${TEST_DATA.ENDPOINTS.ADDRESSES}/${addressIdB}/set-default`,
                )
                .set('Authorization', `Bearer ${tokenB}`)
                .expect(200);

            // Act & Assert: Проверяем что у каждого свой default
            const listA = await request(app.getHttpServer())
                .get(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${tokenA}`)
                .expect(200);

            const addressesA = (listA.body as TestResponse)?.data as Array<{
                id: number;
                is_default: boolean;
            }>;
            expect(addressesA.find((a) => a.id === addressIdA)?.is_default).toBe(
                true,
            );

            const listB = await request(app.getHttpServer())
                .get(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${tokenB}`)
                .expect(200);

            const addressesB = (listB.body as TestResponse)?.data as Array<{
                id: number;
                is_default: boolean;
            }>;
            expect(addressesB.find((a) => a.id === addressIdB)?.is_default).toBe(
                true,
            );
        });
    });

    describe('Error Handling', () => {
        it('should return 401 when no token', async () => {
            await request(app.getHttpServer())
                .get(TEST_DATA.ENDPOINTS.ADDRESSES)
                .expect(401);
        });

        it('should return 400 on validation error', async () => {
            const { token } = await TestDataFactory.createUserWithRole(
                app,
                'USER',
            );
            await request(app.getHttpServer())
                .post(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: '', street: '', house: '', city: '' })
                .expect(400);
        });
    });
});
