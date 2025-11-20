import { UserModel } from '@app/domain/models';
import { TenantContext } from '@app/infrastructure/common/context';
import { UserSearchRepository } from '@app/infrastructure/repositories/user/user-search.repository';
import { INestApplication } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { TestDataFactory } from '../../utils/test-data-factory';

describe('UserSearchRepository (integration)', () => {
    let app: INestApplication;
    let repository: UserSearchRepository;
    let sequelize: Sequelize;
    let tenantContext: TenantContext;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [SequelizeModule.forFeature([UserModel])],
            providers: [
                UserSearchRepository,
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

        repository = moduleFixture.get<UserSearchRepository>(
            UserSearchRepository,
        );
        tenantContext = moduleFixture.get<TenantContext>(TenantContext);
        sequelize = moduleFixture.get<Sequelize>(Sequelize);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('searchUsersByName', () => {
        let testUser: UserModel;

        beforeEach(async () => {
            // Создаём тестового пользователя
            testUser = await TestDataFactory.createUserInDB({
                firstName: 'Иван',
                lastName: 'Петров',
                email: `ivan.petrov.${Date.now()}@test.com`,
                password: 'Password123!',
                tenantId: 1,
            });
        });

        afterEach(async () => {
            // Очищаем тестовые данные
            if (testUser) {
                await UserModel.destroy({ where: { id: testUser.id } });
            }
        });

        it('должен найти пользователя по имени', async () => {
            const result = await repository.searchUsersByName('Иван', 1, 10);

            expect(result.data.length).toBeGreaterThanOrEqual(1);
            expect(
                result.data.find((u) => u.id === testUser.id),
            ).toBeDefined();
            expect(result.meta.currentPage).toBe(1);
            expect(result.meta.limit).toBe(10);
        });

        it('должен найти пользователя по фамилии', async () => {
            const result = await repository.searchUsersByName('Петров', 1, 10);

            expect(result.data.length).toBeGreaterThanOrEqual(1);
            expect(
                result.data.find((u) => u.id === testUser.id),
            ).toBeDefined();
        });

        it('должен экранировать wildcard символы в поиске', async () => {
            // Создаём пользователя с % в имени
            const userWithWildcard = await TestDataFactory.createUserInDB({
                firstName: 'Test%User',
                lastName: 'Wildcard',
                email: `wildcard.${Date.now()}@test.com`,
                password: 'Password123!',
                tenantId: 1,
            });

            try {
                // Поиск по "Test%User" должен найти только этого пользователя
                const result = await repository.searchUsersByName(
                    'Test%User',
                    1,
                    10,
                );

                // Должен найти пользователя с точным совпадением
                const found = result.data.find(
                    (u) => u.id === userWithWildcard.id,
                );
                expect(found).toBeDefined();
                expect(found?.firstName).toBe('Test%User');
            } finally {
                await UserModel.destroy({ where: { id: userWithWildcard.id } });
            }
        });

        it('должен вернуть пустой результат при отсутствии совпадений', async () => {
            const result = await repository.searchUsersByName(
                'НесуществующееИмя12345',
                1,
                10,
            );

            expect(result.data.length).toBe(0);
            expect(result.meta.totalCount).toBe(0);
        });
    });

    describe('findUserByPhone', () => {
        let testUser: UserModel;

        beforeEach(async () => {
            testUser = await TestDataFactory.createUserInDB({
                firstName: 'Тест',
                lastName: 'Телефон',
                email: `phone.test.${Date.now()}@test.com`,
                password: 'Password123!',
                phone: '+79991234567',
                tenantId: 1,
            });
        });

        afterEach(async () => {
            if (testUser) {
                await UserModel.destroy({ where: { id: testUser.id } });
            }
        });

        it('должен найти пользователя по точному номеру телефона', async () => {
            const result = await repository.findUserByPhone('+79991234567');

            expect(result).toBeDefined();
            expect(result?.id).toBe(testUser.id);
            expect(result?.phone).toBe('+79991234567');
        });

        it('должен вернуть null при отсутствии пользователя', async () => {
            const result = await repository.findUserByPhone('+70000000000');

            expect(result).toBeNull();
        });
    });

    describe('findInactiveUsers', () => {
        let inactiveUser: UserModel;

        beforeEach(async () => {
            // Создаём пользователя с lastLoginAt = null (никогда не логинился)
            inactiveUser = await TestDataFactory.createUserInDB({
                firstName: 'Неактивный',
                lastName: 'Пользователь',
                email: `inactive.${Date.now()}@test.com`,
                password: 'Password123!',
                tenantId: 1,
            });

            // Обнуляем lastLoginAt
            await UserModel.update(
                { lastLoginAt: null },
                { where: { id: inactiveUser.id } },
            );
        });

        afterEach(async () => {
            if (inactiveUser) {
                await UserModel.destroy({ where: { id: inactiveUser.id } });
            }
        });

        it('должен найти пользователей без логина (lastLoginAt = null)', async () => {
            const result = await repository.findInactiveUsers(90, 1, 10);

            expect(result.data.length).toBeGreaterThanOrEqual(1);
            const found = result.data.find((u) => u.id === inactiveUser.id);
            expect(found).toBeDefined();
            expect(found?.lastLoginAt).toBeNull();
        });
    });

    describe('findUsersWithIncompleteProfile', () => {
        let incompleteUser: UserModel;

        beforeEach(async () => {
            incompleteUser = await TestDataFactory.createUserInDB({
                firstName: 'Неполный',
                lastName: 'Профиль',
                email: `incomplete.${Date.now()}@test.com`,
                password: 'Password123!',
                tenantId: 1,
            });

            // Устанавливаем isProfileCompleted = false
            await UserModel.update(
                { isProfileCompleted: false },
                { where: { id: incompleteUser.id } },
            );
        });

        afterEach(async () => {
            if (incompleteUser) {
                await UserModel.destroy({ where: { id: incompleteUser.id } });
            }
        });

        it('должен найти пользователей с неполным профилем', async () => {
            const result =
                await repository.findUsersWithIncompleteProfile(1, 10);

            expect(result.data.length).toBeGreaterThanOrEqual(1);
            const found = result.data.find((u) => u.id === incompleteUser.id);
            expect(found).toBeDefined();
            expect(found?.isProfileCompleted).toBe(false);
        });
    });
});


