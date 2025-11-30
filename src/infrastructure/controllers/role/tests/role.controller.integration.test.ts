// Устанавливаем переменные окружения для тестов ДО импорта модулей
process.env.NODE_ENV = 'test';
// Минимальные переменные для тестового запуска (подхватываются Joi)
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.COOKIE_PARSER_SECRET_KEY = 'test_cookie_secret';
process.env.JWT_PRIVATE_KEY =
    '9EDFE1DC70282FA9699F8472366EA194948DC526524B6462D05624086435165D';
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.JWT_ACCESS_EXPIRES = '5m';
process.env.JWT_REFRESH_EXPIRES = '1h';

import type { UserRoleInfo } from '@app/infrastructure/responses/role/user-roles.response';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Sequelize } from 'sequelize-typescript';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestDataFactory } from '../../../../../tests/utils';

describe('RoleController (integration)', () => {
    let app: INestApplication | null = null;
    let isAppInitialized = false;

    // Токены для разных ролей
    let adminToken: string;
    let managerToken: string;
    let customerToken: string;

    beforeAll(async () => {
        try {
            app = await setupTestApp();
            isAppInitialized = true;

            // Создаём пользователей с разными ролями для тестов
            const adminUser = await TestDataFactory.createUserWithRole(
                app,
                'TENANT_ADMIN',
            );
            adminToken = adminUser.token;

            const managerUser = await TestDataFactory.createUserWithRole(
                app,
                'MANAGER',
            );
            managerToken = managerUser.token;

            const customerUser = await TestDataFactory.createUserWithRole(
                app,
                'CUSTOMER',
            );
            customerToken = customerUser.token;
        } catch (error) {
            console.error('❌ [beforeAll] Failed to setup test app:', error);
            app = null;
            isAppInitialized = false;
            throw error;
        }
    }, 60000); // Увеличиваем таймаут до 60 секунд для подключения к БД

    afterAll(async () => {
        // Ждём немного, чтобы вложенные afterAll успели выполниться
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Защита от undefined и null
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
                // Игнорируем ошибки при закрытии, если app уже закрыт
                console.warn('Error closing app in afterAll:', error);
            } finally {
                app = null;
                isAppInitialized = false;
            }
        }
    }, 30000); // Таймаут для закрытия приложения

    afterEach(async () => {
        // Cleanup: удаляем тестовые роли и связи
        // Защита от undefined и null
        if (
            !isAppInitialized ||
            app === null ||
            app === undefined ||
            typeof app !== 'object' ||
            typeof app.get !== 'function'
        ) {
            return; // Пропускаем cleanup, если app не инициализирован
        }
        try {
            const sequelize = app.get(Sequelize);
            if (!sequelize) {
                return; // Пропускаем, если Sequelize недоступен
            }
            await sequelize.query(
                `DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE tenant_id = 1 AND is_system_role = 0)`,
            );
            await sequelize.query(
                `DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE tenant_id = 1 AND is_system_role = 0)`,
            );
            await sequelize.query(
                `DELETE FROM roles WHERE tenant_id = 1 AND is_system_role = 0`,
            );
        } catch (error) {
            // Игнорируем ошибки cleanup, если app уже закрыт или БД недоступна
            console.warn('Error in afterEach cleanup:', error);
        }
    });

    // ========================================================================
    // CRUD ОПЕРАЦИИ С РОЛЯМИ (ADMIN_ROLES)
    // ========================================================================

    describe('POST /role/create', () => {
        it('201: создаёт новую роль (ADMIN)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const dto = {
                role: 'TEST_ROLE',
                description: 'Тестовая роль',
                level: 45,
                isSystemRole: false,
            };

            const response = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(dto)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('role', 'TEST_ROLE');
            expect(response.body).toHaveProperty(
                'description',
                'Тестовая роль',
            );
            expect(response.body).toHaveProperty('level', 45);
        });

        it('400: валидация - отсутствует обязательное поле role', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    description: 'Роль без названия',
                })
                .expect(400);
        });

        it('403: MANAGER не может создавать роли', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    role: 'MANAGER_ROLE',
                    description: 'Попытка создать роль',
                })
                .expect(403);
        });

        it('401: требуется авторизация', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .post('/online-store/role/create')
                .send({
                    role: 'UNAUTHORIZED_ROLE',
                    description: 'Попытка без авторизации',
                })
                .expect(401);
        });

        it('409: роль с таким названием уже существует', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const dto = {
                role: 'DUPLICATE_ROLE',
                description: 'Роль для теста дублирования',
                level: 30,
                isSystemRole: false,
            };

            // Создаём роль первый раз
            await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(dto)
                .expect(201);

            // Пытаемся создать роль с тем же названием
            const response = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(dto)
                .expect(409);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('уже существует');
        });
    });

    describe('GET /role/one/:role', () => {
        it('200: получает роль по названию (ADMIN)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Сначала создаём роль
            const createResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'GET_TEST_ROLE',
                    description: 'Роль для теста получения',
                    level: 50,
                    isSystemRole: false,
                })
                .expect(201);

            const roleName = createResponse.body.role;

            // Получаем роль
            const response = await request(app.getHttpServer())
                .get(`/online-store/role/one/${roleName}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('role', roleName);
            expect(response.body).toHaveProperty('description');
        });

        it('404: роль не найдена', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/one/NONEXISTENT_ROLE')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('403: MANAGER не может получать роли', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/one/ADMIN')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(403);
        });
    });

    describe('GET /role/list', () => {
        it('200: получает список ролей (ADMIN)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/list')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('role');
        });

        it('403: MANAGER не может получать список ролей', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/list')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(403);
        });
    });

    describe('PATCH /role/:id', () => {
        it('200: обновляет роль (ADMIN)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём роль
            const createResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'UPDATE_TEST_ROLE',
                    description: 'Исходное описание',
                    level: 40,
                    isSystemRole: false,
                })
                .expect(201);

            const roleId = createResponse.body.id;

            // Обновляем роль
            const response = await request(app.getHttpServer())
                .patch(`/online-store/role/${roleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    description: 'Обновлённое описание',
                })
                .expect(200);

            expect(response.body).toHaveProperty('id', roleId);
            expect(response.body).toHaveProperty(
                'description',
                'Обновлённое описание',
            );
        });

        it('404: роль не найдена', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .patch('/online-store/role/99999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    description: 'Попытка обновить несуществующую роль',
                })
                .expect(404);
        });
    });

    describe('DELETE /role/:id', () => {
        it('200: удаляет роль (ADMIN)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём роль
            const createResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'DELETE_TEST_ROLE',
                    description: 'Роль для удаления',
                    level: 35,
                    isSystemRole: false,
                })
                .expect(201);

            const roleId = createResponse.body.id;

            // Удаляем роль
            await request(app.getHttpServer())
                .delete(`/online-store/role/${roleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // Проверяем, что роль удалена
            await request(app.getHttpServer())
                .get(`/online-store/role/one/DELETE_TEST_ROLE`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('404: роль не найдена', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .delete('/online-store/role/99999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });

    // ========================================================================
    // УПРАВЛЕНИЕ РАЗРЕШЕНИЯМИ РОЛЕЙ (ADMIN_ROLES)
    // ========================================================================

    describe('POST /role/permissions/assign', () => {
        it('201: назначает разрешение роли (ADMIN)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём роль
            const createResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'PERMISSION_TEST_ROLE',
                    description: 'Роль для теста разрешений',
                    level: 50,
                    isSystemRole: false,
                })
                .expect(201);

            const roleId = createResponse.body.id;

            // Назначаем разрешение
            const response = await request(app.getHttpServer())
                .post('/online-store/role/permissions/assign')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    roleId,
                    resource: 'products',
                    action: 'read',
                })
                .expect(201);

            expect(response.body).toHaveProperty('permissionId');
            expect(response.body).toHaveProperty('roleId', roleId);
            expect(response.body).toHaveProperty('resource', 'products');
            expect(response.body).toHaveProperty('action', 'read');
        });

        it('404: роль не найдена', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .post('/online-store/role/permissions/assign')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    roleId: 99999,
                    resource: 'products',
                    action: 'read',
                })
                .expect(404);
        });

        it('403: MANAGER не может назначать разрешения', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .post('/online-store/role/permissions/assign')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    roleId: 1,
                    resource: 'products',
                    action: 'read',
                })
                .expect(403);
        });

        it('409: разрешение уже назначено этой роли', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём роль для теста
            const createRoleResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'PERMISSION_DUPLICATE_ROLE',
                    description: 'Роль для теста дублирования разрешений',
                    level: 40,
                    isSystemRole: false,
                })
                .expect(201);

            const roleId = createRoleResponse.body.id;

            // Назначаем разрешение первый раз
            await request(app.getHttpServer())
                .post('/online-store/role/permissions/assign')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    roleId,
                    resource: 'orders',
                    action: 'create',
                })
                .expect(201);

            // Пытаемся назначить то же разрешение повторно
            const response = await request(app.getHttpServer())
                .post('/online-store/role/permissions/assign')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    roleId,
                    resource: 'orders',
                    action: 'create',
                })
                .expect(409);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('уже назначено');
        });
    });

    describe('DELETE /role/permissions/revoke', () => {
        it('200: отзывает разрешение у роли (ADMIN)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём роль и назначаем разрешение
            const createResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'REVOKE_PERMISSION_ROLE',
                    description: 'Роль для теста отзыва разрешений',
                    level: 50,
                    isSystemRole: false,
                })
                .expect(201);

            const roleId = createResponse.body.id;

            // Назначаем разрешение
            await request(app.getHttpServer())
                .post('/online-store/role/permissions/assign')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    roleId,
                    resource: 'products',
                    action: 'write',
                })
                .expect(201);

            // Отзываем разрешение
            const response = await request(app.getHttpServer())
                .delete('/online-store/role/permissions/revoke')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    roleId,
                    resource: 'products',
                    action: 'write',
                })
                .expect(200);

            expect(response.body).toHaveProperty('message');
        });

        it('404: роль не найдена', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .delete('/online-store/role/permissions/revoke')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    roleId: 99999,
                    resource: 'products',
                    action: 'read',
                })
                .expect(404);
        });
    });

    describe('GET /role/permissions/:roleId', () => {
        it('200: получает разрешения роли (MANAGER)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём роль и назначаем разрешения
            const createResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'GET_PERMISSIONS_ROLE',
                    description: 'Роль для теста получения разрешений',
                    level: 50,
                    isSystemRole: false,
                })
                .expect(201);

            const roleId = createResponse.body.id;

            // Назначаем несколько разрешений
            await request(app.getHttpServer())
                .post('/online-store/role/permissions/assign')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    roleId,
                    resource: 'products',
                    action: 'read',
                })
                .expect(201);

            // Получаем разрешения
            const response = await request(app.getHttpServer())
                .get(`/online-store/role/permissions/${roleId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            expect(Array.isArray(response.body.permissions)).toBe(true);
            expect(response.body.permissions.length).toBeGreaterThan(0);
        });

        it('403: CUSTOMER не может получать разрешения', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/permissions/1')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);
        });
    });

    // ========================================================================
    // НАЗНАЧЕНИЕ РОЛЕЙ ПОЛЬЗОВАТЕЛЯМ (MANAGER_ROLES)
    // ========================================================================

    describe('POST /role/assign', () => {
        it('201: назначает роль пользователю (MANAGER)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём роль
            const createRoleResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'ASSIGN_TO_USER_ROLE',
                    description: 'Роль для назначения пользователю',
                    level: 30,
                    isSystemRole: false,
                    isActive: true, // Явно устанавливаем активность
                })
                .expect(201);

            const roleId = createRoleResponse.body.id;

            // Создаём пользователя
            const user = await TestDataFactory.createUserWithRole(
                app,
                'CUSTOMER',
            );

            // Назначаем роль
            const response = await request(app.getHttpServer())
                .post('/online-store/role/assign')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    userId: user.userId,
                    roleId,
                });

            expect(response.status).toBe(201);

            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('userId', user.userId);
            expect(response.body).toHaveProperty('roleId', roleId);
        });

        it('404: роль не найдена', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const user = await TestDataFactory.createUserWithRole(
                app,
                'CUSTOMER',
            );

            await request(app.getHttpServer())
                .post('/online-store/role/assign')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    userId: user.userId,
                    roleId: 99999,
                })
                .expect(404);
        });

        it('403: CUSTOMER не может назначать роли', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .post('/online-store/role/assign')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    userId: 1,
                    roleId: 1,
                })
                .expect(403);
        });

        it('409: роль уже назначена пользователю', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём роль
            const createRoleResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'DUPLICATE_ASSIGN_ROLE',
                    description: 'Роль для теста дублирования назначения',
                    level: 35,
                    isSystemRole: false,
                    isActive: true,
                })
                .expect(201);

            const roleId = createRoleResponse.body.id;

            // Создаём пользователя
            const user = await TestDataFactory.createUserWithRole(
                app,
                'CUSTOMER',
            );

            // Назначаем роль первый раз
            await request(app.getHttpServer())
                .post('/online-store/role/assign')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    userId: user.userId,
                    roleId,
                })
                .expect(201);

            // Пытаемся назначить ту же роль повторно
            const response = await request(app.getHttpServer())
                .post('/online-store/role/assign')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    userId: user.userId,
                    roleId,
                })
                .expect(409);

            expect(response.body).toHaveProperty(
                'message',
                'Роль уже назначена этому пользователю',
            );
        });

        // ========================================
        // 🔬 SAAS-017-14.3: Advanced Scenarios
        // ========================================

        it('201: назначение роли с metadata', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём роль
            const createRoleResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: `METADATA_ROLE_${randomUUID().substring(0, 8)}`,
                    description: 'Роль для теста metadata',
                    level: 25,
                    isSystemRole: false,
                    isActive: true,
                })
                .expect(201);

            const roleId = createRoleResponse.body.id;

            // Создаём пользователя
            const user = await TestDataFactory.createUserWithRole(
                app,
                'CUSTOMER',
            );

            // Назначаем роль с metadata
            const metadata = {
                reason: 'Повышение до старшего сотрудника',
                department: 'Отдел продаж',
                approvedBy: 'Иван Иванов',
                requestId: 'REQ-12345',
            };

            const response = await request(app.getHttpServer())
                .post('/online-store/role/assign')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    userId: user.userId,
                    roleId,
                    metadata,
                });

            // Проверка результата
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('userId', user.userId);
            expect(response.body).toHaveProperty('roleId', roleId);

            // Проверяем что metadata сохранилась через GET /role/user/:userId
            const getUserRolesResponse = await request(app.getHttpServer())
                .get(`/online-store/role/user/${user.userId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            // Находим назначенную роль
            const assignedRole = getUserRolesResponse.body.roles.find(
                (r: UserRoleInfo) => r.roleId === roleId,
            );
            expect(assignedRole).toBeDefined();
            expect(assignedRole.metadata).toEqual(metadata);
        });

        it('201: назначение временной роли (expiresAt)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём роль
            const createRoleResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: `TEMP_ROLE_${randomUUID().substring(0, 8)}`,
                    description: 'Роль для теста expiresAt',
                    level: 28,
                    isSystemRole: false,
                    isActive: true,
                })
                .expect(201);

            const roleId = createRoleResponse.body.id;

            // Создаём пользователя
            const user = await TestDataFactory.createUserWithRole(
                app,
                'CUSTOMER',
            );

            // Дата истечения: через 1 год
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            const expiresAtISO = expiresAt.toISOString();

            // Назначаем временную роль
            const response = await request(app.getHttpServer())
                .post('/online-store/role/assign')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    userId: user.userId,
                    roleId,
                    expiresAt: expiresAtISO,
                });

            // Проверка результата
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('userId', user.userId);
            expect(response.body).toHaveProperty('roleId', roleId);

            // Проверяем что expiresAt сохранилась через GET /role/user/:userId
            const getUserRolesResponse = await request(app.getHttpServer())
                .get(`/online-store/role/user/${user.userId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            // Находим назначенную роль
            const assignedRole = getUserRolesResponse.body.roles.find(
                (r: UserRoleInfo) => r.roleId === roleId,
            );
            expect(assignedRole).toBeDefined();
            expect(assignedRole.expiresAt).toBeDefined();
            // Проверяем что дата близка к ожидаемой (разница < 5 секунд)
            const expiresAtDate = new Date(assignedRole.expiresAt);
            const diff = Math.abs(
                expiresAtDate.getTime() - expiresAt.getTime(),
            );
            expect(diff).toBeLessThan(5000); // 5 секунд
        });

        it('403: CUSTOMER не может назначать роли (проверка RoleGuard)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // ВАЖНО: Этот тест проверяет блокировку RoleGuard, а не логику иерархии в сервисе.
            // CUSTOMER не имеет роли MANAGER_ROLES, поэтому RoleGuard блокирует запрос
            // ДО того, как проверка иерархии в RoleService будет выполнена.
            // Для проверки логики иерархии нужен токен с MANAGER_ROLES, но низким level.

            // Создаём роль с высоким уровнем (выше чем у CUSTOMER)
            const createRoleResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: `HIGH_LEVEL_ROLE_${randomUUID().substring(0, 8)}`,
                    description: 'Роль с высоким уровнем для теста guard',
                    level: 40,
                    isSystemRole: false,
                    isActive: true,
                })
                .expect(201);

            const roleId = createRoleResponse.body.id;

            // Создаём пользователя
            const user = await TestDataFactory.createUserWithRole(
                app,
                'CUSTOMER',
            );

            // CUSTOMER пытается назначить роль → RoleGuard блокирует (403: Forbidden resource)
            const response = await request(app.getHttpServer())
                .post('/online-store/role/assign')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    userId: user.userId,
                    roleId,
                });

            // RoleGuard блокирует доступ до проверки иерархии в сервисе
            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('statusCode', 403);
        });

        it('201: назначение роли с metadata и expiresAt', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём роль
            const createRoleResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: `COMBO_ROLE_${randomUUID().substring(0, 8)}`,
                    description: 'Роль для теста metadata + expiresAt',
                    level: 32,
                    isSystemRole: false,
                    isActive: true,
                })
                .expect(201);

            const roleId = createRoleResponse.body.id;

            // Создаём пользователя
            const user = await TestDataFactory.createUserWithRole(
                app,
                'CUSTOMER',
            );

            // Дата истечения: через 6 месяцев
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 6);
            const expiresAtISO = expiresAt.toISOString();

            // Metadata
            const metadata = {
                reason: 'Временное повышение на период проекта',
                project: 'Проект Альфа',
                supervisor: 'Петр Петров',
            };

            // Назначаем роль с metadata и expiresAt
            const response = await request(app.getHttpServer())
                .post('/online-store/role/assign')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    userId: user.userId,
                    roleId,
                    metadata,
                    expiresAt: expiresAtISO,
                });

            // Проверка результата
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('userId', user.userId);
            expect(response.body).toHaveProperty('roleId', roleId);

            // Проверяем что metadata и expiresAt сохранились через GET
            const getUserRolesResponse = await request(app.getHttpServer())
                .get(`/online-store/role/user/${user.userId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            // Находим назначенную роль
            const assignedRole = getUserRolesResponse.body.roles.find(
                (r: UserRoleInfo) => r.roleId === roleId,
            );
            expect(assignedRole).toBeDefined();
            expect(assignedRole.metadata).toEqual(metadata);
            expect(assignedRole.expiresAt).toBeDefined();

            // Проверяем дату
            const expiresAtDate = new Date(assignedRole.expiresAt);
            const diff = Math.abs(
                expiresAtDate.getTime() - expiresAt.getTime(),
            );
            expect(diff).toBeLessThan(5000);
        });
    });

    describe('DELETE /role/revoke', () => {
        it('200: отзывает роль у пользователя (MANAGER)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём роль и назначаем пользователю
            const createRoleResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'REVOKE_FROM_USER_ROLE',
                    description: 'Роль для отзыва у пользователя',
                    level: 30,
                    isSystemRole: false,
                    isActive: true, // Явно устанавливаем активность
                })
                .expect(201);

            const roleId = createRoleResponse.body.id;
            const user = await TestDataFactory.createUserWithRole(
                app,
                'CUSTOMER',
            );

            // Назначаем роль
            const assignResponse = await request(app.getHttpServer())
                .post('/online-store/role/assign')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    userId: user.userId,
                    roleId,
                });

            expect(assignResponse.status).toBe(201);

            // Отзываем роль
            const response = await request(app.getHttpServer())
                .delete('/online-store/role/revoke')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    userId: user.userId,
                    roleId,
                });

            expect(response.status).toBe(200);

            expect(response.body).toHaveProperty('message');
        });

        it('404: роль не найдена', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const user = await TestDataFactory.createUserWithRole(
                app,
                'CUSTOMER',
            );

            const response = await request(app.getHttpServer())
                .delete('/online-store/role/revoke')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    userId: user.userId,
                    roleId: 99999,
                });

            expect(response.status).toBe(404);
        });
    });

    describe('GET /role/user/:userId', () => {
        it('200: получает роли пользователя (MANAGER)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const user = await TestDataFactory.createUserWithRole(
                app,
                'CUSTOMER',
            );

            const response = await request(app.getHttpServer())
                .get(`/online-store/role/user/${user.userId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            expect(Array.isArray(response.body.roles)).toBe(true);
        });

        it('403: CUSTOMER не может получать роли пользователей', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/user/1')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);
        });
    });

    // ========================================================================
    // ПРОСМОТР ИЕРАРХИИ РОЛЕЙ (MANAGER_ROLES)
    // ========================================================================

    describe('GET /role/hierarchy', () => {
        it('200: получает иерархию ролей (MANAGER)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/hierarchy')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('systemRoles');
            expect(response.body).toHaveProperty('tenantRoles');
            expect(response.body).toHaveProperty('customerRoles');
            expect(response.body).toHaveProperty('totalCount');
        });

        it('403: CUSTOMER не может получать иерархию', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/hierarchy')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);
        });
    });

    describe('GET /role/level/:role', () => {
        it('200: получает уровень роли (MANAGER)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/level/TENANT_ADMIN')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('role', 'TENANT_ADMIN');
            expect(response.body).toHaveProperty('level');
            expect(response.body).toHaveProperty('category');
        });

        it('403: CUSTOMER не может получать уровень роли', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/level/ADMIN')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);
        });
    });

    // ========================================================================
    // EDGE CASES ТЕСТЫ
    // ========================================================================

    describe('⚠️ Edge Cases', () => {
        describe('POST /role/create - Валидация', () => {
            it('400: пустое название роли', async () => {
                if (!isAppInitialized || !app) {
                    throw new Error('App is not initialized');
                }

                const response = await request(app.getHttpServer())
                    .post('/online-store/role/create')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        role: '', // Пустая строка
                        description: 'Роль с пустым названием',
                        level: 30,
                        isSystemRole: false,
                    });

                expect(response.status).toBe(400);
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body[0]).toHaveProperty('messages');
                const messages = response.body[0].messages.join(' ');
                expect(messages).toContain('название');
            });

            it('400: название роли только из пробелов', async () => {
                if (!isAppInitialized || !app) {
                    throw new Error('App is not initialized');
                }

                const response = await request(app.getHttpServer())
                    .post('/online-store/role/create')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        role: '    ', // Только пробелы
                        description: 'Роль с пробелами',
                        level: 30,
                        isSystemRole: false,
                    });

                expect(response.status).toBe(400);
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body[0]).toHaveProperty('messages');
                const messages = response.body[0].messages.join(' ');
                expect(messages).toContain('символы');
            });

            it('400: слишком длинное название роли (>100 символов)', async () => {
                if (!isAppInitialized || !app) {
                    throw new Error('App is not initialized');
                }

                const longRoleName = 'A'.repeat(101); // 101 символ

                const response = await request(app.getHttpServer())
                    .post('/online-store/role/create')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        role: longRoleName,
                        description: 'Роль с длинным названием',
                        level: 30,
                        isSystemRole: false,
                    })
                    .expect(400);

                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body[0]).toHaveProperty('messages');
                const messages = response.body[0].messages.join(' ');
                expect(messages).toContain('100');
            });

            it('400: слишком длинное описание роли (>200 символов)', async () => {
                if (!isAppInitialized || !app) {
                    throw new Error('App is not initialized');
                }

                const longDescription = 'Описание '.repeat(25); // >200 символов

                const response = await request(app.getHttpServer())
                    .post('/online-store/role/create')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        role: 'LONG_DESCRIPTION_ROLE',
                        description: longDescription,
                        level: 30,
                        isSystemRole: false,
                    })
                    .expect(400);

                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body[0]).toHaveProperty('messages');
                const messages = response.body[0].messages.join(' ');
                expect(messages).toContain('200');
            });
        });

        describe('PATCH /role/:id - Валидация и системные роли', () => {
            it('400: невалидный level (отрицательное значение)', async () => {
                if (!isAppInitialized || !app) {
                    throw new Error('App is not initialized');
                }

                // Создаём роль
                const createResponse = await request(app.getHttpServer())
                    .post('/online-store/role/create')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        role: 'NEGATIVE_LEVEL_ROLE',
                        description: 'Роль для теста отрицательного уровня',
                        level: 30,
                        isSystemRole: false,
                    })
                    .expect(201);

                const roleId = createResponse.body.id;

                // Пытаемся обновить с отрицательным level
                const response = await request(app.getHttpServer())
                    .patch(`/online-store/role/${roleId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        level: -1, // Отрицательный уровень
                    })
                    .expect(400);

                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body[0]).toHaveProperty('messages');
                const messages = response.body[0].messages.join(' ');
                expect(messages).toContain('0');
            });

            it('400: невалидный level (превышение максимума)', async () => {
                if (!isAppInitialized || !app) {
                    throw new Error('App is not initialized');
                }

                // Создаём роль
                const createResponse = await request(app.getHttpServer())
                    .post('/online-store/role/create')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        role: 'EXCEEDS_MAX_LEVEL_ROLE',
                        description: 'Роль для теста превышения уровня',
                        level: 30,
                        isSystemRole: false,
                    })
                    .expect(201);

                const roleId = createResponse.body.id;

                // Пытаемся обновить с level > 100
                const response = await request(app.getHttpServer())
                    .patch(`/online-store/role/${roleId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        level: 101, // Превышение максимума
                    })
                    .expect(400);

                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body[0]).toHaveProperty('messages');
                const messages = response.body[0].messages.join(' ');
                expect(messages).toContain('100');
            });

            it('403/409: обновление системной роли из tenant контекста запрещено', async () => {
                if (!isAppInitialized || !app) {
                    throw new Error('App is not initialized');
                }

                // Создаём системную роль (SUPER_ADMIN может создавать системные роли)
                // Получаем SUPER_ADMIN токен
                const superAdminUser = await TestDataFactory.createUserWithRole(
                    app,
                    'SUPER_ADMIN',
                );

                // Уникальное имя роли с UUID
                const uniqueRoleName = `SYS_TEST_${randomUUID().substring(0, 8)}`;

                const createSystemRoleResponse = await request(
                    app.getHttpServer(),
                )
                    .post('/online-store/role/create')
                    .set('Authorization', `Bearer ${superAdminUser.token}`)
                    .send({
                        role: uniqueRoleName,
                        description: 'Системная роль для теста',
                        level: 90,
                        isSystemRole: true, // Системная роль
                        tenantId: null,
                    });

                expect(createSystemRoleResponse.status).toBe(201);
                const systemRoleId = createSystemRoleResponse.body.id;

                // Пытаемся обновить системную роль от имени tenant admin
                const patchResponse = await request(app.getHttpServer())
                    .patch(`/online-store/role/${systemRoleId}`)
                    .set('Authorization', `Bearer ${adminToken}`) // Tenant admin
                    .send({
                        description: 'Попытка изменить системную роль',
                    });

                // Проверяем что обновление запрещено (403 или 409)
                // 403 - если guard блокирует доступ
                // 409 - если service проверяет системную роль и возвращает конфликт
                expect([403, 409]).toContain(patchResponse.status);
            });
        });

        describe('POST /role/assign - Валидация и неактивные роли', () => {
            it('400: невалидный expiresAt (прошедшая дата)', async () => {
                if (!isAppInitialized || !app) {
                    throw new Error('App is not initialized');
                }

                // Создаём роль
                const createRoleResponse = await request(app.getHttpServer())
                    .post('/online-store/role/create')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        role: 'PAST_EXPIRY_ROLE',
                        description: 'Роль для теста прошедшей даты',
                        level: 30,
                        isSystemRole: false,
                        isActive: true,
                    })
                    .expect(201);

                const roleId = createRoleResponse.body.id;

                // Создаём пользователя
                const user = await TestDataFactory.createUserWithRole(
                    app,
                    'CUSTOMER',
                );

                // Пытаемся назначить роль с прошедшей датой
                const response = await request(app.getHttpServer())
                    .post('/online-store/role/assign')
                    .set('Authorization', `Bearer ${managerToken}`)
                    .send({
                        userId: user.userId,
                        roleId,
                        expiresAt: '2020-01-01T00:00:00Z', // Прошлое
                    })
                    .expect(400);

                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body[0]).toHaveProperty('messages');
                const messages = response.body[0].messages.join(' ');
                expect(messages).toContain('прошлом');
            });

            it('400: невалидный формат expiresAt', async () => {
                if (!isAppInitialized || !app) {
                    throw new Error('App is not initialized');
                }

                // Создаём роль
                const createRoleResponse = await request(app.getHttpServer())
                    .post('/online-store/role/create')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        role: 'INVALID_DATE_FORMAT_ROLE',
                        description:
                            'Роль для теста неправильного формата даты',
                        level: 30,
                        isSystemRole: false,
                        isActive: true,
                    })
                    .expect(201);

                const roleId = createRoleResponse.body.id;

                // Создаём пользователя
                const user = await TestDataFactory.createUserWithRole(
                    app,
                    'CUSTOMER',
                );

                // Пытаемся назначить роль с неправильным форматом даты
                const response = await request(app.getHttpServer())
                    .post('/online-store/role/assign')
                    .set('Authorization', `Bearer ${managerToken}`)
                    .send({
                        userId: user.userId,
                        roleId,
                        expiresAt: '31-12-2025', // Неправильный формат
                    })
                    .expect(400);

                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body[0]).toHaveProperty('messages');
                const messages = response.body[0].messages.join(' ');
                expect(messages).toContain('ISO');
            });

            it('400: назначение неактивной роли', async () => {
                if (!isAppInitialized || !app) {
                    throw new Error('App is not initialized');
                }

                // Создаём неактивную роль
                const createRoleResponse = await request(app.getHttpServer())
                    .post('/online-store/role/create')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        role: 'INACTIVE_ASSIGN_ROLE',
                        description: 'Неактивная роль для теста назначения',
                        level: 30,
                        isSystemRole: false,
                        isActive: false, // Неактивная
                    })
                    .expect(201);

                const roleId = createRoleResponse.body.id;

                // Создаём пользователя
                const user = await TestDataFactory.createUserWithRole(
                    app,
                    'CUSTOMER',
                );

                // Пытаемся назначить неактивную роль
                const response = await request(app.getHttpServer())
                    .post('/online-store/role/assign')
                    .set('Authorization', `Bearer ${managerToken}`)
                    .send({
                        userId: user.userId,
                        roleId,
                    })
                    .expect(400);

                expect(response.body.message).toContain('неактивн');
            });
        });
    });

    // ========================================================================
    // TENANT ISOLATION ТЕСТЫ
    // ========================================================================

    describe('🔒 Tenant Isolation', () => {
        let tenant2AdminToken: string;
        let tenant2RoleId: number;

        beforeAll(async () => {
            // Защита от undefined и null
            if (
                !isAppInitialized ||
                app === null ||
                app === undefined ||
                typeof app !== 'object'
            ) {
                throw new Error(
                    'App is not initialized. Main beforeAll must have failed.',
                );
            }

            // Создаём админа для tenant 2
            const sequelize = app.get(Sequelize);
            const tenant2Admin = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    role: 'TENANT_ADMIN',
                    tenantId: 2,
                },
            );
            tenant2AdminToken = await TestDataFactory.loginUser(
                app,
                tenant2Admin.email,
                tenant2Admin.password,
            );

            // Создаём роль в tenant 1
            await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    role: 'TENANT1_ROLE',
                    description: 'Роль tenant 1',
                    level: 40,
                    isSystemRole: false,
                })
                .expect(201);

            // Создаём роль в tenant 2
            const tenant2Role = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${tenant2AdminToken}`)
                .send({
                    role: 'TENANT2_ROLE',
                    description: 'Роль tenant 2',
                    level: 40,
                    isSystemRole: false,
                })
                .expect(201);
            tenant2RoleId = tenant2Role.body.id;
        });

        afterAll(async () => {
            // Cleanup tenant 2 ролей
            // Проверяем isAppInitialized из родительского scope
            // Защита от undefined и null
            if (
                !isAppInitialized ||
                app === null ||
                app === undefined ||
                typeof app !== 'object' ||
                typeof app.get !== 'function'
            ) {
                return; // Пропускаем cleanup, если app не инициализирован
            }
            try {
                const sequelize = app.get(Sequelize);
                if (!sequelize) {
                    return; // Пропускаем, если Sequelize недоступен
                }
                await sequelize.query(
                    `DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE tenant_id = 2 AND is_system_role = 0)`,
                );
                await sequelize.query(
                    `DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE tenant_id = 2 AND is_system_role = 0)`,
                );
                await sequelize.query(
                    `DELETE FROM roles WHERE tenant_id = 2 AND is_system_role = 0`,
                );
            } catch (error) {
                // Игнорируем ошибки cleanup, если app уже закрыт или БД недоступна
                console.warn(
                    'Error in tenant isolation afterAll cleanup:',
                    error,
                );
            }
        }, 30000); // Таймаут для cleanup

        it('🔒 SECURITY: tenant 1 admin не может получить роль tenant 2', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Пытаемся получить роль tenant 2 из tenant 1
            await request(app.getHttpServer())
                .get(`/online-store/role/one/TENANT2_ROLE`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('🔒 SECURITY: tenant 2 admin не может получить роль tenant 1', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Пытаемся получить роль tenant 1 из tenant 2
            await request(app.getHttpServer())
                .get(`/online-store/role/one/TENANT1_ROLE`)
                .set('Authorization', `Bearer ${tenant2AdminToken}`)
                .expect(404);
        });

        it('🔒 SECURITY: tenant 1 admin не может обновить роль tenant 2', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .patch(`/online-store/role/${tenant2RoleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: 'Попытка обновления' })
                .expect(404);
        });

        it('🔒 SECURITY: tenant 1 admin не может удалить роль tenant 2', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .delete(`/online-store/role/${tenant2RoleId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });

        it('🔒 SECURITY: список ролей возвращает только роли своего тенанта + системные', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/list')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const roles = response.body as Array<{
                role: string;
                tenantId: number | null;
                isSystemRole: boolean;
            }>;

            // Проверяем, что все роли либо системные, либо из tenant 1
            roles.forEach((role) => {
                if (!role.isSystemRole) {
                    expect(role.tenantId).toBe(1);
                }
            });

            // Проверяем, что нет ролей из tenant 2
            const tenant2Roles = roles.filter(
                (role) => role.tenantId === 2 && !role.isSystemRole,
            );
            expect(tenant2Roles.length).toBe(0);
        });
    });
});
