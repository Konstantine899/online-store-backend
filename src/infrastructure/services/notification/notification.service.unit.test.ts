import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationModel, NotificationTemplateModel, NotificationType, NotificationStatus } from '@app/domain/models';
import { IEmailProvider, ISmsProvider, ITemplateRenderer } from '@app/domain/services';

// Mock провайдеры
const mockEmailProvider: jest.Mocked<IEmailProvider> = {
    sendEmail: jest.fn(),
    sendBulkEmails: jest.fn(),
    validateEmail: jest.fn(),
    getProviderInfo: jest.fn(),
};

const mockSmsProvider: jest.Mocked<ISmsProvider> = {
    sendSms: jest.fn(),
    sendBulkSms: jest.fn(),
    validatePhoneNumber: jest.fn(),
    getDeliveryReport: jest.fn(),
    getProviderInfo: jest.fn(),
    getBalance: jest.fn(),
};

const mockTemplateRenderer: jest.Mocked<ITemplateRenderer> = {
    renderTemplate: jest.fn(),
    validateTemplate: jest.fn(),
    extractVariables: jest.fn(),
    sanitizeTemplate: jest.fn(),
    getSupportedSyntax: jest.fn(),
};

// Mock модели
jest.mock('@app/domain/models', () => ({
    NotificationModel: {
        create: jest.fn(),
        findOne: jest.fn(),
        findAndCountAll: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        count: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
    },
    NotificationTemplateModel: {
        findOne: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
    },
    NotificationType: {
        EMAIL: 'email',
        PUSH: 'push',
    },
    NotificationStatus: {
        PENDING: 'pending',
        SENT: 'sent',
        DELIVERED: 'delivered',
        READ: 'read',
        FAILED: 'failed',
    },
}));

describe('NotificationService', () => {
    let service: NotificationService;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let module: TestingModule;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                {
                    provide: 'IEmailProvider',
                    useValue: mockEmailProvider,
                },
                {
                    provide: 'ISmsProvider',
                    useValue: mockSmsProvider,
                },
                {
                    provide: 'ITemplateRenderer',
                    useValue: mockTemplateRenderer,
                },
            ],
        }).compile();

        service = module.get<NotificationService>(NotificationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createNotification', () => {
        it('should create notification successfully', async () => {
            const createDto = {
                userId: 1,
                type: NotificationType.EMAIL,
                templateName: 'test_template',
                title: 'Test Title',
                message: 'Test Message',
                data: { key: 'value' },
            };

            const mockNotification = {
                id: 1,
                ...createDto,
                status: NotificationStatus.PENDING,
                isRead: false,
                isArchived: false,
                createdAt: new Date(),
            };

            (NotificationModel.create as jest.Mock).mockResolvedValue(mockNotification);

            const result = await service.createNotification(createDto);

            expect(NotificationModel.create).toHaveBeenCalledWith({
                userId: createDto.userId,
                type: createDto.type,
                templateName: createDto.templateName,
                title: createDto.title,
                message: createDto.message,
                data: createDto.data,
                status: NotificationStatus.PENDING,
                isRead: false,
                isArchived: false,
            });

            expect(result).toEqual(mockNotification);
        });

        it('should throw BadRequestException on create failure', async () => {
            const createDto = {
                userId: 1,
                type: NotificationType.EMAIL,
                templateName: 'test_template',
                title: 'Test Title',
                message: 'Test Message',
            };

            (NotificationModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

            await expect(service.createNotification(createDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('getNotificationById', () => {
        it('should return notification for user', async () => {
            const mockNotification = {
                id: 1,
                userId: 1,
                type: NotificationType.EMAIL,
                title: 'Test Title',
                message: 'Test Message',
            };

            (NotificationModel.findOne as jest.Mock).mockResolvedValue(mockNotification);

            const result = await service.getNotificationById(1, 1);

            expect(NotificationModel.findOne).toHaveBeenCalledWith({
                where: { id: 1, userId: 1 },
                include: expect.any(Array),
            });

            expect(result).toEqual(mockNotification);
        });

        it('should return notification without user filter for admin', async () => {
            const mockNotification = {
                id: 1,
                userId: 1,
                type: NotificationType.EMAIL,
                title: 'Test Title',
                message: 'Test Message',
            };

            (NotificationModel.findOne as jest.Mock).mockResolvedValue(mockNotification);

            const result = await service.getNotificationById(1);

            expect(NotificationModel.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                include: expect.any(Array),
            });

            expect(result).toEqual(mockNotification);
        });

        it('should return null when notification not found', async () => {
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(null);

            const result = await service.getNotificationById(999, 1);

            expect(result).toBeNull();
        });
    });

    describe('getNotifications', () => {
        it('should return paginated notifications with filters', async () => {
            const filters = {
                userId: 1,
                type: NotificationType.EMAIL,
                status: NotificationStatus.SENT,
                page: 1,
                limit: 10,
            };

        const mockNotifications = [
            { id: 1, userId: 1, type: NotificationType.EMAIL, status: NotificationStatus.SENT },
            { id: 2, userId: 1, type: NotificationType.EMAIL, status: NotificationStatus.SENT },
        ] as NotificationModel[];

            (NotificationModel.findAndCountAll as jest.Mock).mockResolvedValue({
                count: 2,
                rows: mockNotifications,
            });

            const result = await service.getNotifications(filters);

            expect(NotificationModel.findAndCountAll).toHaveBeenCalledWith({
                where: {
                    userId: 1,
                    type: NotificationType.EMAIL,
                    status: NotificationStatus.SENT,
                },
                order: [['createdAt', 'DESC']],
                limit: 10,
                offset: 0,
                include: expect.any(Array),
            });

            expect(result.data).toEqual(mockNotifications);
            expect(result.meta.totalCount).toBe(2);
            expect(result.meta.currentPage).toBe(1);
        });

        it('should apply tenant isolation by requiring userId', async () => {
            const filters = {
                type: NotificationType.EMAIL,
                page: 1,
                limit: 10,
            };

            await service.getNotifications(filters);

            expect(NotificationModel.findAndCountAll).toHaveBeenCalledWith({
                where: {
                    type: NotificationType.EMAIL,
                },
                order: [['createdAt', 'DESC']],
                limit: 10,
                offset: 0,
                include: expect.any(Array),
            });
        });
    });

    describe('updateNotification', () => {
        it('should update notification successfully', async () => {
            const updateDto = {
                status: NotificationStatus.SENT,
                isRead: true,
                readAt: new Date(),
            };

        const mockUpdatedNotification = {
            id: 1,
            userId: 1,
            ...updateDto,
        } as NotificationModel;

            (NotificationModel.update as jest.Mock).mockResolvedValue([1]);
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(mockUpdatedNotification);

            const result = await service.updateNotification(1, updateDto, 1);

            expect(NotificationModel.update).toHaveBeenCalledWith(updateDto, {
                where: { id: 1, userId: 1 },
            });

            expect(result).toEqual(mockUpdatedNotification);
        });

        it('should throw NotFoundException when notification not found', async () => {
            const updateDto = { status: NotificationStatus.SENT };

            (NotificationModel.update as jest.Mock).mockResolvedValue([0]);

            await expect(service.updateNotification(1, updateDto, 1)).rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteNotification', () => {
        it('should delete notification successfully', async () => {
            (NotificationModel.destroy as jest.Mock).mockResolvedValue(1);

            await service.deleteNotification(1, 1);

            expect(NotificationModel.destroy).toHaveBeenCalledWith({
                where: { id: 1, userId: 1 },
            });
        });

        it('should throw NotFoundException when notification not found', async () => {
            (NotificationModel.destroy as jest.Mock).mockResolvedValue(0);

            await expect(service.deleteNotification(1, 1)).rejects.toThrow(NotFoundException);
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
        const mockNotification = {
            id: 1,
            userId: 1,
            isRead: true,
            readAt: new Date(),
            status: NotificationStatus.READ,
        } as NotificationModel;

            (NotificationModel.update as jest.Mock).mockResolvedValue([1]);
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(mockNotification);

            const result = await service.markAsRead(1, 1);

            expect(NotificationModel.update).toHaveBeenCalledWith({
                isRead: true,
                readAt: expect.any(Date),
                status: NotificationStatus.READ,
            }, {
                where: { id: 1, userId: 1 },
            });

            expect(result).toEqual(mockNotification);
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread count for user', async () => {
            (NotificationModel.count as jest.Mock).mockResolvedValue(5);

            const result = await service.getUnreadCount(1);

            expect(NotificationModel.count).toHaveBeenCalledWith({
                where: {
                    userId: 1,
                    isRead: false,
                    isArchived: false,
                },
            });

            expect(result).toBe(5);
        });
    });

    describe('getStatistics', () => {
        it('should return notification statistics', async () => {
        const mockNotifications = [
            { status: NotificationStatus.SENT, type: NotificationType.EMAIL },
            { status: NotificationStatus.DELIVERED, type: NotificationType.EMAIL },
            { status: NotificationStatus.READ, type: NotificationType.PUSH },
            { status: NotificationStatus.FAILED, type: NotificationType.EMAIL },
        ] as NotificationModel[];

            (NotificationModel.findAll as jest.Mock).mockResolvedValue(mockNotifications);

            const result = await service.getStatistics(1, '7d', NotificationType.EMAIL);

            expect(NotificationModel.findAll).toHaveBeenCalledWith({
                where: {
                    userId: 1,
                    type: NotificationType.EMAIL,
                    createdAt: expect.any(Object),
                },
                attributes: ['status', 'type'],
            });

            expect(result.totalSent).toBe(4);
            expect(result.totalDelivered).toBe(2);
            expect(result.totalRead).toBe(1);
            expect(result.byType.email).toBe(3);
            expect(result.byType.push).toBe(1);
        });
    });

    describe('sendNotification', () => {
        it('should send email notification successfully', async () => {
            const createDto = {
                userId: 1,
                type: NotificationType.EMAIL,
                templateName: 'test_template',
                title: 'Test Title',
                message: 'Test Message',
            };

        const mockNotification = {
            id: 1,
            ...createDto,
            status: NotificationStatus.PENDING,
        } as NotificationModel;

            (NotificationModel.create as jest.Mock).mockResolvedValue(mockNotification);
            (NotificationModel.update as jest.Mock).mockResolvedValue([1]);

            const result = await service.sendNotification(createDto);

            expect(NotificationModel.create).toHaveBeenCalled();
            expect(NotificationModel.update).toHaveBeenCalledWith({
                status: NotificationStatus.SENT,
                sentAt: expect.any(Date),
            }, {
                where: { id: 1 },
            });

            expect(result).toEqual(mockNotification);
        });

        it('should handle send failure', async () => {
            const createDto = {
                userId: 1,
                type: NotificationType.EMAIL,
                templateName: 'test_template',
                title: 'Test Title',
                message: 'Test Message',
            };

        const mockNotification = {
            id: 1,
            ...createDto,
            status: NotificationStatus.PENDING,
        } as NotificationModel;

            (NotificationModel.create as jest.Mock).mockResolvedValue(mockNotification);
            (NotificationModel.update as jest.Mock).mockResolvedValue([1]);

            // Mock ошибку отправки
            jest.spyOn(service as unknown as { sendEmailNotification: jest.Mock }, 'sendEmailNotification').mockRejectedValue(new Error('Send failed'));

            await expect(service.sendNotification(createDto)).rejects.toThrow('Send failed');

            expect(NotificationModel.update).toHaveBeenCalledWith({
                status: NotificationStatus.FAILED,
                failedReason: 'Send failed',
            }, {
                where: { id: 1 },
            });
        });
    });

    describe('getTemplates', () => {
        it('should return templates with filters', async () => {
        const mockTemplates = [
            { id: 1, name: 'template1', type: NotificationType.EMAIL, isActive: true },
            { id: 2, name: 'template2', type: NotificationType.PUSH, isActive: true },
        ] as NotificationTemplateModel[];

            (NotificationTemplateModel.findAll as jest.Mock).mockResolvedValue(mockTemplates);

            const result = await service.getTemplates({ type: NotificationType.EMAIL, isActive: true });

            expect(NotificationTemplateModel.findAll).toHaveBeenCalledWith({
                where: {
                    type: NotificationType.EMAIL,
                    isActive: true,
                },
                order: [['name', 'ASC']],
            });

            expect(result).toEqual(mockTemplates);
        });
    });

    describe('getTemplateByName', () => {
        it('should return template by name', async () => {
        const mockTemplate = {
            id: 1,
            name: 'test_template',
            type: NotificationType.EMAIL,
            isActive: true,
        } as NotificationTemplateModel;

            (NotificationTemplateModel.findOne as jest.Mock).mockResolvedValue(mockTemplate);

            const result = await service.getTemplateByName('test_template');

            expect(NotificationTemplateModel.findOne).toHaveBeenCalledWith({
                where: { name: 'test_template', isActive: true },
            });

            expect(result).toEqual(mockTemplate);
        });
    });

    describe('markAsUnread', () => {
        it('should mark notification as unread', async () => {
            const mockNotification = {
                id: 1,
                userId: 1,
                isRead: false,
                status: NotificationStatus.SENT,
            } as NotificationModel;

            (NotificationModel.update as jest.Mock).mockResolvedValue([1]);
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(mockNotification);

            const result = await service.markAsUnread(1, 1);

            expect(NotificationModel.update).toHaveBeenCalledWith({
                isRead: false,
                readAt: null,
            }, {
                where: { id: 1, userId: 1 },
            });

            expect(result).toEqual(mockNotification);
        });
    });

    describe('archiveNotification', () => {
        it('should archive notification', async () => {
            const mockNotification = {
                id: 1,
                userId: 1,
                isArchived: true,
            } as NotificationModel;

            (NotificationModel.update as jest.Mock).mockResolvedValue([1]);
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(mockNotification);

            const result = await service.archiveNotification(1, 1);

            expect(NotificationModel.update).toHaveBeenCalledWith({
                isArchived: true,
            }, {
                where: { id: 1, userId: 1 },
            });

            expect(result).toEqual(mockNotification);
        });
    });

    describe('unarchiveNotification', () => {
        it('should unarchive notification', async () => {
            const mockNotification = {
                id: 1,
                userId: 1,
                isArchived: false,
            } as NotificationModel;

            (NotificationModel.update as jest.Mock).mockResolvedValue([1]);
            (NotificationModel.findOne as jest.Mock).mockResolvedValue(mockNotification);

            const result = await service.unarchiveNotification(1, 1);

            expect(NotificationModel.update).toHaveBeenCalledWith({
                isArchived: false,
            }, {
                where: { id: 1, userId: 1 },
            });

            expect(result).toEqual(mockNotification);
        });
    });

    describe('sendBulkNotifications', () => {
        it('should send multiple notifications successfully', async () => {
            const notifications = [
                {
                    userId: 1,
                    type: NotificationType.EMAIL,
                    templateName: 'test_template',
                    title: 'Test 1',
                    message: 'Message 1',
                },
                {
                    userId: 2,
                    type: NotificationType.PUSH,
                    templateName: 'test_template',
                    title: 'Test 2',
                    message: 'Message 2',
                },
            ];

            const mockNotifications = [
                { id: 1, ...notifications[0], status: NotificationStatus.SENT },
                { id: 2, ...notifications[1], status: NotificationStatus.SENT },
            ] as NotificationModel[];

            (NotificationModel.create as jest.Mock)
                .mockResolvedValueOnce(mockNotifications[0])
                .mockResolvedValueOnce(mockNotifications[1]);
            (NotificationModel.update as jest.Mock).mockResolvedValue([1]);

            const results = await service.sendBulkNotifications(notifications);

            expect(results).toHaveLength(2);
            expect(NotificationModel.create).toHaveBeenCalledTimes(2);
            expect(NotificationModel.update).toHaveBeenCalledTimes(2);
        });

        it('should handle partial failures in bulk notifications', async () => {
            const notifications = [
                {
                    userId: 1,
                    type: NotificationType.EMAIL,
                    templateName: 'test_template',
                    title: 'Test 1',
                    message: 'Message 1',
                },
                {
                    userId: 2,
                    type: NotificationType.EMAIL,
                    templateName: 'test_template',
                    title: 'Test 2',
                    message: 'Message 2',
                },
            ];

            const mockNotification = { id: 1, ...notifications[0], status: NotificationStatus.SENT } as NotificationModel;

            (NotificationModel.create as jest.Mock)
                .mockResolvedValueOnce(mockNotification)
                .mockRejectedValueOnce(new Error('Database error'));
            (NotificationModel.update as jest.Mock).mockResolvedValue([1]);

            const results = await service.sendBulkNotifications(notifications);

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual(mockNotification);
        });
    });

    describe('createTemplate', () => {
        it('should create template successfully', async () => {
            const createDto = {
                name: 'test_template',
                type: NotificationType.EMAIL,
                title: 'Test Template',
                message: 'Test message with {{variable}}',
                isActive: true,
            };

            const mockTemplate = {
                id: 1,
                ...createDto,
            } as NotificationTemplateModel;

            (NotificationTemplateModel.create as jest.Mock).mockResolvedValue(mockTemplate);

            const result = await service.createTemplate(createDto);

            expect(NotificationTemplateModel.create).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(mockTemplate);
        });

        it('should throw BadRequestException when required fields are missing', async () => {
            const createDto = {
                name: 'test_template',
                // Missing type, title, message
            };

            await expect(service.createTemplate(createDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('getTemplateById', () => {
        it('should return template by id', async () => {
            const mockTemplate = {
                id: 1,
                name: 'test_template',
                type: NotificationType.EMAIL,
            } as NotificationTemplateModel;

            (NotificationTemplateModel.findByPk as jest.Mock).mockResolvedValue(mockTemplate);

            const result = await service.getTemplateById(1);

            expect(NotificationTemplateModel.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockTemplate);
        });

        it('should return null when template not found', async () => {
            (NotificationTemplateModel.findByPk as jest.Mock).mockResolvedValue(null);

            const result = await service.getTemplateById(999);

            expect(result).toBeNull();
        });
    });

    describe('updateTemplate', () => {
        it('should update template successfully', async () => {
            const updateDto = {
                title: 'Updated Title',
                message: 'Updated message',
            };

            const mockUpdatedTemplate = {
                id: 1,
                name: 'test_template',
                type: NotificationType.EMAIL,
                ...updateDto,
            } as NotificationTemplateModel;

            (NotificationTemplateModel.update as jest.Mock).mockResolvedValue([1]);
            (NotificationTemplateModel.findByPk as jest.Mock).mockResolvedValue(mockUpdatedTemplate);

            const result = await service.updateTemplate(1, updateDto);

            expect(NotificationTemplateModel.update).toHaveBeenCalledWith(updateDto, {
                where: { id: 1 },
            });
            expect(result).toEqual(mockUpdatedTemplate);
        });

        it('should throw NotFoundException when template not found', async () => {
            const updateDto = { title: 'Updated Title' };

            (NotificationTemplateModel.update as jest.Mock).mockResolvedValue([0]);

            await expect(service.updateTemplate(999, updateDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteTemplate', () => {
        it('should delete template successfully', async () => {
            (NotificationTemplateModel.destroy as jest.Mock).mockResolvedValue(1);

            await service.deleteTemplate(1);

            expect(NotificationTemplateModel.destroy).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it('should throw NotFoundException when template not found', async () => {
            (NotificationTemplateModel.destroy as jest.Mock).mockResolvedValue(0);

            await expect(service.deleteTemplate(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('createTemplateFromNotification', () => {
        it('should create template from notification successfully', async () => {
            const mockNotification = {
                id: 1,
                title: 'Test Title',
                message: 'Test message',
                type: NotificationType.EMAIL,
            } as NotificationModel;

            const mockTemplate = {
                id: 1,
                name: 'notification_1_template',
                type: NotificationType.EMAIL,
                title: 'Test Title',
                message: 'Test message',
            } as NotificationTemplateModel;

            // Mock the private method call
            const serviceInstance = service as unknown as { createTemplateFromNotification: (id: number) => Promise<NotificationTemplateModel> };
            jest.spyOn(serviceInstance, 'createTemplateFromNotification').mockImplementation(async (id: number) => {
                const notification = await NotificationModel.findByPk(id);
                if (!notification) {
                    throw new NotFoundException(`Уведомление с ID ${id} не найдено.`);
                }
                
                const template = await NotificationTemplateModel.create({
                    name: `notification_${id}_template`,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    isActive: true,
                });
                
                return template;
            });

            (NotificationModel.findByPk as jest.Mock).mockResolvedValue(mockNotification);
            (NotificationTemplateModel.create as jest.Mock).mockResolvedValue(mockTemplate);

            const result = await service.createTemplateFromNotification(1);

            expect(NotificationModel.findByPk).toHaveBeenCalledWith(1);
            expect(NotificationTemplateModel.create).toHaveBeenCalledWith({
                name: 'notification_1_template',
                type: NotificationType.EMAIL,
                title: 'Test Title',
                message: 'Test message',
                isActive: true,
            });
            expect(result).toEqual(mockTemplate);
        });

        it('should throw NotFoundException when notification not found', async () => {
            // Mock the private method call to throw NotFoundException
            const serviceInstance = service as unknown as { createTemplateFromNotification: (id: number) => Promise<NotificationTemplateModel> };
            jest.spyOn(serviceInstance, 'createTemplateFromNotification').mockImplementation(async (id: number) => {
                const notification = await NotificationModel.findByPk(id);
                if (!notification) {
                    throw new NotFoundException(`Уведомление с ID ${id} не найдено.`);
                }
                return {} as NotificationTemplateModel;
            });

            (NotificationModel.findByPk as jest.Mock).mockResolvedValue(null);

            await expect(service.createTemplateFromNotification(999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('parsePeriod', () => {
        it('should parse period correctly', () => {
            const service = new NotificationService(mockEmailProvider, mockSmsProvider, mockTemplateRenderer);

            expect((service as unknown as { parsePeriod: (period: string) => number }).parsePeriod('7d')).toBe(7 * 24 * 60 * 60);
            expect((service as unknown as { parsePeriod: (period: string) => number }).parsePeriod('24h')).toBe(24 * 60 * 60);
            expect((service as unknown as { parsePeriod: (period: string) => number }).parsePeriod('30m')).toBe(30 * 60);
            expect((service as unknown as { parsePeriod: (period: string) => number }).parsePeriod('60s')).toBe(60);
        });

        it('should throw BadRequestException for invalid period', () => {
            const service = new NotificationService(mockEmailProvider, mockSmsProvider, mockTemplateRenderer);

            expect(() => (service as unknown as { parsePeriod: (period: string) => number }).parsePeriod('invalid')).toThrow(BadRequestException);
            expect(() => (service as unknown as { parsePeriod: (period: string) => number }).parsePeriod('7x')).toThrow(BadRequestException);
        });
    });
});
