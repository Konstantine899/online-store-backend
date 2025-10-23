import { HttpStatus, INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import request from 'supertest';
import { setupTestApp } from '../../setup/app';
import { TestDataFactory, TestDatabaseSetup } from '../../utils';

/**
 * SAAS-004-05: CartController Integration Tests
 *
 * Scope:
 * 1. GET /cart/get-cart - получение корзины (guest/auth)
 * 2. POST /cart/items - добавление товара (DTO validation)
 * 3. PATCH /cart/items/increment - увеличение количества
 * 4. PATCH /cart/items/decrement - уменьшение количества
 * 5. DELETE /cart/items/:productId - удаление товара
 * 6. DELETE /cart - очистка корзины
 * 7. POST /cart/promo-code - применение промокода
 * 8. DELETE /cart/promo-code - удаление промокода
 *
 * Goal: Full API coverage, DTO validation, error handling
 */

describe('CartController (Integration)', () => {
    let app: INestApplication;
    let authToken: string;
    let productId: number;
    let guestCartCookie: string;

    beforeAll(async () => {
        app = await setupTestApp();

        // Применяем миграции и seeds для тестовой БД
        await TestDatabaseSetup.setupDatabase('test');

        await app.init();

        // Используем продукт из seeds (id: 1 - iPhone 15)
        productId = 1;

        // Create auth user
        const user = await TestDataFactory.createUserInDB(app.get(Sequelize), {
            email: 'cart-test@example.com',
            password: 'SecurePassword123!',
        });
        authToken = await TestDataFactory.loginUser(
            app,
            user.email,
            'SecurePassword123!',
        );
    }, 30000);

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================
    // 1. GET /cart/get-cart - Получение корзины
    // ============================================================
    describe('GET /cart/get-cart', () => {
        it('должен создать новую гостевую корзину если нет cookie', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/cart/get-cart')
                .expect(HttpStatus.OK);

            expect(response.body).toMatchObject({
                cartId: expect.any(Number),
                products: [],
            });

            // Проверяем что установлен cookie
            const cookies = response.headers['set-cookie'] as string | string[];
            expect(cookies).toBeDefined();
            if (Array.isArray(cookies)) {
                expect(
                    cookies.some((c: string) => c.startsWith('cartId=')),
                ).toBe(true);
            }
        });

        it('должен вернуть существующую корзину если есть cookie', async () => {
            // Создаём корзину
            const firstResponse = await request(app.getHttpServer())
                .get('/online-store/cart/get-cart')
                .expect(HttpStatus.OK);

            const cookies = firstResponse.headers['set-cookie'] as
                | string
                | string[];
            const cartCookie = Array.isArray(cookies)
                ? cookies.find((c: string) => c.startsWith('cartId='))
                : cookies?.startsWith('cartId=')
                  ? cookies
                  : undefined;

            // Запрашиваем с cookie
            const secondResponse = await request(app.getHttpServer())
                .get('/online-store/cart/get-cart')
                .set('Cookie', cartCookie || '')
                .expect(HttpStatus.OK);

            expect(secondResponse.body.cartId).toBe(firstResponse.body.cartId);
        });

        it('должен вернуть корзину авторизованного пользователя', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/cart/get-cart')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(HttpStatus.OK);

            expect(response.body).toMatchObject({
                cartId: expect.any(Number),
                products: expect.any(Array),
            });
        });
    });

    // ============================================================
    // 2. POST /cart/items - Добавление товара
    // ============================================================
    describe('POST /cart/items', () => {
        beforeEach(async () => {
            // Получаем гостевую корзину для тестов
            const response = await request(app.getHttpServer()).get(
                '/online-store/cart/get-cart',
            );
            guestCartCookie = (
                response.headers['set-cookie'] as string | string[]
            )?.toString();
        });

        it('должен добавить товар в корзину', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/cart/items')
                .set('Cookie', guestCartCookie)
                .send({
                    productId,
                    quantity: 2,
                })
                .expect(HttpStatus.OK);

            expect(response.body).toMatchObject({
                cartId: expect.any(Number),
                products: expect.arrayContaining([
                    expect.objectContaining({
                        id: productId,
                        quantity: 2,
                    }),
                ]),
            });
        });

        describe('DTO Validation', () => {
            it('должен вернуть 400 если нет productId', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/cart/items')
                    .set('Cookie', guestCartCookie)
                    .send({
                        quantity: 2,
                    })
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(/ID товара/i),
                    ]),
                );
            });

            it('должен вернуть 400 если нет quantity', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/cart/items')
                    .set('Cookie', guestCartCookie)
                    .send({
                        productId,
                    })
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(/количество товара/i),
                    ]),
                );
            });

            it('должен вернуть 400 если productId <= 0', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/cart/items')
                    .set('Cookie', guestCartCookie)
                    .send({
                        productId: 0,
                        quantity: 2,
                    })
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(
                            /ID товара должен быть больше 0/i,
                        ),
                    ]),
                );
            });

            it('должен вернуть 400 если quantity < 1', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/cart/items')
                    .set('Cookie', guestCartCookie)
                    .send({
                        productId,
                        quantity: 0,
                    })
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(/минимум 1/i),
                    ]),
                );
            });

            it('должен вернуть 400 если quantity > 999', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/cart/items')
                    .set('Cookie', guestCartCookie)
                    .send({
                        productId,
                        quantity: 1000,
                    })
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(/максимум 999/i),
                    ]),
                );
            });
        });

        it('должен вернуть 404 если товар не найден', async () => {
            await request(app.getHttpServer())
                .post('/online-store/cart/items')
                .set('Cookie', guestCartCookie)
                .send({
                    productId: 999999,
                    quantity: 1,
                })
                .expect(HttpStatus.NOT_FOUND);
        });
    });

    // ============================================================
    // 3. PATCH /cart/items/increment - Увеличение количества
    // ============================================================
    describe('PATCH /cart/items/increment', () => {
        beforeEach(async () => {
            // Создаём корзину с товаром
            const getCartRes = await request(app.getHttpServer()).get(
                '/online-store/cart/get-cart',
            );
            guestCartCookie = (
                getCartRes.headers['set-cookie'] as string | string[]
            )?.toString();

            await request(app.getHttpServer())
                .post('/online-store/cart/items')
                .set('Cookie', guestCartCookie)
                .send({ productId, quantity: 2 });
        });

        it('должен увеличить количество товара', async () => {
            const response = await request(app.getHttpServer())
                .patch('/online-store/cart/items/increment')
                .set('Cookie', guestCartCookie)
                .send({
                    productId,
                    amount: 3,
                })
                .expect(HttpStatus.OK);

            const product = response.body.products.find(
                (p: { id: number }) => p.id === productId,
            );
            expect(product.quantity).toBe(5); // 2 + 3
        });

        describe('DTO Validation', () => {
            it('должен вернуть 400 если нет productId', async () => {
                const response = await request(app.getHttpServer())
                    .patch('/online-store/cart/items/increment')
                    .set('Cookie', guestCartCookie)
                    .send({ amount: 1 })
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(/ID товара/i),
                    ]),
                );
            });

            it('должен вернуть 400 если нет amount', async () => {
                const response = await request(app.getHttpServer())
                    .patch('/online-store/cart/items/increment')
                    .set('Cookie', guestCartCookie)
                    .send({ productId })
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(/изменение количества/i),
                    ]),
                );
            });
        });

        it('должен вернуть 404 если товар не найден в корзине', async () => {
            await request(app.getHttpServer())
                .patch('/online-store/cart/items/increment')
                .set('Cookie', guestCartCookie)
                .send({
                    productId: 999999,
                    amount: 1,
                })
                .expect(HttpStatus.NOT_FOUND);
        });
    });

    // ============================================================
    // 4. PATCH /cart/items/decrement - Уменьшение количества
    // ============================================================
    describe('PATCH /cart/items/decrement', () => {
        beforeEach(async () => {
            const getCartRes = await request(app.getHttpServer()).get(
                '/online-store/cart/get-cart',
            );
            guestCartCookie = (
                getCartRes.headers['set-cookie'] as string | string[]
            )?.toString();

            await request(app.getHttpServer())
                .post('/online-store/cart/items')
                .set('Cookie', guestCartCookie)
                .send({ productId, quantity: 5 });
        });

        it('должен уменьшить количество товара', async () => {
            const response = await request(app.getHttpServer())
                .patch('/online-store/cart/items/decrement')
                .set('Cookie', guestCartCookie)
                .send({
                    productId,
                    amount: 2,
                })
                .expect(HttpStatus.OK);

            const product = response.body.products.find(
                (p: { id: number }) => p.id === productId,
            );
            expect(product.quantity).toBe(3); // 5 - 2
        });

        it('должен удалить товар если количество = 0', async () => {
            const response = await request(app.getHttpServer())
                .patch('/online-store/cart/items/decrement')
                .set('Cookie', guestCartCookie)
                .send({
                    productId,
                    amount: 5,
                })
                .expect(HttpStatus.OK);

            expect(
                response.body.products.find(
                    (p: { id: number }) => p.id === productId,
                ),
            ).toBeUndefined();
        });

        describe('DTO Validation', () => {
            it('должен вернуть 400 если amount не целое число', async () => {
                const response = await request(app.getHttpServer())
                    .patch('/online-store/cart/items/decrement')
                    .set('Cookie', guestCartCookie)
                    .send({
                        productId,
                        amount: 1.5,
                    })
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(/целым числом/i),
                    ]),
                );
            });
        });
    });

    // ============================================================
    // 5. DELETE /cart/items/:productId - Удаление товара
    // ============================================================
    describe('DELETE /cart/items/:productId', () => {
        beforeEach(async () => {
            const getCartRes = await request(app.getHttpServer()).get(
                '/online-store/cart/get-cart',
            );
            guestCartCookie = (
                getCartRes.headers['set-cookie'] as string | string[]
            )?.toString();

            await request(app.getHttpServer())
                .post('/online-store/cart/items')
                .set('Cookie', guestCartCookie)
                .send({ productId, quantity: 3 });
        });

        it('должен удалить товар из корзины', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/online-store/cart/items/${productId}`)
                .set('Cookie', guestCartCookie)
                .expect(HttpStatus.OK);

            expect(
                response.body.products.find(
                    (p: { id: number }) => p.id === productId,
                ),
            ).toBeUndefined();
        });

        it('должен вернуть 404 если товар не найден в корзине', async () => {
            await request(app.getHttpServer())
                .delete('/online-store/cart/items/999999')
                .set('Cookie', guestCartCookie)
                .expect(HttpStatus.NOT_FOUND);
        });
    });

    // ============================================================
    // 6. DELETE /cart - Очистка корзины
    // ============================================================
    describe('DELETE /cart', () => {
        beforeEach(async () => {
            const getCartRes = await request(app.getHttpServer()).get(
                '/online-store/cart/get-cart',
            );
            guestCartCookie = (
                getCartRes.headers['set-cookie'] as string | string[]
            )?.toString();

            await request(app.getHttpServer())
                .post('/online-store/cart/items')
                .set('Cookie', guestCartCookie)
                .send({ productId, quantity: 5 });
        });

        it('должен очистить корзину', async () => {
            const response = await request(app.getHttpServer())
                .delete('/online-store/cart')
                .set('Cookie', guestCartCookie)
                .expect(HttpStatus.OK);

            expect(response.body.products).toHaveLength(0);
        });
    });

    // ============================================================
    // 7. POST /cart/promo-code - Применение промокода
    // ============================================================
    describe('POST /cart/promo-code', () => {
        beforeEach(async () => {
            const getCartRes = await request(app.getHttpServer()).get(
                '/online-store/cart/get-cart',
            );
            guestCartCookie = (
                getCartRes.headers['set-cookie'] as string | string[]
            )?.toString();
        });

        describe('DTO Validation', () => {
            it('должен вернуть 400 если нет code', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/cart/promo-code')
                    .set('Cookie', guestCartCookie)
                    .send({})
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(/код промокода/i),
                    ]),
                );
            });

            it('должен вернуть 400 если code < 3 символов', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/cart/promo-code')
                    .set('Cookie', guestCartCookie)
                    .send({ code: 'AB' })
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(/минимум 3 символа/i),
                    ]),
                );
            });

            it('должен вернуть 400 если code > 50 символов', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/cart/promo-code')
                    .set('Cookie', guestCartCookie)
                    .send({ code: 'A'.repeat(51) })
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(/не может быть длиннее 50/i),
                    ]),
                );
            });

            it('должен очистить XSS в коде промокода', async () => {
                const response = await request(app.getHttpServer())
                    .post('/online-store/cart/promo-code')
                    .set('Cookie', guestCartCookie)
                    .send({ code: '<script>alert("xss")</script>' })
                    .expect(HttpStatus.BAD_REQUEST);

                expect(response.body.message).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(/недопустимые символы/i),
                    ]),
                );
            });
        });

        // Note: реальное применение промокода требует реализации в CartService
        // Здесь проверяем только валидацию DTO и базовый API flow
    });

    // ============================================================
    // 8. DELETE /cart/promo-code - Удаление промокода
    // ============================================================
    describe('DELETE /cart/promo-code', () => {
        beforeEach(async () => {
            const getCartRes = await request(app.getHttpServer()).get(
                '/online-store/cart/get-cart',
            );
            guestCartCookie = (
                getCartRes.headers['set-cookie'] as string | string[]
            )?.toString();
        });

        it('должен удалить промокод из корзины', async () => {
            const response = await request(app.getHttpServer())
                .delete('/online-store/cart/promo-code')
                .set('Cookie', guestCartCookie)
                .expect(HttpStatus.OK);

            expect(response.body).toMatchObject({
                cartId: expect.any(Number),
                products: expect.any(Array),
            });
        });
    });
});
