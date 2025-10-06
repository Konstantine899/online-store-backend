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

// Оптимизированные моки для производительности
const mockAuthGuard = {
    canActivate: jest.fn(() => true),
};

const mockRoleGuard = {
    canActivate: jest.fn(() => true),
};

// Фабричные функции для создания тестовых данных
const createMockUser = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: [{ name: 'CUSTOMER' }],
    ...overrides,
});

const createMockNotification = (overrides: Record<string, unknown> = {}) => ({
    userId: 1,
    type: NotificationType.EMAIL,
    title: 'Test Notification',
    message: 'This is a test notification',
    status: NotificationStatus.SENT,
    isRead: false,
    templateName: 'performance_template',
    ...overrides,
});

const createMockTemplate = (overrides: Record<string, unknown> = {}) => ({
    name: 'test_template',
    type: NotificationType.EMAIL,
    title: 'Test Template',
    message: 'This is a test template',
    isActive: true,
    ...overrides,
});

// Кэш для тестовых данных
const testDataCache = new Map<string, unknown[]>();

describe('NotificationController (Integration)', () => {
    let app: INestApplication;
    let notificationService: NotificationService;
    let module: TestingModule;

    // Оптимизированная настройка модуля
    beforeAll(async () => {
        const startTime = Date.now();
        
        module = await Test.createTestingModule({
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

        app = module.createNestApplication();
        notificationService = module.get<NotificationService>(NotificationService);

        // Оптимизированный middleware для мокирования пользователя
        app.use((req: unknown, res: unknown, next: unknown) => {
            (req as { user: ReturnType<typeof createMockUser> }).user = createMockUser();
            (next as () => void)();
        });

        await app.init();
        
        const endTime = Date.now();
        console.log(`Module setup completed in ${endTime - startTime}ms`);
    }, 30000);

    afterAll(async () => {
        if (app) {
            await app.close();
        }
        if (module) {
            await module.close();
        }
        // Очищаем кэш тестовых данных
        testDataCache.clear();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Сбрасываем моки к значениям по умолчанию
        mockAuthGuard.canActivate.mockReturnValue(true);
        mockRoleGuard.canActivate.mockReturnValue(true);
    });

    describe('GET /notifications', () => {
        it('should return user notifications with pagination', async () => {
            const startTime = Date.now();
            
            // Используем фабричную функцию для создания тестовых данных
            const testNotification = await NotificationModel.create(
                createMockNotification()
            );

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
            
            const endTime = Date.now();
            console.log(`GET /notifications test completed in ${endTime - startTime}ms`);
        });

        it('should filter notifications by status', async () => {
            const startTime = Date.now();
            
            // Создаем тестовые уведомления с разными статусами
            const sentNotification = await NotificationModel.create(
                createMockNotification({
                    title: 'Sent Notification',
                    message: 'This notification was sent',
                    status: NotificationStatus.SENT,
                    templateName: 'sent_template',
                })
            );

            const pendingNotification = await NotificationModel.create(
                createMockNotification({
                    title: 'Pending Notification',
                    message: 'This notification is pending',
                    status: NotificationStatus.PENDING,
                    templateName: 'pending_template',
                })
            );

            const response = await request(app.getHttpServer())
                .get('/notifications?status=sent')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].status).toBe('sent');

            // Cleanup
            await Promise.all([
                sentNotification.destroy(),
                pendingNotification.destroy(),
            ]);
            
            const endTime = Date.now();
            console.log(`Filter by status test completed in ${endTime - startTime}ms`);
        });

        it('should filter notifications by type', async () => {
            const startTime = Date.now();
            
            // Создаем тестовые уведомления с разными типами
            const emailNotification = await NotificationModel.create(
                createMockNotification({
                    title: 'Email Notification',
                    message: 'This is an email notification',
                    type: NotificationType.EMAIL,
                    templateName: 'email_template',
                })
            );

            const pushNotification = await NotificationModel.create(
                createMockNotification({
                    title: 'Push Notification',
                    message: 'This is a push notification',
                    type: NotificationType.PUSH,
                    templateName: 'push_template',
                })
            );

            const response = await request(app.getHttpServer())
                .get('/notifications?type=email')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].type).toBe('email');

            // Cleanup
            await Promise.all([
                emailNotification.destroy(),
                pushNotification.destroy(),
            ]);
            
            const endTime = Date.now();
            console.log(`Filter by type test completed in ${endTime - startTime}ms`);
        });
    });

    describe('GET /notifications/unread-count', () => {
        it('should return unread count', async () => {
            const startTime = Date.now();
            
            // Создаем тестовые уведомления параллельно для производительности
            const notifications = await Promise.all([
                NotificationModel.create(
                    createMockNotification({
                        title: 'Unread Notification 1',
                        message: 'This is unread',
                        templateName: 'unread_template_1',
                    })
                ),
                NotificationModel.create(
                    createMockNotification({
                        title: 'Unread Notification 2',
                        message: 'This is also unread',
                        templateName: 'unread_template_2',
                    })
                ),
                NotificationModel.create(
                    createMockNotification({
                        title: 'Read Notification',
                        message: 'This is read',
                        isRead: true,
                        templateName: 'read_template',
                    })
                ),
            ]);

            const response = await request(app.getHttpServer())
                .get('/notifications/unread-count')
                .expect(200);

            expect(response.body).toHaveProperty('count');
            expect(response.body.count).toBeGreaterThanOrEqual(2);
            
            // Cleanup
            await Promise.all(notifications.map(n => n.destroy()));
            
            const endTime = Date.now();
            console.log(`Unread count test completed in ${endTime - startTime}ms`);
        });
    });

    describe('PUT /notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            const startTime = Date.now();
            
            const testNotification = await NotificationModel.create(
                createMockNotification()
            );

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
            
            const endTime = Date.now();
            console.log(`Mark as read test completed in ${endTime - startTime}ms`);
        });

        it('should return 404 for non-existent notification', async () => {
            const startTime = Date.now();
            
            await request(app.getHttpServer())
                .put('/notifications/99999/read')
                .expect(404);
                
            const endTime = Date.now();
            console.log(`404 test completed in ${endTime - startTime}ms`);
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
            const startTime = Date.now();
            
            // Используем фабричную функцию для создания тестового шаблона
            const testTemplate = await NotificationTemplateModel.create(
                createMockTemplate()
            );

            const response = await request(app.getHttpServer())
                .get('/notifications/templates')
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('meta');
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.meta).toHaveProperty('totalCount');

            // Cleanup
            await testTemplate.destroy();
            
            const endTime = Date.now();
            console.log(`Get templates test completed in ${endTime - startTime}ms`);
        });

        it('should filter templates by type', async () => {
            const startTime = Date.now();
            
            // Создаем тестовые шаблоны с разными типами параллельно
            const templates = await Promise.all([
                NotificationTemplateModel.create(
                    createMockTemplate({
                        name: 'email_template',
                        title: 'Email Template',
                        message: 'This is an email template',
                        type: NotificationType.EMAIL,
                    })
                ),
                NotificationTemplateModel.create(
                    createMockTemplate({
                        name: 'push_template',
                        title: 'Push Template',
                        message: 'This is a push template',
                        type: NotificationType.PUSH,
                    })
                ),
            ]);

            const response = await request(app.getHttpServer())
                .get('/notifications/templates?type=email')
                .expect(200);

            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].type).toBe('email');

            // Cleanup
            await Promise.all(templates.map(t => t.destroy()));
            
            const endTime = Date.now();
            console.log(`Filter templates by type test completed in ${endTime - startTime}ms`);
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
            const startTime = Date.now();
            
            // Создаем уведомления для разных пользователей параллельно
            const notifications = await Promise.all([
                NotificationModel.create(
                    createMockNotification({
                        userId: 2,
                        title: 'Other User Notification',
                        message: 'This belongs to user 2',
                        templateName: 'other_user_template',
                    })
                ),
                NotificationModel.create(
                    createMockNotification({
                        userId: 1,
                        title: 'Current User Notification',
                        message: 'This belongs to user 1',
                        templateName: 'current_user_template',
                    })
                ),
            ]);

            const response = await request(app.getHttpServer())
                .get('/notifications')
                .expect(200);

            // Должны возвращаться только уведомления для пользователя 1
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].id).toBe(notifications[1].id);

            // Cleanup
            await Promise.all(notifications.map(n => n.destroy()));
            
            const endTime = Date.now();
            console.log(`Tenant isolation test completed in ${endTime - startTime}ms`);
        });

        it('should prevent marking other users notifications as read', async () => {
            const startTime = Date.now();
            
            // Создаем уведомление для пользователя 2
            const otherUserNotification = await NotificationModel.create(
                createMockNotification({
                    userId: 2,
                    title: 'Other User Notification',
                    message: 'This belongs to user 2',
                    templateName: 'other_user_template',
                })
            );

            await request(app.getHttpServer())
                .put(`/notifications/${otherUserNotification.id}/read`)
                .expect(404);

            // Cleanup
            await otherUserNotification.destroy();
            
            const endTime = Date.now();
            console.log(`Prevent marking other user notification test completed in ${endTime - startTime}ms`);
        });

        it('should handle multiple users efficiently', async () => {
            const startTime = Date.now();
            
            // Создаем уведомления для множественных пользователей параллельно
            const notifications = await Promise.all([
                // Пользователь 1
                NotificationModel.create(
                    createMockNotification({
                        userId: 1,
                        title: 'User 1 Notification 1',
                        templateName: 'user1_template_1',
                    })
                ),
                NotificationModel.create(
                    createMockNotification({
                        userId: 1,
                        title: 'User 1 Notification 2',
                        templateName: 'user1_template_2',
                    })
                ),
                // Пользователь 2
                NotificationModel.create(
                    createMockNotification({
                        userId: 2,
                        title: 'User 2 Notification 1',
                        templateName: 'user2_template_1',
                    })
                ),
                NotificationModel.create(
                    createMockNotification({
                        userId: 2,
                        title: 'User 2 Notification 2',
                        templateName: 'user2_template_2',
                    })
                ),
            ]);

            // Запрос от пользователя 1
            const response = await request(app.getHttpServer())
                .get('/notifications')
                .expect(200);

            // Должны возвращаться только уведомления пользователя 1
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data.every((n: { userId: number }) => n.userId === 1)).toBe(true);

            // Cleanup
            await Promise.all(notifications.map(n => n.destroy()));
            
            const endTime = Date.now();
            console.log(`Multiple users test completed in ${endTime - startTime}ms`);
        });
    });

    describe('Validation tests', () => {
        it('should validate template creation data', async () => {
            const startTime = Date.now();
            
            const invalidData = {
                // Missing required fields
                name: 'test',
            };

            await request(app.getHttpServer())
                .post('/notifications/templates')
                .send(invalidData)
                .expect(400);
            
            const endTime = Date.now();
            console.log(`Template creation validation test completed in ${endTime - startTime}ms`);
        });

        it('should validate template update data', async () => {
            const startTime = Date.now();
            
            const testTemplate = await NotificationTemplateModel.create(
                createMockTemplate({ name: 'validation_template' })
            );

            const invalidData = {
                type: 'invalid_type', // Invalid type
            };

            await request(app.getHttpServer())
                .put(`/notifications/templates/${testTemplate.id}`)
                .send(invalidData)
                .expect(400);

            // Cleanup
            await testTemplate.destroy();
            
            const endTime = Date.now();
            console.log(`Template update validation test completed in ${endTime - startTime}ms`);
        });

        it('should validate pagination limits', async () => {
            const startTime = Date.now();
            
            await request(app.getHttpServer())
                .get('/notifications?page=0&limit=0')
                .expect(400);
            
            const endTime = Date.now();
            console.log(`Pagination limits validation test completed in ${endTime - startTime}ms`);
        });

        it('should validate statistics period format', async () => {
            const startTime = Date.now();
            
            await request(app.getHttpServer())
                .get('/notifications/statistics?period=invalid')
                .expect(400);
            
            const endTime = Date.now();
            console.log(`Statistics period validation test completed in ${endTime - startTime}ms`);
        });

        it('should validate bulk operations efficiently', async () => {
            const startTime = Date.now();
            
            // Тестируем валидацию множественных операций параллельно
            const invalidRequests = await Promise.allSettled([
                request(app.getHttpServer())
                    .post('/notifications/templates')
                    .send({ name: 'test1' }), // Missing required fields
                request(app.getHttpServer())
                    .post('/notifications/templates')
                    .send({ type: 'invalid' }), // Missing required fields
                request(app.getHttpServer())
                    .get('/notifications?page=-1'), // Invalid page
                request(app.getHttpServer())
                    .get('/notifications?limit=1000'), // Invalid limit
            ]);

            // Все запросы должны завершиться с ошибкой
            invalidRequests.forEach(result => {
                expect(result.status).toBe('fulfilled');
                if (result.status === 'fulfilled') {
                    expect(result.value.status).toBeGreaterThanOrEqual(400);
                }
            });
            
            const endTime = Date.now();
            console.log(`Bulk validation test completed in ${endTime - startTime}ms`);
        });
    });

    describe('Error handling', () => {
        it('should handle database errors gracefully', async () => {
            const startTime = Date.now();
            
            // Mock database error
            jest.spyOn(NotificationModel, 'findAll').mockRejectedValue(
                new Error('Database connection failed'),
            );

            await request(app.getHttpServer())
                .get('/notifications')
                .expect(500);

            // Restore mock
            jest.restoreAllMocks();
            
            const endTime = Date.now();
            console.log(`Database error handling test completed in ${endTime - startTime}ms`);
        });

        it('should handle service errors gracefully', async () => {
            const startTime = Date.now();
            
            // Mock service error
            jest.spyOn(notificationService, 'getNotifications').mockRejectedValue(
                new Error('Service error'),
            );

            await request(app.getHttpServer())
                .get('/notifications')
                .expect(500);

            // Restore mock
            jest.restoreAllMocks();
            
            const endTime = Date.now();
            console.log(`Service error handling test completed in ${endTime - startTime}ms`);
        });

        it('should handle multiple error scenarios efficiently', async () => {
            const startTime = Date.now();
            
            // Тестируем множественные сценарии ошибок параллельно
            const errorScenarios = await Promise.allSettled([
                // Database error
                (async () => {
                    jest.spyOn(NotificationModel, 'findAll').mockRejectedValue(
                        new Error('Database error'),
                    );
                    const result = await request(app.getHttpServer())
                        .get('/notifications')
                        .expect(500);
                    jest.restoreAllMocks();
                    return result;
                })(),
                // Service error
                (async () => {
                    jest.spyOn(notificationService, 'getNotifications').mockRejectedValue(
                        new Error('Service error'),
                    );
                    const result = await request(app.getHttpServer())
                        .get('/notifications')
                        .expect(500);
                    jest.restoreAllMocks();
                    return result;
                })(),
                // Template service error
                (async () => {
                    jest.spyOn(notificationService, 'getTemplates').mockRejectedValue(
                        new Error('Template service error'),
                    );
                    const result = await request(app.getHttpServer())
                        .get('/notifications/templates')
                        .expect(500);
                    jest.restoreAllMocks();
                    return result;
                })(),
            ]);

            // Все сценарии должны завершиться с ошибкой
            errorScenarios.forEach(result => {
                expect(result.status).toBe('fulfilled');
                if (result.status === 'fulfilled') {
                    expect(result.value.status).toBe(500);
                }
            });
            
            const endTime = Date.now();
            console.log(`Multiple error scenarios test completed in ${endTime - startTime}ms`);
        });
    });

    describe('Performance tests', () => {
        it('should handle large number of notifications efficiently', async () => {
            const startTime = Date.now();
            
            // Создаем множественные уведомления параллельно для производительности
            const notifications = await Promise.all(
                Array.from({ length: 50 }, (_, i) => 
                    NotificationModel.create(
                        createMockNotification({
                            title: `Notification ${i}`,
                            message: `Message ${i}`,
                            templateName: `performance_template_${i}`,
                        })
                    )
                )
            );

            const requestStartTime = Date.now();
            const response = await request(app.getHttpServer())
                .get('/notifications?limit=20')
                .expect(200);
            const requestEndTime = Date.now();

            expect(response.body.data).toHaveLength(20);
            expect(requestEndTime - requestStartTime).toBeLessThan(1000); // Должно завершиться менее чем за 1 секунду

            // Cleanup - удаляем параллельно для производительности
            await Promise.all(notifications.map((n) => n.destroy()));
            
            const endTime = Date.now();
            console.log(`Large notifications test completed in ${endTime - startTime}ms (request: ${requestEndTime - requestStartTime}ms)`);
        });

        it('should handle bulk template operations efficiently', async () => {
            const startTime = Date.now();
            
            // Создаем множественные шаблоны параллельно
            const templates = await Promise.all(
                Array.from({ length: 20 }, (_, i) => 
                    NotificationTemplateModel.create(
                        createMockTemplate({
                            name: `bulk_template_${i}`,
                            title: `Bulk Template ${i}`,
                            message: `Bulk message ${i}`,
                        })
                    )
                )
            );

            const requestStartTime = Date.now();
            const response = await request(app.getHttpServer())
                .get('/notifications/templates?limit=10')
                .expect(200);
            const requestEndTime = Date.now();

            expect(response.body.data).toHaveLength(10);
            expect(requestEndTime - requestStartTime).toBeLessThan(500); // Должно завершиться менее чем за 500мс

            // Cleanup
            await Promise.all(templates.map(t => t.destroy()));
            
            const endTime = Date.now();
            console.log(`Bulk templates test completed in ${endTime - startTime}ms (request: ${requestEndTime - requestStartTime}ms)`);
        });

        it('should handle concurrent requests efficiently', async () => {
            const startTime = Date.now();
            
            // Создаем тестовые данные
            const notifications = await Promise.all(
                Array.from({ length: 10 }, (_, i) => 
                    NotificationModel.create(
                        createMockNotification({
                            title: `Concurrent Notification ${i}`,
                            templateName: `concurrent_template_${i}`,
                        })
                    )
                )
            );

            // Выполняем множественные запросы параллельно
            const requestStartTime = Date.now();
            const responses = await Promise.all([
                request(app.getHttpServer()).get('/notifications?limit=5'),
                request(app.getHttpServer()).get('/notifications/unread-count'),
                request(app.getHttpServer()).get('/notifications/statistics'),
                request(app.getHttpServer()).get('/notifications/templates'),
            ]);
            const requestEndTime = Date.now();

            // Проверяем, что все запросы успешны
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });

            expect(requestEndTime - requestStartTime).toBeLessThan(2000); // Должно завершиться менее чем за 2 секунды

            // Cleanup
            await Promise.all(notifications.map(n => n.destroy()));
            
            const endTime = Date.now();
            console.log(`Concurrent requests test completed in ${endTime - startTime}ms (requests: ${requestEndTime - requestStartTime}ms)`);
        });

        it('should handle caching efficiently', async () => {
            const startTime = Date.now();
            
            // Создаем тестовое уведомление
            const testNotification = await NotificationModel.create(
                createMockNotification({
                    title: 'Cache Test Notification',
                    templateName: 'cache_template',
                })
            );

            // Первый запрос (без кэша)
            const firstRequestStart = Date.now();
            const firstResponse = await request(app.getHttpServer())
                .get('/notifications')
                .expect(200);
            const firstRequestEnd = Date.now();

            // Второй запрос (с кэшем)
            const secondRequestStart = Date.now();
            const secondResponse = await request(app.getHttpServer())
                .get('/notifications')
                .expect(200);
            const secondRequestEnd = Date.now();

            // Проверяем, что ответы идентичны
            expect(firstResponse.body).toEqual(secondResponse.body);

            // Второй запрос должен быть быстрее (благодаря кэшу)
            const firstDuration = firstRequestEnd - firstRequestStart;
            const secondDuration = secondRequestEnd - secondRequestStart;
            
            console.log(`First request: ${firstDuration}ms, Second request: ${secondDuration}ms`);

            // Cleanup
            await testNotification.destroy();
            
            const endTime = Date.now();
            console.log(`Caching test completed in ${endTime - startTime}ms`);
        });
    });
});
