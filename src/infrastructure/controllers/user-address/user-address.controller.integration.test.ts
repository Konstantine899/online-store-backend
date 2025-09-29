import request from 'supertest';
import { INestApplication } from '@nestjs/common';

// Внутренние импорты
import { setupTestApp } from '../../../../tests/setup/app';
import { authLoginAs } from '../../../../tests/setup/auth';

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
        ADDRESSES: '/user/addresses',
    },
} as const;

describe('UserAddressController (integration)', () => {
    let app: INestApplication;
    let accessToken: string;

    // Вспомогательные функции для создания тестовых объектов
    const createTestAddress = async (addressData: TestAddressData): Promise<number> => {
        const response = await request(app.getHttpServer())
            .post(TEST_DATA.ENDPOINTS.ADDRESSES)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(addressData)
            .expect(201);
        return response.body?.data?.id;
    };


    beforeAll(async () => {
        app = await setupTestApp();
        accessToken = await authLoginAs(app, 'user');
        console.log('Access token:', accessToken);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('CRUD Operations', () => {
        it('should create address successfully', async () => {
            await request(app.getHttpServer())
                .post(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${accessToken}`)
                .send(TEST_DATA.ADDRESSES.HOME)
                .expect(201)
                .expect(({ body }: { body: TestResponse }) => {
                    expect(body?.data?.id).toBeDefined();
                    expect(body?.data?.is_default).toBe(true);
                });
        });

        it('should get addresses list', async () => {
            await request(app.getHttpServer())
                .get(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect(({ body }: { body: TestResponse }) => {
                    expect(Array.isArray(body?.data)).toBe(true);
                    expect(body?.data?.length).toBeGreaterThan(0);
                });
        });

        it('should update address', async () => {
            const id = await createTestAddress(TEST_DATA.ADDRESSES.WORK);
            
            await request(app.getHttpServer())
                .put(`${TEST_DATA.ENDPOINTS.ADDRESSES}/${id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ street: 'Новая' })
                .expect(200)
                .expect(({ body }: { body: TestResponse }) => {
                    expect(body?.data?.street).toBe('Новая');
                });
        });

        it('should set default address', async () => {
            const id = await createTestAddress(TEST_DATA.ADDRESSES.DACHA);
            
            await request(app.getHttpServer())
                .patch(`${TEST_DATA.ENDPOINTS.ADDRESSES}/${id}/set-default`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect(({ body }: { body: TestResponse }) => {
                    expect(body?.data?.is_default).toBe(true);
                });
        });

        it('should remove address', async () => {
            const id = await createTestAddress(TEST_DATA.ADDRESSES.TEMP);
            
            await request(app.getHttpServer())
                .delete(`${TEST_DATA.ENDPOINTS.ADDRESSES}/${id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect(({ body }: { body: TestResponse }) => {
                    expect(body?.message).toBe('Адрес успешно удалён');
                });
        });
    });

    describe('Error Handling', () => {
        it('should return 401 when no token', async () => {
            await request(app.getHttpServer())
                .get(TEST_DATA.ENDPOINTS.ADDRESSES)
                .expect(401);
        });

        it('should return 400 on validation error', async () => {
            await request(app.getHttpServer())
                .post(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ title: '', street: '', house: '', city: '' })
                .expect(400);
        });
    });

    // Условные отладочные тесты
    const DEBUG_TESTS = process.env.DEBUG_TESTS === 'true';

    if (DEBUG_TESTS) {
        it('Debug: check token content', async () => {
            const response = await request(app.getHttpServer())
                .get(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${accessToken}`);
            console.log('Response status:', response.status);
            console.log('Response body:', response.body);
        });
    }
});