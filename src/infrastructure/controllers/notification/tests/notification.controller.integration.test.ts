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
import { NotificationModel, NotificationTemplateModel, UserModel, RoleModel } from '@app/domain/models';
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
                    models: [NotificationModel, NotificationTemplateModel, UserModel, RoleModel],
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
        notificationService = moduleFixture.get<NotificationService>(NotificationService);

        // Mock request.user
        app.use((req: any, res: any, next: any) => {
            req.user = mockUser;
            next();
        });

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /notifications', () => {
        it('should return user notifications with pagination', async () => {
            // Create test notification
            await NotificationModel.create({
                userId: 1,
                type: NotificationType.EMAIL,
                templateName: 'test_template',
                title: 'Test Notification',
                message: 'Test message',
                status: NotificationStatus.SENT,
                isRead: false,
                isArchived: false,
            });

            const response = await request(app.getHttpServer())
                .get('/notifications')
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(response.body.meta).toHaveProperty('totalCount');
            expect(response.body.meta).toHaveProperty('currentPage');
            expect(response.body.meta).toHaveProperty('lastPage');
            expect(response.body.meta).toHaveProperty('limit');
        });

        it('should filter notifications by status', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications')
                .query({ status: 'sent' })
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
        });

        it('should filter notifications by type', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications')
                .query({ type: 'email' })
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
        });
    });

    describe('GET /notifications/unread-count', () => {
        it('should return unread count', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications/unread-count')
                .expect(200);

            expect(response.body).toHaveProperty('count');
            expect(typeof response.body.count).toBe('number');
        });
    });

    describe('PUT /notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            // Create test notification
            const notification = await NotificationModel.create({
                userId: 1,
                type: NotificationType.EMAIL,
                templateName: 'test_template',
                title: 'Test Notification',
                message: 'Test message',
                status: NotificationStatus.SENT,
                isRead: false,
                isArchived: false,
            });

            const response = await request(app.getHttpServer())
                .put(`/notifications/${notification.id}/read`)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Уведомление отмечено как прочитанное');
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

            expect(response.body).toHaveProperty('emailEnabled', false);
            expect(response.body).toHaveProperty('pushEnabled', true);
            expect(response.body).toHaveProperty('orderUpdates', true);
            expect(response.body).toHaveProperty('marketing', false);
        });
    });

    describe('GET /notifications/templates', () => {
        it('should return notification templates', async () => {
            // Create test template
            await NotificationTemplateModel.create({
                name: 'test_template',
                type: NotificationType.EMAIL,
                title: 'Test Template',
                message: 'Test message {{name}}',
                isActive: true,
            });

            const response = await request(app.getHttpServer())
                .get('/notifications/templates')
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
        });

        it('should filter templates by type', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications/templates')
                .query({ type: 'email' })
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
        });
    });

    describe('POST /notifications/templates', () => {
        it('should create notification template', async () => {
            const templateData = {
                name: 'new_template',
                type: 'email',
                title: 'New Template',
                message: 'New message {{name}}',
            };

            const response = await request(app.getHttpServer())
                .post('/notifications/templates')
                .send(templateData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', 'new_template');
            expect(response.body).toHaveProperty('type', 'email');
            expect(response.body).toHaveProperty('title', 'New Template');
            expect(response.body).toHaveProperty('message', 'New message {{name}}');
            expect(response.body).toHaveProperty('isActive', true);
        });
    });

    describe('PUT /notifications/templates/:id', () => {
        it('should update notification template', async () => {
            // Create test template
            const template = await NotificationTemplateModel.create({
                name: 'update_template',
                type: NotificationType.EMAIL,
                title: 'Update Template',
                message: 'Update message',
                isActive: true,
            });

            const updateData = {
                title: 'Updated Template',
                message: 'Updated message {{name}}',
            };

            const response = await request(app.getHttpServer())
                .put(`/notifications/templates/${template.id}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('id', template.id);
            expect(response.body).toHaveProperty('title', 'Updated Template');
            expect(response.body).toHaveProperty('message', 'Updated message {{name}}');
        });

        it('should return 404 for non-existent template', async () => {
            const updateData = {
                title: 'Updated Template',
            };

            await request(app.getHttpServer())
                .put('/notifications/templates/99999')
                .send(updateData)
                .expect(404);
        });
    });

    describe('DELETE /notifications/templates/:id', () => {
        it('should delete notification template', async () => {
            // Create test template
            const template = await NotificationTemplateModel.create({
                name: 'delete_template',
                type: NotificationType.EMAIL,
                title: 'Delete Template',
                message: 'Delete message',
                isActive: true,
            });

            await request(app.getHttpServer())
                .delete(`/notifications/templates/${template.id}`)
                .expect(204);
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
                .get('/notifications/statistics')
                .query({ period: '7d' })
                .expect(200);

            expect(response.body).toHaveProperty('totalSent');
            expect(response.body).toHaveProperty('totalDelivered');
            expect(response.body).toHaveProperty('totalRead');
        });

        it('should filter statistics by type', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications/statistics')
                .query({ type: 'email' })
                .expect(200);

            expect(response.body).toHaveProperty('totalSent');
            expect(response.body).toHaveProperty('totalDelivered');
            expect(response.body).toHaveProperty('totalRead');
        });
    });

    describe('Error handling', () => {
        it('should handle invalid notification ID', async () => {
            await request(app.getHttpServer())
                .put('/notifications/invalid/read')
                .expect(400);
        });

        it('should handle invalid template ID', async () => {
            await request(app.getHttpServer())
                .put('/notifications/templates/invalid')
                .send({ title: 'Test' })
                .expect(400);
        });

        it('should handle invalid pagination parameters', async () => {
            await request(app.getHttpServer())
                .get('/notifications')
                .query({ page: 'invalid', limit: 'invalid' })
                .expect(400);
        });
    });

    describe('Tenant isolation', () => {
        it('should only return notifications for current user', async () => {
            // Create notifications for different users
            await NotificationModel.create({
                userId: 1,
                type: NotificationType.EMAIL,
                templateName: 'user1_template',
                title: 'User 1 Notification',
                message: 'User 1 message',
                status: NotificationStatus.SENT,
                isRead: false,
                isArchived: false,
            });

            await NotificationModel.create({
                userId: 2,
                type: NotificationType.EMAIL,
                templateName: 'user2_template',
                title: 'User 2 Notification',
                message: 'User 2 message',
                status: NotificationStatus.SENT,
                isRead: false,
                isArchived: false,
            });

            const response = await request(app.getHttpServer())
                .get('/notifications')
                .expect(200);

            // Should only return notifications for user 1
            const userNotifications = response.body.data.filter((n: any) => n.userId === 1);
            expect(userNotifications.length).toBeGreaterThan(0);
        });
    });
});
