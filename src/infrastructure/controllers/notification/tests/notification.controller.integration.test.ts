import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
    NotificationModel,
    NotificationStatus,
    NotificationTemplateModel,
    NotificationType,
} from '@app/domain/models';
import { NotificationService } from '@app/infrastructure/services/notification/notification.service';
import { closeAllApps, setupTestApp } from '@tests/setup/app';
import { TestDataFactory } from '@tests/utils';
import { Sequelize } from 'sequelize-typescript';

describe('NotificationController (integration)', () => {
    let app: INestApplication;
    let customerToken: string;
    let customerUserId: number;
    let managerToken: string;
    let tenantAdminToken: string;

    beforeAll(async () => {
        // БД уже инициализирована через globalSetup в jest.config.js
        app = await setupTestApp();
        const sequelize = app.get(Sequelize);

        // Создаём всех пользователей через TestDataFactory для единообразия
        const customerUser = await TestDataFactory.createUserInDB(sequelize, {
            role: 'CUSTOMER',
        });
        customerUserId = customerUser.userId;
        customerToken = await TestDataFactory.loginUser(
            app,
            customerUser.email,
            customerUser.password,
        );

        const managerUser = await TestDataFactory.createUserInDB(sequelize, {
            role: 'MANAGER',
        });
        managerToken = await TestDataFactory.loginUser(
            app,
            managerUser.email,
            managerUser.password,
        );

        const tenantAdminUser = await TestDataFactory.createUserInDB(
            sequelize,
            {
                role: 'TENANT_ADMIN',
            },
        );
        tenantAdminToken = await TestDataFactory.loginUser(
            app,
            tenantAdminUser.email,
            tenantAdminUser.password,
        );
    });

    afterAll(async () => {
        await closeAllApps();
    });

    // =====================
    // Settings Endpoints
    // =====================
    describe('Settings', () => {
        it('GET /online-store/notifications/settings returns settings (auto-created)', async () => {
            const res = await request(app.getHttpServer())
                .get('/online-store/notifications/settings')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(res.body).toEqual(
                expect.objectContaining({
                    id: expect.any(Number),
                    userId: expect.any(Number),
                    emailEnabled: expect.any(Boolean),
                    pushEnabled: expect.any(Boolean),
                    orderUpdates: expect.any(Boolean),
                    marketing: expect.any(Boolean),
                }),
            );
        });

        it('PUT /online-store/notifications/settings updates specific fields', async () => {
            const resUpdate = await request(app.getHttpServer())
                .put('/online-store/notifications/settings')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ emailEnabled: false, marketing: true })
                .expect(200);

            expect(resUpdate.body).toEqual(
                expect.objectContaining({
                    emailEnabled: false,
                    marketing: true,
                }),
            );

            const resGet = await request(app.getHttpServer())
                .get('/online-store/notifications/settings')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(resGet.body).toEqual(
                expect.objectContaining({
                    emailEnabled: false,
                    marketing: true,
                }),
            );
        });

        it('PUT /online-store/notifications/settings fails with non-boolean values', async () => {
            const res = await request(app.getHttpServer())
                .put('/online-store/notifications/settings')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ emailEnabled: 'no', pushEnabled: 'yes' })
                .expect(400);

            // Проверяем новый формат валидации (массив объектов)
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            const validationErrors = res.body as Array<{
                messages: string[];
                property: string;
            }>;
            const allMessages = validationErrors.flatMap((e) => e.messages);
            expect(allMessages.some((m) => m.includes('булев'))).toBe(true);
        });

        it('GET /settings returns 401 without token', async () => {
            await request(app.getHttpServer())
                .get('/online-store/notifications/settings')
                .set('x-tenant-id', '1')
                .expect(401);
        });

        it('GET /settings works without x-tenant-id (fallback to tenant=1 in test)', async () => {
            // В test окружении TenantMiddleware использует fallback tenant_id=1
            const res = await request(app.getHttpServer())
                .get('/online-store/notifications/settings')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(res.body).toEqual(
                expect.objectContaining({
                    id: expect.any(Number),
                    userId: expect.any(Number),
                }),
            );
        });
    });

    // =====================
    // Notifications Endpoints
    // =====================
    describe('Notifications', () => {
        let notificationId: number;

        beforeEach(async () => {
            const n = await NotificationModel.create({
                userId: customerUserId,
                tenantId: 1,
                type: NotificationType.EMAIL,
                templateName: 'test_template',
                title: 'Test',
                message: 'Msg',
                status: NotificationStatus.PENDING,
                isRead: false,
                isArchived: false,
            });
            notificationId = n.id;
        });

        afterEach(async () => {
            if (notificationId) {
                await NotificationModel.destroy({
                    where: { id: notificationId },
                    force: true,
                });
            }
        });

        it('GET /online-store/notifications returns paginated list', async () => {
            const res = await request(app.getHttpServer())
                .get('/online-store/notifications?page=1&limit=20')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(res.body).toEqual(
                expect.objectContaining({
                    data: expect.any(Array),
                    meta: expect.objectContaining({
                        totalCount: expect.any(Number),
                        currentPage: 1,
                        lastPage: expect.any(Number),
                        limit: 20,
                    }),
                }),
            );
        });

        it('GET /online-store/notifications filters by status/type and validates params', async () => {
            await request(app.getHttpServer())
                .get('/online-store/notifications?status=invalid')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(400);

            await request(app.getHttpServer())
                .get('/online-store/notifications?type=invalid')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(400);

            await request(app.getHttpServer())
                .get('/online-store/notifications?page=0&limit=200')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(400);
        });

        it('GET /online-store/notifications returns 401 without token', async () => {
            await request(app.getHttpServer())
                .get('/online-store/notifications')
                .set('x-tenant-id', '1')
                .expect(401);
        });

        it('GET /online-store/notifications/unread-count returns unread count', async () => {
            const res = await request(app.getHttpServer())
                .get('/online-store/notifications/unread-count')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(res.body).toEqual(
                expect.objectContaining({ count: expect.any(Number) }),
            );
        });

        it('PUT /online-store/notifications/:id/read marks as read', async () => {
            const res = await request(app.getHttpServer())
                .put(`/online-store/notifications/${notificationId}/read`)
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(res.body).toEqual(
                expect.objectContaining({
                    message: 'Уведомление отмечено как прочитанное',
                }),
            );
        });
    });

    // =====================
    // Templates Endpoints
    // =====================
    describe('Templates', () => {
        let templateId: number | undefined;

        afterEach(async () => {
            if (templateId) {
                await NotificationTemplateModel.destroy({
                    where: { id: templateId },
                    force: true,
                });
                templateId = undefined;
            }
        });

        it('GET /online-store/notifications/templates (manager)', async () => {
            const res = await request(app.getHttpServer())
                .get('/online-store/notifications/templates?page=1&limit=20')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);
            expect(res.body).toEqual(
                expect.objectContaining({
                    data: expect.any(Array),
                    meta: expect.any(Object),
                }),
            );
        });

        it('POST /online-store/notifications/templates creates template (manager)', async () => {
            const payload = {
                name: `test_template_${Date.now()}`,
                type: NotificationType.EMAIL,
                title: 'Title',
                message: 'Message {{var}}',
            };

            const res = await request(app.getHttpServer())
                .post('/online-store/notifications/templates')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(payload)
                .expect(201);

            templateId = res.body.id;
            expect(res.body).toEqual(
                expect.objectContaining({
                    id: expect.any(Number),
                    name: payload.name,
                    type: payload.type,
                    isActive: true,
                }),
            );
        });

        it('PUT /online-store/notifications/templates/:id updates template (manager)', async () => {
            const created = await NotificationTemplateModel.create({
                name: `upd_template_${Date.now()}`,
                type: NotificationType.EMAIL,
                title: 'Old',
                message: 'Old',
                isActive: true,
            });
            templateId = created.id;

            const res = await request(app.getHttpServer())
                .put(`/online-store/notifications/templates/${templateId}`)
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ title: 'New' })
                .expect(200);

            expect(res.body).toEqual(
                expect.objectContaining({ id: templateId, title: 'New' }),
            );
        });

        it('DELETE /online-store/notifications/templates/:id deletes template (tenant admin)', async () => {
            const created = await NotificationTemplateModel.create({
                name: `del_template_${Date.now()}`,
                type: NotificationType.EMAIL,
                title: 'Del',
                message: 'Del',
                isActive: true,
            });
            templateId = created.id;

            await request(app.getHttpServer())
                .delete(`/online-store/notifications/templates/${templateId}`)
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${tenantAdminToken}`)
                .expect(204);
        });
    });

    // =====================
    // Statistics
    // =====================
    describe('Statistics', () => {
        it('GET /online-store/notifications/statistics (manager)', async () => {
            const res = await request(app.getHttpServer())
                .get('/online-store/notifications/statistics')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${managerToken}`)
                .expect(200);

            expect(res.body).toEqual(
                expect.objectContaining({
                    totalSent: expect.any(Number),
                    totalDelivered: expect.any(Number),
                    totalRead: expect.any(Number),
                    byType: expect.any(Object),
                    byStatus: expect.any(Object),
                }),
            );
        });
    });

    // =====================
    // Tenant Isolation
    // =====================
    describe('Tenant Isolation', () => {
        let tenant1NotificationId: number;
        let tenant2NotificationId: number;
        let tenant2CustomerToken: string;
        let tenant2CustomerUserId: number;
        let sequelize: Sequelize;

        beforeAll(() => {
            sequelize = app.get(Sequelize);
        });

        beforeEach(async () => {
            // Ensure tenant 2 exists for FK integrity
            await sequelize.query(
                `INSERT IGNORE INTO tenants (id, name, subdomain, status, plan, created_at, updated_at)
                 VALUES (2, 'Second Tenant', 'second', 'active', 'basic', NOW(), NOW())`,
            );

            // Create separate user for tenant 2 to test isolation
            const tenant2User = await TestDataFactory.createUserInDB(
                sequelize,
                {
                    role: 'CUSTOMER',
                },
            );
            tenant2CustomerUserId = tenant2User.userId;
            tenant2CustomerToken = await TestDataFactory.loginUser(
                app,
                tenant2User.email,
                tenant2User.password,
            );

            // Create notification for tenant 1 (customerUserId)
            const n1 = await NotificationModel.create({
                userId: customerUserId,
                tenantId: 1,
                type: NotificationType.EMAIL,
                templateName: 'tenant1',
                title: 'T1',
                message: 'Msg1',
                status: NotificationStatus.PENDING,
                isRead: false,
                isArchived: false,
            });
            tenant1NotificationId = n1.id;

            // Create notification for tenant 2 (tenant2CustomerUserId)
            const n2 = await NotificationModel.create({
                userId: tenant2CustomerUserId,
                tenantId: 2,
                type: NotificationType.EMAIL,
                templateName: 'tenant2',
                title: 'T2',
                message: 'Msg2',
                status: NotificationStatus.PENDING,
                isRead: false,
                isArchived: false,
            });
            tenant2NotificationId = n2.id;
        });

        afterEach(async () => {
            await NotificationModel.destroy({
                where: { id: [tenant1NotificationId, tenant2NotificationId] },
                force: true,
            });
        });

        it('возвращает только уведомления своего тенанта при x-tenant-id=1', async () => {
            const res = await request(app.getHttpServer())
                .get('/online-store/notifications')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            const ids: number[] = res.body.data.map(
                (n: { id: number }) => n.id,
            );
            expect(ids).toContain(tenant1NotificationId);
            expect(ids).not.toContain(tenant2NotificationId);
        });

        it('не показывает данные другого тенанта при x-tenant-id=2', async () => {
            const res = await request(app.getHttpServer())
                .get('/online-store/notifications')
                .set('x-tenant-id', '2')
                .set('Authorization', `Bearer ${tenant2CustomerToken}`)
                .expect(200);

            const ids: number[] = res.body.data.map(
                (n: { id: number }) => n.id,
            );
            expect(ids).toContain(tenant2NotificationId);
            expect(ids).not.toContain(tenant1NotificationId);
        });
    });

    // =====================
    // Settings Blocking (sendNotification respects settings)
    // =====================
    describe('Settings Blocking', () => {
        let createdCustomerToken: string;
        let createdCustomerId: number;
        let sequelize: Sequelize;

        beforeAll(() => {
            sequelize = app.get(Sequelize);
        });

        beforeEach(async () => {
            const customer = await TestDataFactory.createUserInDB(sequelize, {
                role: 'CUSTOMER',
            });
            createdCustomerId = customer.userId;
            createdCustomerToken = await TestDataFactory.loginUser(
                app,
                customer.email,
                customer.password,
            );
        });

        it('не отправляет EMAIL при emailEnabled=false (возвращает null)', async () => {
            // disable email notifications
            await request(app.getHttpServer())
                .put('/online-store/notifications/settings')
                .set('x-tenant-id', '1')
                .set('Authorization', `Bearer ${createdCustomerToken}`)
                .send({ emailEnabled: false })
                .expect(200);

            const service = app.get(NotificationService);
            const result = await service.sendNotification({
                userId: createdCustomerId,
                type: NotificationType.EMAIL,
                templateName: 'blocked_email',
                title: 'Email Disabled',
                message: 'Should not send',
            } as unknown as Parameters<
                NotificationService['sendNotification']
            >[0]);

            expect(result).toBeNull();
        });
    });
});
