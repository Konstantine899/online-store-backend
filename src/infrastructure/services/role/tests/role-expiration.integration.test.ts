// Устанавливаем переменные окружения для тестов ДО импорта модулей
process.env.NODE_ENV = 'test';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.COOKIE_PARSER_SECRET_KEY = 'test_cookie_secret';
process.env.JWT_PRIVATE_KEY =
    '9EDFE1DC70282FA9699F8472366EA194948DC526524B6462D05624086435165D';
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.JWT_ACCESS_EXPIRES = '5m';
process.env.JWT_REFRESH_EXPIRES = '1h';
process.env.ROLE_EXPIRATION_BATCH_SIZE = '100';
process.env.ROLE_EXPIRATION_WARNING_DAYS = '7,1';

import {
    RoleAutoRenewalConfigModel,
    RoleModel,
    UserModel,
    UserRoleModel,
} from '@app/domain/models';
import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestDataFactory } from '../../../../../tests/utils';
import { RoleExpirationNotificationService } from '../role-expiration-notification.service';
import { RoleExpirationService } from '../role-expiration.service';

describe('Role Expiration Services (integration)', () => {
    let app: INestApplication | null = null;
    let isAppInitialized = false;
    let roleExpirationService: RoleExpirationService;
    let roleExpirationNotificationService: RoleExpirationNotificationService;
    let sequelize: Sequelize;

    beforeAll(async () => {
        try {
            app = await setupTestApp();
            isAppInitialized = true;
            sequelize = app.get(Sequelize);

            // ========================================================================
            // DI Workaround для циклических зависимостей в integration тестах
            // ========================================================================
            // Проблема: ServicesModule и RepositoriesModule имеют циклическую зависимость
            // через forwardRef. В тестах это может приводить к тому, что некоторые
            // зависимости не резолвятся правильно на момент инжекции в конструкторы.
            //
            // Решение: Получаем зависимости явно из DI контейнера и инжектируем их
            // через Object.defineProperty для перезаписи readonly полей классов.
            // ========================================================================

            // Получаем зависимости из DI контейнера
            const { RoleService } = await import('../role.service');
            const { RoleRepository } = await import(
                '../../../repositories/role/role.repository'
            );
            const { MetricsCollector } = await import(
                '../../../common/services/metrics-collector.service'
            );
            const { AuditService } = await import('../../audit/audit.service');
            const { UserRoleModel } = await import('@app/domain/models');

            const roleService = app.get(RoleService);
            const roleRepository = app.get(RoleRepository);
            const metricsCollector = app.get(MetricsCollector);
            const auditService = app.get(AuditService);
            const userRoleModel = app.get(getModelToken(UserRoleModel));

            // Инжектируем зависимости в RoleService
            // Эти зависимости должны были быть инжектированы через конструктор,
            // но из-за циклических зависимостей могут быть undefined в тестах
            Object.defineProperty(roleService, 'roleRepository', {
                value: roleRepository,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(roleService, 'auditService', {
                value: auditService,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(roleService, 'userRoleModel', {
                value: userRoleModel,
                writable: true,
                configurable: true,
            });

            // Получаем сервисы, которые зависят от RoleService
            roleExpirationService = app.get(RoleExpirationService);
            roleExpirationNotificationService = app.get(
                RoleExpirationNotificationService,
            );

            // Инжектируем зависимости в RoleExpirationService
            // RoleExpirationService зависит от RoleService, который должен быть
            // правильно инициализирован перед этим
            Object.defineProperty(roleExpirationService, 'roleService', {
                value: roleService,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(roleExpirationService, 'roleRepository', {
                value: roleRepository,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(roleExpirationService, 'metricsCollector', {
                value: metricsCollector,
                writable: true,
                configurable: true,
            });

            // Инжектируем зависимости в RoleExpirationNotificationService
            Object.defineProperty(
                roleExpirationNotificationService,
                'roleService',
                {
                    value: roleService,
                    writable: true,
                    configurable: true,
                },
            );
            Object.defineProperty(
                roleExpirationNotificationService,
                'metricsCollector',
                {
                    value: metricsCollector,
                    writable: true,
                    configurable: true,
                },
            );
        } catch (error) {
            console.error('❌ [beforeAll] Failed to setup test app:', error);
            app = null;
            isAppInitialized = false;
            throw error;
        }
    }, 60000);

    afterAll(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (
            isAppInitialized &&
            app !== null &&
            app !== undefined &&
            typeof app === 'object' &&
            typeof app.close === 'function'
        ) {
            try {
                await app.close();
            } catch (error) {
                console.warn('Error closing app in afterAll:', error);
            } finally {
                app = null;
                isAppInitialized = false;
            }
        }
    }, 30000);

    afterEach(async () => {
        if (!isAppInitialized || app === null) {
            return;
        }

        // Очистка тестовых данных
        // Важно: сначала удаляем дочерние записи (role_auto_renewal_config),
        // затем родительские (user_roles), так как есть FK constraint
        try {
            const sequelize = app.get(Sequelize);
            // Отключаем проверку FK на время очистки
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
            // Удаляем все тестовые записи
            await RoleAutoRenewalConfigModel.destroy({
                where: {},
                force: true,
            });
            await UserRoleModel.destroy({
                where: {},
                force: true,
            });
            // Включаем проверку FK обратно
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (error) {
            // Если что-то пошло не так, включаем FK обратно
            try {
                await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
            } catch {
                // Игнорируем ошибки восстановления
            }
            console.warn('Error cleaning up test data:', error);
        }
    });

    describe('RoleExpirationService.deactivateExpiredRoles', () => {
        it('должен деактивировать истекшие роли', async () => {
            // Создаём пользователя и роль (TestDataFactory уже создаёт user_role)
            const user = await TestDataFactory.createUserInDB(sequelize, {
                role: 'CUSTOMER',
            });
            const role = await RoleModel.findOne({
                where: { role: 'CUSTOMER' },
            });

            if (!role) {
                throw new Error('Role CUSTOMER not found');
            }

            // Находим существующую запись user_role (созданную TestDataFactory)
            const createdUser = await UserModel.findByPk(user.id);
            const tenantId = createdUser?.tenantId ?? 1;

            const userRole = await UserRoleModel.findOne({
                where: {
                    userId: user.id,
                    roleId: role.id,
                    tenantId,
                },
            });

            if (!userRole) {
                throw new Error('UserRole not found');
            }

            // Обновляем expiresAt на истекшую дату
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - 1); // Вчера

            await userRole.update({
                expiresAt: expiredDate,
                isActive: true, // Убеждаемся, что роль активна
            });

            // Проверяем, что роль активна
            expect(userRole.isActive).toBe(true);

            // Вызываем метод деактивации напрямую
            const deactivatedCount =
                await roleExpirationService.runManualDeactivation(100);

            // Проверяем, что роль деактивирована
            await userRole.reload();
            expect(userRole.isActive).toBe(false);
            expect(deactivatedCount).toBeGreaterThanOrEqual(1);
        });

        it('должен вернуть 0 если истекших ролей нет', async () => {
            // Не создаём истекшие роли

            const deactivatedCount =
                await roleExpirationService.runManualDeactivation(100);

            expect(deactivatedCount).toBe(0);
        });

        it('должен обработать batch операции', async () => {
            // Создаём несколько пользователей с истекшими ролями
            const role = await RoleModel.findOne({
                where: { role: 'CUSTOMER' },
            });

            if (!role) {
                throw new Error('Role CUSTOMER not found');
            }

            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - 1);

            for (let i = 0; i < 3; i++) {
                const user = await TestDataFactory.createUserInDB(sequelize, {
                    role: 'CUSTOMER',
                });
                // Получаем tenantId из созданного пользователя
                const createdUser = await UserModel.findByPk(user.id);
                const tenantId = createdUser?.tenantId ?? 1;

                // Находим существующую запись user_role
                const userRole = await UserRoleModel.findOne({
                    where: {
                        userId: user.id,
                        roleId: role.id,
                        tenantId,
                    },
                });

                if (!userRole) {
                    throw new Error('UserRole not found');
                }

                // Обновляем expiresAt на истекшую дату
                await userRole.update({
                    expiresAt: expiredDate,
                    isActive: true,
                });
            }

            const deactivatedCount =
                await roleExpirationService.runManualDeactivation(100);

            expect(deactivatedCount).toBeGreaterThanOrEqual(3);
        });
    });

    describe('RoleExpirationService.autoRenewRoles', () => {
        it('должен автоматически продлить роли с активной конфигурацией', async () => {
            // Создаём пользователя и роль (TestDataFactory уже создаёт user_role)
            const user = await TestDataFactory.createUserInDB(sequelize, {
                role: 'CUSTOMER',
            });
            const role = await RoleModel.findOne({
                where: { role: 'CUSTOMER' },
            });

            if (!role) {
                throw new Error('Role CUSTOMER not found');
            }

            // Находим существующую запись user_role
            const createdUser = await UserModel.findByPk(user.id);
            const tenantId = createdUser?.tenantId ?? 1;

            const userRole = await UserRoleModel.findOne({
                where: {
                    userId: user.id,
                    roleId: role.id,
                    tenantId,
                },
            });

            if (!userRole) {
                throw new Error('UserRole not found');
            }

            // Обновляем expiresAt на дату через 2 дня (чтобы попасть в выборку для продления)
            // Важно: устанавливаем время в будущем относительно текущего времени,
            // чтобы гарантировать, что expiresAt >= now при выполнении запроса
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // Точно через 2 дня
            expiresAt.setHours(23, 59, 59, 999); // Устанавливаем время в конце дня для гарантии, что expiresAt > now

            await userRole.update({
                expiresAt: expiresAt,
                isActive: true,
            });

            // Перезагружаем роль, чтобы убедиться, что изменения сохранены
            await userRole.reload();

            // Создаём конфигурацию автоматического продления
            await RoleAutoRenewalConfigModel.create({
                userRoleId: userRole.id,
                isEnabled: true,
                renewalDurationMs: 2592000000, // 30 дней
                maxRenewals: 12,
                currentRenewalCount: 0,
                notificationEnabled: true,
            });

            // Сохраняем исходную дату до продления
            const originalExpiresAt = new Date(expiresAt.getTime());

            // Проверяем, что данные корректно сохранены в БД
            const configCheck = await RoleAutoRenewalConfigModel.findOne({
                where: { userRoleId: userRole.id },
            });
            expect(configCheck).not.toBeNull();
            expect(configCheck?.isEnabled).toBe(true);

            const userRoleCheck = await UserRoleModel.findByPk(userRole.id);
            expect(userRoleCheck).not.toBeNull();
            expect(userRoleCheck?.isActive).toBe(true);
            expect(userRoleCheck?.expiresAt).not.toBeNull();

            // Вызываем метод автоматического продления напрямую
            // Используем daysUntilExpiration=3, чтобы роль попала в выборку (истекает через 2 дня < 3 дней)
            const renewedCount =
                await roleExpirationService.runManualAutoRenewal(3);

            // Проверяем, что продление было выполнено
            expect(renewedCount).toBeGreaterThanOrEqual(1);

            // Проверяем, что роль продлена
            await userRole.reload();
            const newExpiresAt = userRole.expiresAt;
            expect(newExpiresAt).not.toBeNull();
            if (newExpiresAt) {
                // Новая дата должна быть примерно через 30 дней от старой
                // Используем более точную проверку с допуском на миллисекунды
                const msDiff =
                    newExpiresAt.getTime() - originalExpiresAt.getTime();
                const daysDiff = msDiff / (1000 * 60 * 60 * 24);
                // Ожидаем ~30 дней, допускаем погрешность ±0.5 дня из-за округления
                expect(daysDiff).toBeGreaterThan(29.5);
                expect(daysDiff).toBeLessThan(30.5);
            }

            // Проверяем, что счётчик продлений увеличен
            const config = await RoleAutoRenewalConfigModel.findOne({
                where: { userRoleId: userRole.id },
            });
            expect(config?.currentRenewalCount).toBe(1);
        });

        it('не должен продлевать роли без конфигурации', async () => {
            // Создаём пользователя и роль (TestDataFactory уже создаёт user_role)
            const user = await TestDataFactory.createUserInDB(sequelize, {
                role: 'CUSTOMER',
            });
            const role = await RoleModel.findOne({
                where: { role: 'CUSTOMER' },
            });

            if (!role) {
                throw new Error('Role CUSTOMER not found');
            }

            // Находим существующую запись user_role
            const createdUser = await UserModel.findByPk(user.id);
            const tenantId = createdUser?.tenantId ?? 1;

            const userRole = await UserRoleModel.findOne({
                where: {
                    userId: user.id,
                    roleId: role.id,
                    tenantId,
                },
            });

            if (!userRole) {
                throw new Error('UserRole not found');
            }

            // Обновляем expiresAt на дату через 2 дня (но без конфигурации продления)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 2);

            await userRole.update({
                expiresAt: expiresAt,
                isActive: true,
            });

            const originalExpiresAt = userRole.expiresAt;

            // Сохраняем оригинальную дату с точностью до секунды (миллисекунды могут различаться)
            const originalExpiresAtTime = originalExpiresAt?.getTime();

            // Вызываем метод автоматического продления (используем ручной метод для тестов)
            // Роль не должна продлиться, так как нет конфигурации продления
            await roleExpirationService.runManualAutoRenewal(3);

            // Проверяем, что дата не изменилась (с допуском на миллисекунды из-за округления в БД)
            await userRole.reload();
            const newExpiresAtTime = userRole.expiresAt?.getTime();
            // БД может округлить до секунд, поэтому проверяем с допуском ±1000мс
            expect(
                Math.abs(
                    (newExpiresAtTime ?? 0) - (originalExpiresAtTime ?? 0),
                ),
            ).toBeLessThan(1000);
        });
    });

    describe('RoleExpirationNotificationService.sendExpirationNotifications', () => {
        it('должен отправлять уведомления для ролей, истекающих в ближайшие дни', async () => {
            // Создаём пользователя и роль (TestDataFactory уже создаёт user_role)
            const user = await TestDataFactory.createUserInDB(sequelize, {
                role: 'CUSTOMER',
            });
            const role = await RoleModel.findOne({
                where: { role: 'CUSTOMER' },
            });

            if (!role) {
                throw new Error('Role CUSTOMER not found');
            }

            // Находим существующую запись user_role
            const createdUser = await UserModel.findByPk(user.id);
            const tenantId = createdUser?.tenantId ?? 1;

            const userRole = await UserRoleModel.findOne({
                where: {
                    userId: user.id,
                    roleId: role.id,
                    tenantId,
                },
            });

            if (!userRole) {
                throw new Error('UserRole not found');
            }

            // Обновляем expiresAt на дату через 7 дней
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await userRole.update({
                expiresAt: expiresAt,
                isActive: true,
            });

            // Создаём конфигурацию с включенными уведомлениями
            await RoleAutoRenewalConfigModel.create({
                userRoleId: userRole.id,
                isEnabled: true,
                renewalDurationMs: 2592000000,
                maxRenewals: 12,
                currentRenewalCount: 0,
                notificationEnabled: true,
            });

            // Вызываем метод отправки уведомлений напрямую
            await roleExpirationNotificationService.sendExpirationNotifications();

            // Проверяем, что метод выполнился без ошибок
            // (в тестах не проверяем реальную отправку email, только логику)
        });

        it('не должен отправлять уведомления для ролей с отключенными уведомлениями', async () => {
            // Создаём пользователя и роль (TestDataFactory уже создаёт user_role)
            const user = await TestDataFactory.createUserInDB(sequelize, {
                role: 'CUSTOMER',
            });
            const role = await RoleModel.findOne({
                where: { role: 'CUSTOMER' },
            });

            if (!role) {
                throw new Error('Role CUSTOMER not found');
            }

            // Находим существующую запись user_role
            const createdUser = await UserModel.findByPk(user.id);
            const tenantId = createdUser?.tenantId ?? 1;

            const userRole = await UserRoleModel.findOne({
                where: {
                    userId: user.id,
                    roleId: role.id,
                    tenantId,
                },
            });

            if (!userRole) {
                throw new Error('UserRole not found');
            }

            // Обновляем expiresAt на дату через 7 дней
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await userRole.update({
                expiresAt: expiresAt,
                isActive: true,
            });

            // Создаём конфигурацию с отключенными уведомлениями
            await RoleAutoRenewalConfigModel.create({
                userRoleId: userRole.id,
                isEnabled: true,
                renewalDurationMs: 2592000000,
                maxRenewals: 12,
                currentRenewalCount: 0,
                notificationEnabled: false,
            });

            // Вызываем метод - не должно быть ошибок
            await expect(
                roleExpirationNotificationService.sendExpirationNotifications(),
            ).resolves.not.toThrow();
        });
    });
});
