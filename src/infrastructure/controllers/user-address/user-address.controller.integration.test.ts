import request from 'supertest';
import { INestApplication } from '@nestjs/common';

// Внутренние импорты
import { AuthGuard } from '@app/infrastructure/common/guards/auth.guard';
import { RoleGuard } from '@app/infrastructure/common/guards/role.guard';
import { Test } from '@nestjs/testing';
import { TestAppModule } from '../../../../tests/setup/test-app.module';
import { UnauthorizedException } from '@nestjs/common';
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
        ADDRESSES: '/online-store/user-addresses',
    },
} as const;

describe('UserAddressController (integration)', () => {
    let app: INestApplication;
    let accessToken: string;

    // Вспомогательные функции для создания тестовых объектов
    const createTestAddress = async (
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
        // Переопределяем гварды как в нотификациях, чтобы избежать 403 в тестах
        const moduleRef = await Test.createTestingModule({
            imports: [TestAppModule],
        })
            .overrideGuard(AuthGuard)
            .useValue({
                canActivate: (context: { switchToHttp: () => { getRequest: () => { headers: { authorization?: string } } } }) => {
                    const req = context.switchToHttp().getRequest();
                    if (!req.headers?.authorization) {
                        throw new UnauthorizedException();
                    }
                    return true;
                },
            })
            .overrideGuard(RoleGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleRef.createNestApplication();
        
        // Глобальные настройки как в setupTestApp
        const { CustomValidationPipe } = await import('@app/infrastructure/pipes/custom-validation-pipe');
        const cookieParser = (await import('cookie-parser')).default;
        app.use(cookieParser(process.env.COOKIE_PARSER_SECRET_KEY || 'test-secret'));
        app.useGlobalPipes(new CustomValidationPipe());
        app.setGlobalPrefix('online-store');
        // Мокаем req.user, так как гварды пропущены
        app.use((req: unknown, _res: unknown, next: unknown) => {
            const hasAuth = Boolean((req as { headers?: { authorization?: string } }).headers?.authorization);
            if (hasAuth) {
                (req as { user?: { id: number } }).user = { id: 13 };
            }
            (next as () => void)();
        });
        
        await app.init();
        accessToken = await authLoginAs(app, 'user');
        console.log('Access token:', accessToken);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('CRUD Operations', () => {
        it('should create address successfully', async () => {
            const res = await request(app.getHttpServer())
                .post(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${accessToken}`)
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
            const res = await request(app.getHttpServer())
                .get(TEST_DATA.ENDPOINTS.ADDRESSES)
                .set('Authorization', `Bearer ${accessToken}`)
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
