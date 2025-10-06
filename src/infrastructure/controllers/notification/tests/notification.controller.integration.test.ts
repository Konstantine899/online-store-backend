import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SequelizeModule } from '@nestjs/sequelize';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationController } from '../notification.controller';
import { NotificationService } from '@app/infrastructure/services/notification/notification.service';
import { EmailProviderService } from '@app/infrastructure/services/notification/email-provider.service';
import { SmsProviderService } from '@app/infrastructure/services/notification/sms-provider.service';
import { TemplateRendererService } from '@app/infrastructure/services/notification/template-renderer.service';
import { NotificationEventHandler } from '@app/infrastructure/common/events/notification.event-handler';
import { AuthGuard } from '@app/infrastructure/common/guards/auth.guard';
import { RoleGuard } from '@app/infrastructure/common/guards/role.guard';
import {
    NotificationModel,
    NotificationTemplateModel,
    UserModel,
    RoleModel,
    UserRoleModel,
    RefreshTokenModel,
    RatingModel,
    ProductModel,
    CategoryModel,
    BrandModel,
    OrderModel,
    OrderItemModel,
    CartModel,
    CartProductModel,
    UserAddressModel,
    LoginHistoryModel,
    ProductPropertyModel,
} from '@app/domain/models';
import { NotificationType, NotificationStatus } from '@app/domain/models';

// Mock guards
const mockAuthGuard = {
    canActivate: jest.fn(() => true),
};

const mockRoleGuard = {
    canActivate: jest.fn(() => true),
};

// Mock user data
const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: [{ name: 'CUSTOMER' }],
};

describe('NotificationController (Integration)', () => {
    let app: INestApplication;
    let notificationService: NotificationService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                SequelizeModule.forRoot({
                    dialect: 'sqlite',
                    storage: ':memory:',
                    logging: false,
                    models: [
                        NotificationModel,
                        NotificationTemplateModel,
                        UserModel,
                        RoleModel,
                        UserRoleModel,
                        RefreshTokenModel,
                        RatingModel,
                        ProductModel,
                        CategoryModel,
                        BrandModel,
                        OrderModel,
                        OrderItemModel,
                        CartModel,
                        CartProductModel,
                        UserAddressModel,
                        LoginHistoryModel,
                        ProductPropertyModel,
                    ],
                    autoLoadModels: true,
                    synchronize: true,
                }),
                EventEmitterModule.forRoot(),
            ],
            controllers: [NotificationController],
            providers: [
                NotificationService,
                {
                    provide: 'IEmailProvider',
                    useClass: EmailProviderService,
                },
                {
                    provide: 'ISmsProvider',
                    useClass: SmsProviderService,
                },
                {
                    provide: 'ITemplateRenderer',
                    useClass: TemplateRendererService,
                },
                NotificationEventHandler,
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue(mockAuthGuard)
            .overrideGuard(RoleGuard)
            .useValue(mockRoleGuard)
            .compile();

        app = moduleFixture.createNestApplication();
        notificationService =
            moduleFixture.get<NotificationService>(NotificationService);

        // Mock request.user
        app.use((req: unknown, res: unknown, next: unknown) => {
            (req as { user: typeof mockUser }).user = mockUser;
            (next as () => void)();
        });

        await app.init();
    }, 30000);

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /notifications', () => {
        it('should return user notifications with pagination', async () => {
            // Create test notification
            const testNotification = await NotificationModel.create({
                userId: 1,
                type: NotificationType.EMAIL,
                title: 'Test Notification',
                message: 'This is a test notification',
                status: NotificationStatus.SENT,
                isRead: false,
                templateName: 'performance_template',
            });

            const response = await request(app.getHttpServer())
                .get('/notifications')
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.meta).toHaveProperty('totalCount');
            expect(response.body.meta).toHaveProperty('currentPage');
            expect(response.body.meta).toHaveProperty('lastPage');
            expect(response.body.meta).toHaveProperty('limit');

            // Cleanup
            await testNotification.destroy();
        });

        it('should filter notifications by status', async () => {
            // Create test notifications with different statuses
            const sentNotification = await NotificationModel.create({
                userId: 1,
                type: NotificationType.EMAIL,
                title: 'Sent Notification',
                message: 'This notification was sent',
                status: NotificationStatus.SENT,
                isRead: false,
                templateName: 'performance_template',
            });

            const pendingNotification = await NotificationModel.create({
                userId: 1,
                type: NotificationType.EMAIL,
                title: 'Pending Notification',
                message: 'This notification is pending',
                status: NotificationStatus.PENDING,
                isRead: false,
                templateName: 'pending_template',
            });

            const response = await request(app.getHttpServer())
                .get('/notifications?status=sent')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].status).toBe('sent');

            // Cleanup
            await sentNotification.destroy();
            await pendingNotification.destroy();
        });

        it('should filter notifications by type', async () => {
            // Create test notifications with different types
            const emailNotification = await NotificationModel.create({
                userId: 1,
                type: NotificationType.EMAIL,
                title: 'Email Notification',
                message: 'This is an email notification',
                status: NotificationStatus.SENT,
                isRead: false,
                templateName: 'performance_template',
            });

            const pushNotification = await NotificationModel.create({
                userId: 1,
                type: NotificationType.PUSH,
                title: 'Push Notification',
                message: 'This is a push notification',
                status: NotificationStatus.SENT,
                isRead: false,
                templateName: 'push_template',
            });

            const response = await request(app.getHttpServer())
                .get('/notifications?type=email')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].type).toBe('email');

            // Cleanup
            await emailNotification.destroy();
            await pushNotification.destroy();
        });
    });

    describe('GET /notifications/unread-count', () => {
        it('should return unread count', async () => {
            // Create test notifications
            await NotificationModel.create({
                userId: 1,
                type: NotificationType.EMAIL,
                title: 'Unread Notification 1',
                message: 'This is unread',
                status: NotificationStatus.SENT,
                isRead: false,
                templateName: 'unread_template_1',
            });

            await NotificationModel.create({
                userId: 1,
                type: NotificationType.EMAIL,
                title: 'Unread Notification 2',
                message: 'This is also unread',
                status: NotificationStatus.SENT,
                isRead: false,
                templateName: 'unread_template_2',
            });

            await NotificationModel.create({
                userId: 1,
                type: NotificationType.EMAIL,
                title: 'Read Notification',
                message: 'This is read',
                status: NotificationStatus.SENT,
                isRead: true,
                templateName: 'read_template',
            });

            const response = await request(app.getHttpServer())
                .get('/notifications/unread-count')
                .expect(200);

            expect(response.body).toHaveProperty('count');
            expect(response.body.count).toBeGreaterThanOrEqual(2);
        });
    });

    describe('PUT /notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            const testNotification = await NotificationModel.create({
                userId: 1,
                type: NotificationType.EMAIL,
                title: 'Test Notification',
                message: 'This is a test notification',
                status: NotificationStatus.SENT,
                isRead: false,
                templateName: 'performance_template',
            });

            const response = await request(app.getHttpServer())
                .put(`/notifications/${testNotification.id}/read`)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe(
                'Уведомление отмечено как прочитанное',
            );

            // Verify notification was marked as read
            const updatedNotification = await NotificationModel.findByPk(
                testNotification.id,
            );
            expect(updatedNotification?.isRead).toBe(true);

            // Cleanup
            await testNotification.destroy();
        });

        it('should return 404 for non-existent notification', async () => {
            await request(app.getHttpServer())
                .put('/notifications/99999/read')
                .expect(404);
        });
    });

    describe('GET /notifications/settings', () => {
        it('should return user notification settings', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications/settings')
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('userId');
            expect(response.body).toHaveProperty('emailEnabled');
            expect(response.body).toHaveProperty('pushEnabled');
            expect(response.body).toHaveProperty('orderUpdates');
            expect(response.body).toHaveProperty('marketing');
        });
    });

    describe('PUT /notifications/settings', () => {
        it('should update user notification settings', async () => {
            const updateData = {
                emailEnabled: false,
                pushEnabled: true,
                orderUpdates: true,
                marketing: false,
            };

            const response = await request(app.getHttpServer())
                .put('/notifications/settings')
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('userId');
            expect(response.body.emailEnabled).toBe(false);
            expect(response.body.pushEnabled).toBe(true);
            expect(response.body.orderUpdates).toBe(true);
            expect(response.body.marketing).toBe(false);
        });
    });

    describe('GET /notifications/templates', () => {
        it('should return notification templates', async () => {
            // Create test template
            const testTemplate = await NotificationTemplateModel.create({
                name: 'test_template',
                type: NotificationType.EMAIL,
                title: 'Test Template',
                message: 'This is a test template',
                isActive: true,
            });

            const response = await request(app.getHttpServer())
                .get('/notifications/templates')
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.meta).toHaveProperty('totalCount');

            // Cleanup
            await testTemplate.destroy();
        });

        it('should filter templates by type', async () => {
            // Create test templates with different types
            const emailTemplate = await NotificationTemplateModel.create({
                name: 'email_template',
                type: NotificationType.EMAIL,
                title: 'Email Template',
                message: 'This is an email template',
                isActive: true,
            });

            const pushTemplate = await NotificationTemplateModel.create({
                name: 'push_template',
                type: NotificationType.PUSH,
                title: 'Push Template',
                message: 'This is a push template',
                isActive: true,
            });

            const response = await request(app.getHttpServer())
                .get('/notifications/templates?type=email')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].type).toBe('email');

            // Cleanup
            await emailTemplate.destroy();
            await pushTemplate.destroy();
        });
    });

    describe('POST /notifications/templates', () => {
        it('should create notification template', async () => {
            const templateData = {
                name: 'new_template',
                type: 'email',
                title: 'New Template',
                message: 'This is a new template',
            };

            const response = await request(app.getHttpServer())
                .post('/notifications/templates')
                .send(templateData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('type');
            expect(response.body).toHaveProperty('title');
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('isActive');

            // Cleanup
            await NotificationTemplateModel.destroy({
                where: { id: response.body.id },
            });
        });
    });

    describe('PUT /notifications/templates/:id', () => {
        it('should update notification template', async () => {
            const testTemplate = await NotificationTemplateModel.create({
                name: 'update_template',
                type: NotificationType.EMAIL,
                title: 'Original Title',
                message: 'Original message',
                isActive: true,
            });

            const updateData = {
                title: 'Updated Title',
                message: 'Updated message',
            };

            const response = await request(app.getHttpServer())
                .put(`/notifications/templates/${testTemplate.id}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe('Updated Title');
            expect(response.body.message).toBe('Updated message');

            // Cleanup
            await testTemplate.destroy();
        });

        it('should return 404 for non-existent template', async () => {
            const updateData = {
                title: 'Updated Title',
            };

            await request(app.getHttpServer())
                .put('/notifications/templates/99999')
                .send(updateData)
                .expect(404);
        });
    });

    describe('DELETE /notifications/templates/:id', () => {
        it('should delete notification template', async () => {
            const testTemplate = await NotificationTemplateModel.create({
                name: 'delete_template',
                type: NotificationType.EMAIL,
                title: 'Template to Delete',
                message: 'This template will be deleted',
                isActive: true,
            });

            await request(app.getHttpServer())
                .delete(`/notifications/templates/${testTemplate.id}`)
                .expect(204);

            // Verify template was deleted
            const deletedTemplate = await NotificationTemplateModel.findByPk(
                testTemplate.id,
            );
            expect(deletedTemplate).toBeNull();
        });

        it('should return 404 for non-existent template', async () => {
            await request(app.getHttpServer())
                .delete('/notifications/templates/99999')
                .expect(404);
        });
    });

    describe('GET /notifications/statistics', () => {
        it('should return notification statistics', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications/statistics')
                .expect(200);

            expect(response.body).toHaveProperty('totalSent');
            expect(response.body).toHaveProperty('totalDelivered');
            expect(response.body).toHaveProperty('totalRead');
            expect(response.body).toHaveProperty('deliveryRate');
            expect(response.body).toHaveProperty('readRate');
            expect(response.body).toHaveProperty('byType');
            expect(response.body).toHaveProperty('byStatus');
        });

        it('should filter statistics by period', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications/statistics?period=7d')
                .expect(200);

            expect(response.body).toHaveProperty('totalSent');
            expect(response.body).toHaveProperty('totalDelivered');
        });

        it('should filter statistics by type', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications/statistics?type=email')
                .expect(200);

            expect(response.body).toHaveProperty('totalSent');
            expect(response.body).toHaveProperty('byType');
        });
    });

    describe('Role-based access control', () => {
        it('should allow CUSTOMER role to access user notifications', async () => {
            mockRoleGuard.canActivate.mockReturnValue(true);

            const response = await request(app.getHttpServer())
                .get('/notifications')
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
        });

        it('should allow CUSTOMER role to access unread count', async () => {
            mockRoleGuard.canActivate.mockReturnValue(true);

            const response = await request(app.getHttpServer())
                .get('/notifications/unread-count')
                .expect(200);

            expect(response.body).toHaveProperty('count');
        });

        it('should allow CUSTOMER role to access settings', async () => {
            mockRoleGuard.canActivate.mockReturnValue(true);

            const response = await request(app.getHttpServer())
                .get('/notifications/settings')
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('userId');
        });

        it('should allow CUSTOMER role to update settings', async () => {
            mockRoleGuard.canActivate.mockReturnValue(true);

            const updateData = {
                emailEnabled: false,
                pushEnabled: true,
            };

            const response = await request(app.getHttpServer())
                .put('/notifications/settings')
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.emailEnabled).toBe(false);
        });

        it('should deny access for unauthorized users', async () => {
            mockAuthGuard.canActivate.mockReturnValue(false);

            await request(app.getHttpServer())
                .get('/notifications')
                .expect(401);

            // Reset mock
            mockAuthGuard.canActivate.mockReturnValue(true);
        });

        it('should deny access for insufficient permissions', async () => {
            mockRoleGuard.canActivate.mockReturnValue(false);

            await request(app.getHttpServer())
                .get('/notifications/templates')
                .expect(403);

            // Reset mock
            mockRoleGuard.canActivate.mockReturnValue(true);
        });
    });

    describe('Tenant isolation', () => {
        it('should prevent access to other users notifications', async () => {
            // Create notification for user 2
            const otherUserNotification = await NotificationModel.create({
                userId: 2,
                type: NotificationType.EMAIL,
                title: 'Other User Notification',
                message: 'This belongs to user 2',
                status: NotificationStatus.SENT,
                isRead: false,
                templateName: 'performance_template',
            });

            // Create notification for current user (user 1)
            const currentUserNotification = await NotificationModel.create({
                userId: 1,
                type: NotificationType.EMAIL,
                title: 'Current User Notification',
                message: 'This belongs to user 1',
                status: NotificationStatus.SENT,
                isRead: false,
                templateName: 'performance_template',
            });

            const response = await request(app.getHttpServer())
                .get('/notifications')
                .expect(200);

            // Should only return notifications for user 1
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].id).toBe(currentUserNotification.id);

            // Cleanup
            await otherUserNotification.destroy();
            await currentUserNotification.destroy();
        });

        it('should prevent marking other users notifications as read', async () => {
            // Create notification for user 2
            const otherUserNotification = await NotificationModel.create({
                userId: 2,
                type: NotificationType.EMAIL,
                title: 'Other User Notification',
                message: 'This belongs to user 2',
                status: NotificationStatus.SENT,
                isRead: false,
                templateName: 'performance_template',
            });

            await request(app.getHttpServer())
                .put(`/notifications/${otherUserNotification.id}/read`)
                .expect(404);

            // Cleanup
            await otherUserNotification.destroy();
        });
    });

    describe('Validation tests', () => {
        it('should validate template creation data', async () => {
            const invalidData = {
                // Missing required fields
                name: 'test',
            };

            await request(app.getHttpServer())
                .post('/notifications/templates')
                .send(invalidData)
                .expect(400);
        });

        it('should validate template update data', async () => {
            const testTemplate = await NotificationTemplateModel.create({
                name: 'validation_template',
                type: NotificationType.EMAIL,
                title: 'Validation Template',
                message: 'Template for validation tests',
                isActive: true,
            });

            const invalidData = {
                type: 'invalid_type', // Invalid type
            };

            await request(app.getHttpServer())
                .put(`/notifications/templates/${testTemplate.id}`)
                .send(invalidData)
                .expect(400);

            // Cleanup
            await testTemplate.destroy();
        });

        it('should validate pagination limits', async () => {
            await request(app.getHttpServer())
                .get('/notifications?page=0&limit=0')
                .expect(400);
        });

        it('should validate statistics period format', async () => {
            await request(app.getHttpServer())
                .get('/notifications/statistics?period=invalid')
                .expect(400);
        });
    });

    describe('Error handling', () => {
        it('should handle database errors gracefully', async () => {
            // Mock database error
            jest.spyOn(NotificationModel, 'findAll').mockRejectedValue(
                new Error('Database connection failed'),
            );

            await request(app.getHttpServer())
                .get('/notifications')
                .expect(500);

            // Restore mock
            jest.restoreAllMocks();
        });

        it('should handle service errors gracefully', async () => {
            // Mock service error
            jest.spyOn(
                notificationService,
                'getNotifications',
            ).mockRejectedValue(new Error('Service error'));

            await request(app.getHttpServer())
                .get('/notifications')
                .expect(500);

            // Restore mock
            jest.restoreAllMocks();
        });
    });

    describe('Performance tests', () => {
        it('should handle large number of notifications efficiently', async () => {
            // Create multiple notifications
            const notifications = [];
            for (let i = 0; i < 50; i++) {
                const notification = await NotificationModel.create({
                    userId: 1,
                    type: NotificationType.EMAIL,
                    title: `Notification ${i}`,
                    message: `Message ${i}`,
                    status: NotificationStatus.SENT,
                    isRead: false,
                    templateName: `performance_template_${i}`,
                });
                notifications.push(notification);
            }

            const startTime = Date.now();
            const response = await request(app.getHttpServer())
                .get('/notifications?limit=20')
                .expect(200);
            const endTime = Date.now();

            expect(response.body.data).toHaveLength(20);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

            // Cleanup
            await Promise.all(notifications.map((n) => n.destroy()));
        });
    });
});
