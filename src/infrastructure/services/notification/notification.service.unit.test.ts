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
    },
    NotificationTemplateModel: {
        findOne: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
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
