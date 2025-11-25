import { UserModel } from '@app/domain/models';
import { TenantContext } from '@app/infrastructure/common/context';
import { MetricsCollector } from '@app/infrastructure/common/services';
import { UserBulkRepository } from '@app/infrastructure/repositories/user/user-bulk.repository';
import { INestApplication } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { TestDataFactory } from '../../utils/test-data-factory';

describe('UserBulkRepository (integration)', () => {
    let app: INestApplication;
    let repository: UserBulkRepository;
    let metricsCollector: MetricsCollector;
    let sequelize: Sequelize;
    let tenantContext: TenantContext;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [SequelizeModule.forFeature([UserModel])],
            providers: [
                UserBulkRepository,
                MetricsCollector,
                {
                    provide: TenantContext,
                    useValue: {
                        getTenantId: jest.fn().mockReturnValue(1),
                        getTenantIdOrNull: jest.fn().mockReturnValue(1),
                    },
                },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        repository = moduleFixture.get<UserBulkRepository>(UserBulkRepository);
        metricsCollector = moduleFixture.get<MetricsCollector>(
            MetricsCollector,
        );
        tenantContext = moduleFixture.get<TenantContext>(TenantContext);
        sequelize = moduleFixture.get<Sequelize>(Sequelize);
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        // Сбрасываем метрики перед каждым тестом
        metricsCollector.reset();
    });

    describe('bulkActivateUsers', () => {
        let testUsers: Array<{
            id: number;
            userId: number;
            email: string;
            password: string;
        }>;

        beforeEach(async () => {
            // Создаём 3 неактивных пользователей
            testUsers = await Promise.all([
                TestDataFactory.createUserInDB(sequelize, {
                    firstName: 'Bulk1',
                    lastName: 'User',
                    email: `bulk1.${Date.now()}@test.com`,
                    password: 'Password123!',
                    tenantId: 1,
                }),
                TestDataFactory.createUserInDB(sequelize, {
                    firstName: 'Bulk2',
                    lastName: 'User',
                    email: `bulk2.${Date.now()}@test.com`,
                    password: 'Password123!',
                    tenantId: 1,
                }),
                TestDataFactory.createUserInDB(sequelize, {
                    firstName: 'Bulk3',
                    lastName: 'User',
                    email: `bulk3.${Date.now()}@test.com`,
                    password: 'Password123!',
                    tenantId: 1,
                }),
            ]);

            // Деактивируем всех
            await UserModel.update(
                { isActive: false },
                { where: { id: testUsers.map((u) => u.id) } },
            );
        });

        afterEach(async () => {
            if (testUsers && testUsers.length > 0) {
                await UserModel.destroy({
                    where: { id: testUsers.map((u) => u.id) },
                });
            }
        });

        it('должен активировать нескольких пользователей', async () => {
            const userIds = testUsers.map((u) => u.id);

            const affectedCount =
                await repository.bulkActivateUsers(userIds);

            expect(affectedCount).toBe(3);

            // Проверяем, что пользователи действительно активированы
            const updatedUsers = await UserModel.findAll({
                where: { id: userIds },
            });

            updatedUsers.forEach((user) => {
                expect(user.isActive).toBe(true);
            });
        });

        it('должен записать метрики после активации', async () => {
            const userIds = testUsers.map((u) => u.id);

            await repository.bulkActivateUsers(userIds);

            // Получаем метрики
            const metrics = metricsCollector.getMetrics();

            expect(metrics.totalBulkOperations).toBeGreaterThanOrEqual(1);
            expect(metrics.bulkOperationsByType.bulkActivateUsers).toBe(1);
            expect(metrics.avgBulkOperationTime).toBeGreaterThan(0);
        });

        it('должен соблюдать tenant isolation', async () => {
            // Создаём пользователя в другом tenant
            const otherTenantUser = await TestDataFactory.createUserInDB(sequelize, {
                firstName: 'OtherTenant',
                lastName: 'User',
                email: `other.tenant.${Date.now()}@test.com`,
                password: 'Password123!',
                tenantId: 2, // Другой tenant
            });

            try {
                await UserModel.update(
                    { isActive: false },
                    { where: { id: otherTenantUser.id } },
                );

                // Пытаемся активировать пользователя из другого tenant
                const affectedCount = await repository.bulkActivateUsers([
                    otherTenantUser.id,
                ]);

                // Не должно быть изменений (tenant isolation)
                expect(affectedCount).toBe(0);

                // Проверяем, что пользователь остался неактивным
                const user = await UserModel.findByPk(otherTenantUser.id);
                expect(user?.isActive).toBe(false);
            } finally {
                await UserModel.destroy({
                    where: { id: otherTenantUser.id },
                });
            }
        });
    });

    describe('bulkBlockUsers', () => {
        let testUsers: Array<{
            id: number;
            userId: number;
            email: string;
            password: string;
        }>;

        beforeEach(async () => {
            testUsers = await Promise.all([
                TestDataFactory.createUserInDB(sequelize, {
                    firstName: 'Block1',
                    lastName: 'User',
                    email: `block1.${Date.now()}@test.com`,
                    password: 'Password123!',
                    tenantId: 1,
                }),
                TestDataFactory.createUserInDB(sequelize, {
                    firstName: 'Block2',
                    lastName: 'User',
                    email: `block2.${Date.now()}@test.com`,
                    password: 'Password123!',
                    tenantId: 1,
                }),
            ]);

            // Разблокируем всех
            await UserModel.update(
                { isBlocked: false },
                { where: { id: testUsers.map((u) => u.id) } },
            );
        });

        afterEach(async () => {
            if (testUsers && testUsers.length > 0) {
                await UserModel.destroy({
                    where: { id: testUsers.map((u) => u.id) },
                });
            }
        });

        it('должен заблокировать нескольких пользователей', async () => {
            const userIds = testUsers.map((u) => u.id);

            const affectedCount = await repository.bulkBlockUsers(userIds);

            expect(affectedCount).toBe(2);

            // Проверяем блокировку
            const updatedUsers = await UserModel.findAll({
                where: { id: userIds },
            });

            updatedUsers.forEach((user) => {
                expect(user.isBlocked).toBe(true);
            });
        });
    });

    describe('bulkDeleteUsers', () => {
        let testUsers: Array<{
            id: number;
            userId: number;
            email: string;
            password: string;
        }>;

        beforeEach(async () => {
            testUsers = await Promise.all([
                TestDataFactory.createUserInDB(sequelize, {
                    firstName: 'Delete1',
                    lastName: 'User',
                    email: `delete1.${Date.now()}@test.com`,
                    password: 'Password123!',
                    tenantId: 1,
                }),
            ]);
        });

        afterEach(async () => {
            if (testUsers && testUsers.length > 0) {
                await UserModel.destroy({
                    where: { id: testUsers.map((u) => u.id) },
                    force: true, // Hard delete для очистки после теста
                });
            }
        });

        it('должен выполнить soft delete пользователей', async () => {
            const userIds = testUsers.map((u) => u.id);

            const affectedCount = await repository.bulkDeleteUsers(userIds);

            expect(affectedCount).toBe(1);

            // Проверяем soft delete
            const updatedUsers = await UserModel.findAll({
                where: { id: userIds },
            });

            updatedUsers.forEach((user) => {
                expect(user.isDeleted).toBe(true);
            });
        });
    });
});


