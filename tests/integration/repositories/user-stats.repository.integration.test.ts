import { UserModel } from '@app/domain/models';
import { TenantContext } from '@app/infrastructure/common/context';
import { UserStatsRepository } from '@app/infrastructure/repositories/user/user-stats.repository';
import { INestApplication } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { TestDataFactory } from '../../utils/test-data-factory';

describe('UserStatsRepository (integration)', () => {
    let app: INestApplication;
    let repository: UserStatsRepository;
    let sequelize: Sequelize;
    let tenantContext: TenantContext;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [SequelizeModule.forFeature([UserModel])],
            providers: [
                UserStatsRepository,
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

        repository = moduleFixture.get<UserStatsRepository>(
            UserStatsRepository,
        );
        tenantContext = moduleFixture.get<TenantContext>(TenantContext);
        sequelize = moduleFixture.get<Sequelize>(Sequelize);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('getUserStats', () => {
        it('должен вернуть статистику пользователей', async () => {
            const result = await repository.getUserStats();

            expect(result).toBeDefined();
            expect(result.totalUsers).toBeGreaterThanOrEqual(0);
            expect(result.activeUsers).toBeGreaterThanOrEqual(0);
            expect(result.blockedUsers).toBeGreaterThanOrEqual(0);
            expect(result.verifiedUsers).toBeGreaterThanOrEqual(0);
            expect(result.premiumUsers).toBeGreaterThanOrEqual(0);
            expect(result.vipUsers).toBeGreaterThanOrEqual(0);

            // Проверяем процентные соотношения
            expect(result.activeUsersPercentage).toBeGreaterThanOrEqual(0);
            expect(result.activeUsersPercentage).toBeLessThanOrEqual(100);
        });

        it('должен корректно считать активных пользователей', async () => {
            // Создаём 2 тестовых пользователя
            const user1 = await TestDataFactory.createUserInDB({
                firstName: 'Активный1',
                lastName: 'Юзер',
                email: `active1.${Date.now()}@test.com`,
                password: 'Password123!',
                tenantId: 1,
            });

            const user2 = await TestDataFactory.createUserInDB({
                firstName: 'Активный2',
                lastName: 'Юзер',
                email: `active2.${Date.now()}@test.com`,
                password: 'Password123!',
                tenantId: 1,
            });

            // Устанавливаем isActive = true
            await UserModel.update(
                { isActive: true },
                { where: { id: [user1.id, user2.id] } },
            );

            try {
                const result = await repository.getUserStats();

                expect(result.activeUsers).toBeGreaterThanOrEqual(2);
            } finally {
                await UserModel.destroy({
                    where: { id: [user1.id, user2.id] },
                });
            }
        });
    });

    describe('getUserActivityStats', () => {
        it('должен вернуть статистику активности пользователей', async () => {
            const result = await repository.getUserActivityStats();

            expect(result).toBeDefined();
            expect(result.activeIn24h).toBeGreaterThanOrEqual(0);
            expect(result.activeIn7d).toBeGreaterThanOrEqual(0);
            expect(result.activeIn30d).toBeGreaterThanOrEqual(0);
            expect(result.neverLoggedIn).toBeGreaterThanOrEqual(0);
        });
    });
});


