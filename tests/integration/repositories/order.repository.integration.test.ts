import { OrderModel, UserModel } from '@app/domain/models';
import { OrderRepository } from '@app/infrastructure/repositories/order/order.repository';
import type { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { setupTestApp } from '../../setup/app';
import { TestDataFactory } from '../../utils/test-data-factory';

describe('OrderRepository - Auto Role Assignment Methods (integration)', () => {
    let app: INestApplication;
    let repository: OrderRepository;
    let sequelize: Sequelize;

    beforeAll(async () => {
        // Увеличиваем таймаут для подключения к БД
        jest.setTimeout(30000);

        app = await setupTestApp();
        repository = app.get<OrderRepository>(OrderRepository);
        sequelize = app.get<Sequelize>(Sequelize);

        // Проверяем, что подключение к БД установлено
        await sequelize.authenticate();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('getUserTotalSpent', () => {
        it('должен вернуть 0, если у пользователя нет заказов', async () => {
            const testUser = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });

            try {
                const totalSpent = await repository.getUserTotalSpent(
                    testUser.id,
                    1,
                );

                expect(totalSpent).toBe(0);
            } finally {
                await UserModel.destroy({ where: { id: testUser.id } });
            }
        });

        it('должен вернуть сумму одного заказа', async () => {
            const testUser = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });

            try {
                const orderAmount = 15000;
                await OrderModel.create({
                    name: 'Test User',
                    email: 'test@example.com',
                    phone: '+79991234567',
                    address: 'Test Address',
                    amount: orderAmount,
                    status: 1,
                    user_id: testUser.id,
                    tenant_id: 1,
                });

                const totalSpent = await repository.getUserTotalSpent(
                    testUser.id,
                    1,
                );

                expect(totalSpent).toBe(orderAmount);
            } finally {
                await OrderModel.destroy({
                    where: { user_id: testUser.id, tenant_id: 1 },
                });
                await UserModel.destroy({ where: { id: testUser.id } });
            }
        });

        it('должен вернуть сумму нескольких заказов', async () => {
            const testUser = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });

            try {
                const order1Amount = 10000;
                const order2Amount = 20000;
                const order3Amount = 15000;
                const expectedTotal =
                    order1Amount + order2Amount + order3Amount;

                await OrderModel.bulkCreate([
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: order1Amount,
                        status: 1,
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: order2Amount,
                        status: 1,
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: order3Amount,
                        status: 1,
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                ]);

                const totalSpent = await repository.getUserTotalSpent(
                    testUser.id,
                    1,
                );

                expect(totalSpent).toBe(expectedTotal);
            } finally {
                await OrderModel.destroy({
                    where: { user_id: testUser.id, tenant_id: 1 },
                });
                await UserModel.destroy({ where: { id: testUser.id } });
            }
        });

        it('должен учитывать только заказы конкретного тенанта', async () => {
            const testUser = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });

            try {
                const tenant1Amount = 10000;
                const tenant2Amount = 20000;

                await OrderModel.bulkCreate([
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: tenant1Amount,
                        status: 1,
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: tenant2Amount,
                        status: 1,
                        user_id: testUser.id,
                        tenant_id: 2,
                    },
                ]);

                const totalSpent = await repository.getUserTotalSpent(
                    testUser.id,
                    1,
                );

                expect(totalSpent).toBe(tenant1Amount);
            } finally {
                await OrderModel.destroy({
                    where: { user_id: testUser.id },
                });
                await UserModel.destroy({ where: { id: testUser.id } });
            }
        });

        it('должен учитывать только заказы конкретного пользователя', async () => {
            const testUser1 = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });
            const testUser2 = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });

            try {
                const user1Amount = 10000;
                const user2Amount = 20000;

                await OrderModel.bulkCreate([
                    {
                        name: 'Test User 1',
                        email: 'test1@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: user1Amount,
                        status: 1,
                        user_id: testUser1.id,
                        tenant_id: 1,
                    },
                    {
                        name: 'Test User 2',
                        email: 'test2@example.com',
                        phone: '+79991234568',
                        address: 'Test Address',
                        amount: user2Amount,
                        status: 1,
                        user_id: testUser2.id,
                        tenant_id: 1,
                    },
                ]);

                const totalSpent1 = await repository.getUserTotalSpent(
                    testUser1.id,
                    1,
                );
                const totalSpent2 = await repository.getUserTotalSpent(
                    testUser2.id,
                    1,
                );

                expect(totalSpent1).toBe(user1Amount);
                expect(totalSpent2).toBe(user2Amount);
            } finally {
                await OrderModel.destroy({
                    where: {
                        user_id: [testUser1.id, testUser2.id],
                        tenant_id: 1,
                    },
                });
                await UserModel.destroy({
                    where: { id: [testUser1.id, testUser2.id] },
                });
            }
        });

        it('должен корректно обрабатывать заказы с нулевой суммой', async () => {
            const testUser = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });

            try {
                await OrderModel.bulkCreate([
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: 0,
                        status: 1,
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: 5000,
                        status: 1,
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                ]);

                const totalSpent = await repository.getUserTotalSpent(
                    testUser.id,
                    1,
                );

                expect(totalSpent).toBe(5000);
            } finally {
                await OrderModel.destroy({
                    where: { user_id: testUser.id, tenant_id: 1 },
                });
                await UserModel.destroy({ where: { id: testUser.id } });
            }
        });
    });

    describe('getUserOrderCount', () => {
        it('должен вернуть 0, если у пользователя нет заказов', async () => {
            const testUser = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });

            try {
                const orderCount = await repository.getUserOrderCount(
                    testUser.id,
                    1,
                );

                expect(orderCount).toBe(0);
            } finally {
                await UserModel.destroy({ where: { id: testUser.id } });
            }
        });

        it('должен вернуть 1 для одного заказа', async () => {
            const testUser = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });

            try {
                await OrderModel.create({
                    name: 'Test User',
                    email: 'test@example.com',
                    phone: '+79991234567',
                    address: 'Test Address',
                    amount: 10000,
                    status: 1,
                    user_id: testUser.id,
                    tenant_id: 1,
                });

                const orderCount = await repository.getUserOrderCount(
                    testUser.id,
                    1,
                );

                expect(orderCount).toBe(1);
            } finally {
                await OrderModel.destroy({
                    where: { user_id: testUser.id, tenant_id: 1 },
                });
                await UserModel.destroy({ where: { id: testUser.id } });
            }
        });

        it('должен вернуть количество нескольких заказов', async () => {
            const testUser = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });

            try {
                await OrderModel.bulkCreate([
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: 10000,
                        status: 1,
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: 20000,
                        status: 1,
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: 15000,
                        status: 1,
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                ]);

                const orderCount = await repository.getUserOrderCount(
                    testUser.id,
                    1,
                );

                expect(orderCount).toBe(3);
            } finally {
                await OrderModel.destroy({
                    where: { user_id: testUser.id, tenant_id: 1 },
                });
                await UserModel.destroy({ where: { id: testUser.id } });
            }
        });

        it('должен учитывать только заказы конкретного тенанта', async () => {
            const testUser = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });

            try {
                await OrderModel.bulkCreate([
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: 10000,
                        status: 1,
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: 20000,
                        status: 1,
                        user_id: testUser.id,
                        tenant_id: 2,
                    },
                ]);

                const orderCount = await repository.getUserOrderCount(
                    testUser.id,
                    1,
                );

                expect(orderCount).toBe(1);
            } finally {
                await OrderModel.destroy({
                    where: { user_id: testUser.id },
                });
                await UserModel.destroy({ where: { id: testUser.id } });
            }
        });

        it('должен учитывать только заказы конкретного пользователя', async () => {
            const testUser1 = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });
            const testUser2 = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });

            try {
                await OrderModel.bulkCreate([
                    {
                        name: 'Test User 1',
                        email: 'test1@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: 10000,
                        status: 1,
                        user_id: testUser1.id,
                        tenant_id: 1,
                    },
                    {
                        name: 'Test User 1',
                        email: 'test1@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: 20000,
                        status: 1,
                        user_id: testUser1.id,
                        tenant_id: 1,
                    },
                    {
                        name: 'Test User 2',
                        email: 'test2@example.com',
                        phone: '+79991234568',
                        address: 'Test Address',
                        amount: 15000,
                        status: 1,
                        user_id: testUser2.id,
                        tenant_id: 1,
                    },
                ]);

                const orderCount1 = await repository.getUserOrderCount(
                    testUser1.id,
                    1,
                );
                const orderCount2 = await repository.getUserOrderCount(
                    testUser2.id,
                    1,
                );

                expect(orderCount1).toBe(2);
                expect(orderCount2).toBe(1);
            } finally {
                await OrderModel.destroy({
                    where: {
                        user_id: [testUser1.id, testUser2.id],
                        tenant_id: 1,
                    },
                });
                await UserModel.destroy({
                    where: { id: [testUser1.id, testUser2.id] },
                });
            }
        });

        it('должен учитывать заказы с разными статусами', async () => {
            const testUser = await TestDataFactory.createUserInDB(sequelize, {
                tenantId: 1,
            });

            try {
                await OrderModel.bulkCreate([
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: 10000,
                        status: 1, // PENDING
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: 20000,
                        status: 2, // COMPLETED
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                    {
                        name: 'Test User',
                        email: 'test@example.com',
                        phone: '+79991234567',
                        address: 'Test Address',
                        amount: 15000,
                        status: 3, // CANCELLED
                        user_id: testUser.id,
                        tenant_id: 1,
                    },
                ]);

                const orderCount = await repository.getUserOrderCount(
                    testUser.id,
                    1,
                );

                expect(orderCount).toBe(3);
            } finally {
                await OrderModel.destroy({
                    where: { user_id: testUser.id, tenant_id: 1 },
                });
                await UserModel.destroy({ where: { id: testUser.id } });
            }
        });
    });
});
