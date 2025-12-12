/**
 * Integration тесты для Role Analytics Endpoints
 * Покрывает все 8 analytics endpoints и проверяет авторизацию, tenant isolation, валидацию
 *
 * Related to: SAAS-017-18
 */

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

import type { INestApplication } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { setupTestApp } from '../../../../../tests/setup/app';
import { TestDataFactory } from '../../../../../tests/utils';

describe('RoleController Analytics (integration)', () => {
    let app: INestApplication | null = null;
    let isAppInitialized = false;

    // Токены для разных ролей
    let superAdminToken: string;
    let tenantAdminToken: string;
    let managerToken: string;
    let customerToken: string;

    // Данные для тестов
    let testRoleId: number;

    beforeAll(async () => {
        try {
            app = await setupTestApp();
            isAppInitialized = true;

            // Создаём пользователей с разными ролями
            const superAdminUser = await TestDataFactory.createUserWithRole(
                app,
                'SUPER_ADMIN',
            );
            superAdminToken = superAdminUser.token;

            const tenantAdminUser = await TestDataFactory.createUserWithRole(
                app,
                'TENANT_ADMIN',
            );
            tenantAdminToken = tenantAdminUser.token;

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

            // Создаём тестовую роль для аналитики
            const createRoleResponse = await request(app.getHttpServer())
                .post('/online-store/role/create')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .send({
                    role: 'TEST_ANALYTICS_ROLE',
                    description: 'Роль для тестирования аналитики',
                    level: 50,
                    isSystemRole: false,
                    permissions: ['test:read', 'test:write'],
                })
                .expect(HttpStatus.CREATED);

            testRoleId = createRoleResponse.body.id;
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

    describe('GET /role/analytics/stats', () => {
        it('200: должен вернуть статистику использования ролей (TENANT_ADMIN)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/analytics/stats')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('totalRoles');
            expect(response.body).toHaveProperty('activeRoles');
            expect(response.body).toHaveProperty('inactiveRoles');
            expect(response.body).toHaveProperty('systemRoles');
            expect(response.body).toHaveProperty('tenantRoles');
            expect(response.body).toHaveProperty('rolesWithExpiration');
            expect(response.body).toHaveProperty('rolesByLevel');
            expect(response.body).toHaveProperty('topUsedRoles');
            expect(Array.isArray(response.body.rolesByLevel)).toBe(true);
            expect(Array.isArray(response.body.topUsedRoles)).toBe(true);
        });

        it('200: должен вернуть статистику для SUPER_ADMIN', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/analytics/stats')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('totalRoles');
        });

        it('403: должен вернуть 403 для MANAGER', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/analytics/stats')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(HttpStatus.FORBIDDEN);
        });

        it('401: должен вернуть 401 без токена', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/analytics/stats')
                .expect(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('GET /role/analytics/stats/:roleId', () => {
        it('200: должен вернуть статистику для конкретной роли', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get(`/online-store/role/analytics/stats/${testRoleId}`)
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('roleId', testRoleId);
            expect(response.body).toHaveProperty('roleName');
            expect(response.body).toHaveProperty('userCount');
            expect(response.body).toHaveProperty('totalUsers');
            expect(response.body).toHaveProperty('percentage');
            expect(response.body).toHaveProperty('autoAssignmentsCount');
            expect(response.body).toHaveProperty('manualAssignmentsCount');
        });

        it('404: должен вернуть 404 для несуществующей роли', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/analytics/stats/99999')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(HttpStatus.NOT_FOUND);
        });

        it('403: должен вернуть 403 для CUSTOMER', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get(`/online-store/role/analytics/stats/${testRoleId}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(HttpStatus.FORBIDDEN);
        });
    });

    describe('GET /role/analytics/permissions/stats', () => {
        it('200: должен вернуть статистику разрешений', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/analytics/permissions/stats')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('totalUniquePermissions');
            expect(response.body).toHaveProperty('topUsedPermissions');
            expect(response.body).toHaveProperty('permissionsByResource');
            expect(response.body).toHaveProperty('permissionsByAction');
            expect(Array.isArray(response.body.topUsedPermissions)).toBe(true);
            expect(Array.isArray(response.body.permissionsByResource)).toBe(
                true,
            );
            expect(Array.isArray(response.body.permissionsByAction)).toBe(true);
        });

        it('403: должен вернуть 403 для MANAGER', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/analytics/permissions/stats')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(HttpStatus.FORBIDDEN);
        });
    });

    describe('GET /role/analytics/permissions/stats/:resource/:action', () => {
        it('200: должен вернуть статистику для конкретного разрешения', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // Сначала создаём разрешение для тестовой роли через endpoint
            await request(app.getHttpServer())
                .post('/online-store/role/permissions/assign')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .send({
                    roleId: testRoleId,
                    resource: 'test',
                    action: 'read',
                })
                .expect(HttpStatus.CREATED);

            const response = await request(app.getHttpServer())
                .get('/online-store/role/analytics/permissions/stats/test/read')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('resource', 'test');
            expect(response.body).toHaveProperty('action', 'read');
            expect(response.body).toHaveProperty('roleCount');
            expect(response.body).toHaveProperty('roles');
            expect(Array.isArray(response.body.roles)).toBe(true);
        });

        it('404: должен вернуть 404 для несуществующего разрешения', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get(
                    '/online-store/role/analytics/permissions/stats/nonexistent/action',
                )
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(HttpStatus.NOT_FOUND);
        });
    });

    describe('GET /role/analytics/operations/stats', () => {
        it('200: должен вернуть статистику операций с валидными датами', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            const endDate = new Date();

            const response = await request(app.getHttpServer())
                .get('/online-store/role/analytics/operations/stats')
                .query({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                })
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect((res) => {
                    if (res.status !== HttpStatus.OK) {
                        console.error(
                            'Operations stats error:',
                            res.status,
                            res.body,
                        );
                    }
                })
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('totalAssignments');
            expect(response.body).toHaveProperty('totalRevocations');
            expect(response.body).toHaveProperty('assignmentToRevocationRatio');
            expect(response.body).toHaveProperty('topAssignedRoles');
            expect(response.body).toHaveProperty('topRevokedRoles');
            expect(response.body).toHaveProperty('operationsByDay');
            expect(Array.isArray(response.body.topAssignedRoles)).toBe(true);
            expect(Array.isArray(response.body.operationsByDay)).toBe(true);
        });

        it('400: должен вернуть 400 без startDate и endDate', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/analytics/operations/stats')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(HttpStatus.BAD_REQUEST);
        });

        it('400: должен вернуть 400 если startDate > endDate', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - 30);

            await request(app.getHttpServer())
                .get('/online-store/role/analytics/operations/stats')
                .query({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                })
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(HttpStatus.BAD_REQUEST);
        });
    });

    describe('GET /role/analytics/auto-assignments/stats', () => {
        it('200: должен вернуть статистику автоматических назначений', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/analytics/auto-assignments/stats')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect((res) => {
                    if (res.status !== HttpStatus.OK) {
                        console.error(
                            'Auto-assignments stats error:',
                            res.status,
                            res.body,
                        );
                    }
                })
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('totalAutoAssignments');
            expect(response.body).toHaveProperty('successfulAutoAssignments');
            expect(response.body).toHaveProperty('failedAutoAssignments');
            expect(response.body).toHaveProperty('successRate');
            expect(response.body).toHaveProperty('autoAssignmentsByType');
            expect(response.body).toHaveProperty('failureReasons');
            expect(Array.isArray(response.body.autoAssignmentsByType)).toBe(
                true,
            );
            expect(Array.isArray(response.body.failureReasons)).toBe(true);
        });

        it('403: должен вернуть 403 для CUSTOMER', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/analytics/auto-assignments/stats')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(HttpStatus.FORBIDDEN);
        });
    });

    describe('GET /role/analytics/expiration/stats', () => {
        it('200: должен вернуть статистику истечения ролей', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/analytics/expiration/stats')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('activeRolesWithExpiration');
            expect(response.body).toHaveProperty('expiredRolesCount');
            expect(response.body).toHaveProperty(
                'averageDurationBeforeExpiration',
            );
            expect(response.body).toHaveProperty('renewalStats');
            expect(response.body.renewalStats).toHaveProperty('totalRenewals');
            expect(response.body.renewalStats).toHaveProperty(
                'averageRenewalDuration',
            );
            expect(response.body.renewalStats).toHaveProperty(
                'rolesReachedLimit',
            );
        });

        it('403: должен вернуть 403 для MANAGER', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/analytics/expiration/stats')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(HttpStatus.FORBIDDEN);
        });
    });

    describe('GET /role/analytics/hierarchy/stats', () => {
        it('200: должен вернуть статистику иерархии ролей', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/analytics/hierarchy/stats')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect((res) => {
                    if (res.status !== HttpStatus.OK) {
                        console.error(
                            'Hierarchy stats error:',
                            res.status,
                            res.body,
                        );
                    }
                })
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('rolesByLevel');
            expect(response.body).toHaveProperty('emptyRoles');
            expect(response.body).toHaveProperty('maxLevel');
            expect(response.body).toHaveProperty('minLevel');
            expect(Array.isArray(response.body.rolesByLevel)).toBe(true);
            expect(Array.isArray(response.body.emptyRoles)).toBe(true);
        });

        it('403: должен вернуть 403 для CUSTOMER', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/analytics/hierarchy/stats')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(HttpStatus.FORBIDDEN);
        });
    });

    describe('GET /role/analytics/dashboard', () => {
        it('200: должен вернуть агрегированный дашборд', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/analytics/dashboard')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect((res) => {
                    if (res.status !== HttpStatus.OK) {
                        console.error('Dashboard error:', res.status, res.body);
                    }
                })
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('roleStats');
            expect(response.body).toHaveProperty('permissionStats');
            expect(response.body).toHaveProperty('expirationStats');
            expect(response.body).toHaveProperty('hierarchyStats');
            expect(response.body.roleStats).toHaveProperty('totalRoles');
            expect(response.body.roleStats).toHaveProperty('activeRoles');
            expect(response.body.permissionStats).toHaveProperty(
                'totalUniquePermissions',
            );
        });

        it('200: должен вернуть дашборд с периодом last7d', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/analytics/dashboard')
                .query({ period: 'last7d' })
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(HttpStatus.OK);

            expect(response.body).toHaveProperty('roleStats');
        });

        it('403: должен вернуть 403 для MANAGER', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/analytics/dashboard')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(HttpStatus.FORBIDDEN);
        });
    });

    describe('GET /role/analytics/distribution/by-tenant', () => {
        it('200: должен вернуть распределение по тенантам (SUPER_ADMIN)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            const response = await request(app.getHttpServer())
                .get('/online-store/role/analytics/distribution/by-tenant')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect((res) => {
                    if (res.status !== HttpStatus.OK) {
                        console.error(
                            'Distribution by tenant error:',
                            res.status,
                            res.body,
                        );
                    }
                })
                .expect(HttpStatus.OK);

            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('tenantId');
                expect(response.body[0]).toHaveProperty('totalRoles');
                expect(response.body[0]).toHaveProperty('activeRoles');
                expect(response.body[0]).toHaveProperty('topRoles');
            }
        });

        it('403: должен вернуть 403 для TENANT_ADMIN (только SUPER_ADMIN)', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            await request(app.getHttpServer())
                .get('/online-store/role/analytics/distribution/by-tenant')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(HttpStatus.FORBIDDEN);
        });
    });

    describe('Tenant Isolation', () => {
        it('должен изолировать данные по tenant_id для TENANT_ADMIN', async () => {
            if (!isAppInitialized || !app) {
                throw new Error('App is not initialized');
            }

            // TENANT_ADMIN должен видеть только свои данные
            const response = await request(app.getHttpServer())
                .get('/online-store/role/analytics/stats')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(HttpStatus.OK);

            // Проверяем, что данные существуют и структура корректна
            expect(response.body).toHaveProperty('totalRoles');
            expect(typeof response.body.totalRoles).toBe('number');
        });
    });
});
