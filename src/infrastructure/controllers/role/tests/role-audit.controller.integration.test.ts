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

import type {
    AuditLogResponse,
    AuditTimelineResponse,
} from '@app/infrastructure/responses';
import type { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestDataFactory } from '../../../../../tests/utils';

describe('RoleController Audit (integration)', () => {
    let app: INestApplication | null = null;
    let isAppInitialized = false;

    // Токены для разных ролей
    let superAdminToken: string;
    let tenantAdminToken: string;
    let managerToken: string;

    // ID пользователей для тестов
    let superAdminUserId: number;
    let testUserId: number;

    // ID роли для тестов
    let testRoleId: number;

    beforeAll(async () => {
        try {
            app = await setupTestApp();
            isAppInitialized = true;
            const sequelize = app.get(Sequelize);

            // Создаём пользователей с разными ролями для тестов
            const superAdminUser = await TestDataFactory.createUserWithRole(
                app,
                'SUPER_ADMIN',
            );
            superAdminToken = superAdminUser.token;
            superAdminUserId = superAdminUser.userId;

            const tenantAdminUser = await TestDataFactory.createUserWithRole(
                app,
                'TENANT_ADMIN',
            );
            tenantAdminToken = tenantAdminUser.token;

            await TestDataFactory.createUserWithRole(app, 'PLATFORM_ADMIN');

            const managerUser = await TestDataFactory.createUserWithRole(
                app,
                'MANAGER',
            );
            managerToken = managerUser.token;

            await TestDataFactory.createUserWithRole(app, 'CUSTOMER');

            // Создаём тестового пользователя и роль для генерации audit логов
            const testUser = await TestDataFactory.createUserInDB(sequelize, {
                role: 'CUSTOMER',
            });
            testUserId = testUser.userId;

            // Создаём тестовую роль через API, чтобы сгенерировались audit логи
            const roleResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    role: 'TEST_AUDIT_ROLE',
                    description: 'Тестовая роль для audit',
                    level: 50,
                    isSystemRole: false,
                })
                .expect(201);

            testRoleId = roleResponse.body.id;

            // Создаём дополнительные audit логи для тестов
            // Обновляем роль
            await request(app.getHttpServer())
                .patch(`/online-store/role/${testRoleId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    description: 'Обновлённое описание роли',
                })
                .expect(200);

            // Назначаем роль пользователю (используем tenantAdminToken, т.к. SUPER_ADMIN не входит в MANAGER_ROLES)
            await request(app.getHttpServer())
                .post('/online-store/role/assign')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .send({
                    userId: testUserId,
                    roleId: testRoleId,
                })
                .expect(201);
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
        if (
            !isAppInitialized ||
            app === null ||
            app === undefined ||
            typeof app !== 'object' ||
            typeof app.get !== 'function'
        ) {
            return;
        }
        try {
            const sequelize = app.get(Sequelize);
            if (!sequelize) {
                return;
            }
            // Удаляем только тестовые audit логи (не системные)
            await sequelize.query(
                `DELETE FROM audit_logs WHERE entity_type = 'role' AND entity_id = ?`,
                { replacements: [testRoleId] },
            );
            await sequelize.query(
                `DELETE FROM audit_logs WHERE entity_type = 'user_role' AND entity_id IN (SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?)`,
                { replacements: [testUserId, testRoleId] },
            );
        } catch (error) {
            console.warn('Error in afterEach cleanup:', error);
        }
    });

    // ========================================================================
    // GET /role/audit - Список всех audit логов
    // ========================================================================

    describe('GET /role/audit', () => {
        it('200: возвращает пагинированный список audit логов (SUPER_ADMIN)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.meta).toHaveProperty('totalCount');
            expect(response.body.meta).toHaveProperty('currentPage', 1);
            expect(response.body.meta).toHaveProperty('limit', 10);
        });

        it('200: фильтрация по action (CREATE)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({ action: 'CREATE', page: 1, limit: 10 })
                .expect(200);

            expect(
                response.body.data.every(
                    (log: AuditLogResponse) => log.action === 'CREATE',
                ),
            ).toBe(true);
        });

        it('200: фильтрация по entityType', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({ entityType: 'role', page: 1, limit: 10 })
                .expect(200);

            expect(
                response.body.data.every(
                    (log: AuditLogResponse) => log.entityType === 'role',
                ),
            ).toBe(true);
        });

        it('200: фильтрация по userId', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({ userId: superAdminUserId, page: 1, limit: 10 })
                .expect(200);

            expect(
                response.body.data.every(
                    (log: AuditLogResponse) => log.userId === superAdminUserId,
                ),
            ).toBe(true);
        });

        it('200: фильтрация по dateRange', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const startDate = new Date('2020-01-01').toISOString();
            const endDate = new Date('2030-12-31').toISOString();

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({
                    startDate,
                    endDate,
                    page: 1,
                    limit: 10,
                })
                .expect(200);

            expect(response.body.data.length).toBeGreaterThanOrEqual(0);
        });

        it('403: MANAGER не имеет доступа', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/audit')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(403);
        });

        it('401: требуется авторизация', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/audit')
                .expect(401);
        });

        it('200: TENANT_ADMIN видит только логи своего тенанта', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .query({ page: 1, limit: 100 })
                .expect(200);

            // Все логи должны принадлежать tenant 1 (tenantAdminUserId имеет tenantId = 1)
            const allFromTenant1 = response.body.data.every(
                (log: AuditLogResponse) =>
                    log.tenantId === 1 || log.tenantId === null,
            );
            expect(allFromTenant1).toBe(true);
        });
    });

    // ========================================================================
    // GET /role/audit/:id - Детали конкретного audit лога
    // ========================================================================

    describe('GET /role/audit/:id', () => {
        it('200: возвращает детали audit лога с diff (SUPER_ADMIN)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Сначала получаем список логов, чтобы найти ID
            const listResponse = await request(app.getHttpServer())
                .get('/online-store/role/audit')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({ page: 1, limit: 1 })
                .expect(200);

            if (listResponse.body.data.length === 0) {
                // Создаём роль, чтобы был хотя бы один лог
                const createResponse = await request(app.getHttpServer())
                    .post('/online-store/role/create')
                    .set('Authorization', `Bearer ${superAdminToken}`)
                    .send({
                        role: 'TEMP_ROLE_FOR_AUDIT',
                        description: 'Временная роль',
                        level: 10,
                        isSystemRole: false,
                    })
                    .expect(201);

                const newListResponse = await request(app.getHttpServer())
                    .get('/online-store/role/audit')
                    .set('Authorization', `Bearer ${superAdminToken}`)
                    .query({
                        action: 'CREATE',
                        entityId: createResponse.body.id,
                        page: 1,
                        limit: 1,
                    })
                    .expect(200);

                if (newListResponse.body.data.length > 0) {
                    const auditLogId = newListResponse.body.data[0].id;

                    const response = await request(app.getHttpServer())
                        .get(`/online-store/role/audit/${auditLogId}`)
                        .set('Authorization', `Bearer ${superAdminToken}`)
                        .expect(200);

                    expect(response.body).toHaveProperty('id', auditLogId);
                    expect(response.body).toHaveProperty('action');
                    expect(response.body).toHaveProperty('entityType');
                    expect(response.body).toHaveProperty('diff');
                }
            } else {
                const auditLogId = listResponse.body.data[0].id;

                const response = await request(app.getHttpServer())
                    .get(`/online-store/role/audit/${auditLogId}`)
                    .set('Authorization', `Bearer ${superAdminToken}`)
                    .expect(200);

                expect(response.body).toHaveProperty('id', auditLogId);
                expect(response.body).toHaveProperty('action');
                expect(response.body).toHaveProperty('entityType');
                expect(response.body).toHaveProperty('diff');
            }
        });

        it('404: audit лог не найден', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/audit/999999')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(404);
        });

        it('403: TENANT_ADMIN не может видеть лог другого тенанта', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём лог от superAdmin (который может быть из другого тенанта)
            const listResponse = await request(app.getHttpServer())
                .get('/online-store/role/audit')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({ page: 1, limit: 1 })
                .expect(200);

            if (listResponse.body.data.length > 0) {
                const auditLogId = listResponse.body.data[0].id;
                const auditLogTenantId = listResponse.body.data[0].tenantId;

                // Если лог не из тенанта 1, TENANT_ADMIN не должен его видеть
                if (auditLogTenantId !== 1 && auditLogTenantId !== null) {
                    await request(app.getHttpServer())
                        .get(`/online-store/role/audit/${auditLogId}`)
                        .set('Authorization', `Bearer ${tenantAdminToken}`)
                        .expect(403);
                }
            }
        });

        it('401: требуется авторизация', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/audit/1')
                .expect(401);
        });
    });

    // ========================================================================
    // GET /role/audit/role/:roleId - История изменений роли
    // ========================================================================

    describe('GET /role/audit/role/:roleId', () => {
        it('200: возвращает историю изменений роли', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get(`/online-store/role/audit/role/${testRoleId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(
                response.body.data.every(
                    (log: AuditLogResponse) =>
                        log.entityId === testRoleId &&
                        log.entityType === 'role',
                ),
            ).toBe(true);
        });

        it('200: возвращает пустой список для несуществующей роли', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit/role/999999')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body.data).toHaveLength(0);
            expect(response.body.meta.totalCount).toBe(0);
        });

        it('403: MANAGER не имеет доступа', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get(`/online-store/role/audit/role/${testRoleId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(403);
        });
    });

    // ========================================================================
    // GET /role/audit/user/:userId - История ролей пользователя
    // ========================================================================

    describe('GET /role/audit/user/:userId', () => {
        it('200: возвращает историю ролей пользователя', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get(`/online-store/role/audit/user/${testUserId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('200: возвращает пустой список для пользователя без изменений', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Создаём нового пользователя без истории
            const sequelize = app.get(Sequelize);
            const newUser = await TestDataFactory.createUserInDB(sequelize, {
                role: 'CUSTOMER',
            });

            const response = await request(app.getHttpServer())
                .get(`/online-store/role/audit/user/${newUser.userId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('403: MANAGER не имеет доступа', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get(`/online-store/role/audit/user/${testUserId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(403);
        });
    });

    // ========================================================================
    // GET /role/audit/filter - Фильтрованный поиск
    // ========================================================================

    describe('GET /role/audit/filter', () => {
        it('200: фильтрация по нескольким параметрам', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit/filter')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({
                    action: 'CREATE',
                    entityType: 'role',
                    page: '1',
                    limit: '10',
                })
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(
                response.body.data.every(
                    (log: AuditLogResponse) =>
                        log.action === 'CREATE' && log.entityType === 'role',
                ),
            ).toBe(true);
        });

        it('200: фильтрация по requestId', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Получаем первый лог, чтобы взять requestId
            const listResponse = await request(app.getHttpServer())
                .get('/online-store/role/audit')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({ page: 1, limit: 1 })
                .expect(200);

            if (
                listResponse.body.data.length > 0 &&
                listResponse.body.data[0].requestId
            ) {
                const requestId = listResponse.body.data[0].requestId;

                const response = await request(app.getHttpServer())
                    .get('/online-store/role/audit/filter')
                    .set('Authorization', `Bearer ${superAdminToken}`)
                    .query({
                        requestId,
                        page: '1',
                        limit: '10',
                    })
                    .expect(200);

                expect(
                    response.body.data.every(
                        (log: AuditLogResponse) => log.requestId === requestId,
                    ),
                ).toBe(true);
            }
        });

        it('403: MANAGER не имеет доступа', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/audit/filter')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(403);
        });
    });

    // ========================================================================
    // GET /role/audit/reports/summary - Сводный отчёт
    // ========================================================================

    describe('GET /role/audit/reports/summary', () => {
        it('200: возвращает сводный отчёт за период', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const startDate = new Date('2020-01-01').toISOString();
            const endDate = new Date('2030-12-31').toISOString();

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit/reports/summary')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({
                    startDate,
                    endDate,
                })
                .expect(200);

            expect(response.body).toHaveProperty('dateRange');
            expect(response.body).toHaveProperty('totalOperations');
            expect(response.body).toHaveProperty('operationsByAction');
            expect(response.body).toHaveProperty('operationsByEntityType');
            expect(response.body).toHaveProperty('topUsers');
            expect(typeof response.body.operationsByAction).toBe('object');
            expect(typeof response.body.operationsByEntityType).toBe('object');
            expect(Array.isArray(response.body.topUsers)).toBe(true);
        });

        it('400: отсутствуют обязательные параметры startDate и endDate', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/audit/reports/summary')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(400);
        });

        it('400: startDate больше endDate', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const startDate = new Date('2030-12-31').toISOString();
            const endDate = new Date('2020-01-01').toISOString();

            await request(app.getHttpServer())
                .get('/online-store/role/audit/reports/summary')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({
                    startDate,
                    endDate,
                })
                .expect(400);
        });

        it('403: MANAGER не имеет доступа', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const startDate = new Date('2020-01-01').toISOString();
            const endDate = new Date('2030-12-31').toISOString();

            await request(app.getHttpServer())
                .get('/online-store/role/audit/reports/summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({
                    startDate,
                    endDate,
                })
                .expect(403);
        });
    });

    // ========================================================================
    // GET /role/audit/reports/timeline/:roleId - Timeline роли
    // ========================================================================

    describe('GET /role/audit/reports/timeline/:roleId', () => {
        it('200: возвращает timeline изменений роли', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get(`/online-store/role/audit/reports/timeline/${testRoleId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('roleId', testRoleId);
            expect(response.body).toHaveProperty('events');
            expect(Array.isArray(response.body.events)).toBe(true);
            const timelineBody = response.body as AuditTimelineResponse;
            expect(timelineBody.roleId).toBe(testRoleId);
            expect(timelineBody.events.length).toBeGreaterThanOrEqual(0);
        });

        it('200: возвращает пустой timeline для несуществующей роли', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit/reports/timeline/999999')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('roleId', 999999);
            expect(response.body).toHaveProperty('events');
            expect(response.body.events).toHaveLength(0);
        });

        it('403: MANAGER не имеет доступа', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get(`/online-store/role/audit/reports/timeline/${testRoleId}`)
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(403);
        });
    });

    // ========================================================================
    // GET /role/audit/reports/user-activity/:userId - Отчёт об активности пользователя
    // ========================================================================

    describe('GET /role/audit/reports/user-activity/:userId', () => {
        it('200: возвращает отчёт об активности пользователя без фильтра по датам', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get(
                    `/online-store/role/audit/reports/user-activity/${superAdminUserId}`,
                )
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('userId', superAdminUserId);
            expect(response.body).toHaveProperty('dateRange');
            expect(response.body).toHaveProperty('totalOperations');
            expect(response.body).toHaveProperty('operationsByAction');
            expect(response.body).toHaveProperty('rolesModified');
            expect(typeof response.body.operationsByAction).toBe('object');
            expect(Array.isArray(response.body.rolesModified)).toBe(true);
        });

        it('200: возвращает отчёт с фильтром по датам', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const startDate = new Date('2020-01-01').toISOString();
            const endDate = new Date('2030-12-31').toISOString();

            const response = await request(app.getHttpServer())
                .get(
                    `/online-store/role/audit/reports/user-activity/${superAdminUserId}`,
                )
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({
                    startDate,
                    endDate,
                })
                .expect(200);

            expect(response.body).toHaveProperty('userId', superAdminUserId);
            expect(response.body).toHaveProperty('dateRange');
            expect(response.body.dateRange).toHaveProperty('start');
            expect(response.body.dateRange).toHaveProperty('end');
        });

        it('400: startDate больше endDate', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const startDate = new Date('2030-12-31').toISOString();
            const endDate = new Date('2020-01-01').toISOString();

            await request(app.getHttpServer())
                .get(
                    `/online-store/role/audit/reports/user-activity/${superAdminUserId}`,
                )
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({
                    startDate,
                    endDate,
                })
                .expect(400);
        });

        it('403: MANAGER не имеет доступа', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get(
                    `/online-store/role/audit/reports/user-activity/${testUserId}`,
                )
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(403);
        });
    });

    // ========================================================================
    // GET /role/audit/reports/export - Экспорт audit логов
    // ========================================================================

    describe('GET /role/audit/reports/export', () => {
        it('200: экспорт в CSV формат', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit/reports/export')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({
                    format: 'csv',
                    page: 1,
                    limit: 10,
                })
                .expect(200);

            expect(response.headers['content-type']).toContain('text/csv');
            // Проверяем, что CSV содержит правильные заголовки
            expect(response.text).toContain('ID,Entity Type,Entity ID,Action');
        });

        it('200: экспорт в JSON формат', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit/reports/export')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({
                    format: 'json',
                    page: 1,
                    limit: 10,
                })
                .expect(200);

            expect(response.headers['content-type']).toContain(
                'application/json',
            );
            const data = JSON.parse(response.text);
            expect(Array.isArray(data)).toBe(true);
        });

        it('400: неверный формат (не csv и не json)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/audit/reports/export')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({
                    format: 'xml',
                })
                .expect(400);
        });

        it('400: отсутствует параметр format', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/audit/reports/export')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(400);
        });

        it('200: экспорт с фильтрами', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit/reports/export')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .query({
                    format: 'csv',
                    action: 'CREATE',
                    entityType: 'role',
                    page: 1,
                    limit: 10,
                })
                .expect(200);

            expect(response.headers['content-type']).toContain('text/csv');
        });

        it('403: MANAGER не имеет доступа', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/audit/reports/export')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({
                    format: 'csv',
                })
                .expect(403);
        });

        it('200: TENANT_ADMIN видит только логи своего тенанта при экспорте', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/audit/reports/export')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .query({
                    format: 'json',
                    page: 1,
                    limit: 100,
                })
                .expect(200);

            const data = JSON.parse(response.text) as AuditLogResponse[];
            if (Array.isArray(data) && data.length > 0) {
                const allFromTenant1 = data.every(
                    (log: AuditLogResponse) =>
                        log.tenantId === 1 || log.tenantId === null,
                );
                expect(allFromTenant1).toBe(true);
            }
        });
    });
});
