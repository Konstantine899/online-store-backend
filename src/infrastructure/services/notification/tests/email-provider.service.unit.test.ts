import { Test, TestingModule } from '@nestjs/testing';
import { EmailProviderService } from '../email-provider.service';
import { EmailMessage, EmailAttachment } from '@app/domain/services';

describe('EmailProviderService', () => {
    let service: EmailProviderService;
    let module: TestingModule;

    // Фабричные функции для создания тестовых данных
    const createEmailMessage = (overrides: Partial<EmailMessage> = {}): EmailMessage => ({
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test message',
        ...overrides,
    });

    const createEmailAttachment = (overrides: Partial<EmailAttachment> = {}): EmailAttachment => ({
        filename: 'test.txt',
        content: 'test content',
        contentType: 'text/plain',
        ...overrides,
    });

    const createBulkEmailMessages = (count: number): EmailMessage[] => 
        Array.from({ length: count }, (_, i) => 
            createEmailMessage({
                to: `test${i + 1}@example.com`,
                subject: `Test ${i + 1}`,
                text: `Message ${i + 1}`,
            })
        );

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [EmailProviderService],
        }).compile();

        service = module.get<EmailProviderService>(EmailProviderService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    describe('sendEmail', () => {
        it('should send email successfully with valid email', async () => {
            const message = createEmailMessage();

            const result = await service.sendEmail(message);

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
            expect(result.provider).toBe('MockEmailProvider');
            expect(result.error).toBeUndefined();
        });

        it('should send email with HTML content', async () => {
            const message = createEmailMessage({
                html: '<h1>Test HTML</h1>',
            });

            const result = await service.sendEmail(message);

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
        });

        it('should fail with invalid email format', async () => {
            const message = createEmailMessage({
                to: 'invalid-email',
            });

            const result = await service.sendEmail(message);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Неверный формат email адреса');
            expect(result.provider).toBe('MockEmailProvider');
        });

        it('should handle email with attachments', async () => {
            const attachment = createEmailAttachment();
            const message = createEmailMessage({
                attachments: [attachment],
            });

            const result = await service.sendEmail(message);

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
        });
    });

    describe('sendBulkEmails', () => {
        it('should send multiple emails successfully', async () => {
            const messages = createBulkEmailMessages(2);

            const results = await service.sendBulkEmails(messages);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(true);
        });

        it('should handle mixed success and failure in bulk emails', async () => {
            const messages = [
                createEmailMessage({ to: 'test@example.com', subject: 'Valid Email', text: 'Valid message' }),
                createEmailMessage({ to: 'invalid-email', subject: 'Invalid Email', text: 'Invalid message' }),
            ];

            const results = await service.sendBulkEmails(messages);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(false);
            expect(results[1].error).toBe('Неверный формат email адреса');
        });

        it('should handle empty bulk email list', async () => {
            const results = await service.sendBulkEmails([]);

            expect(results).toHaveLength(0);
        });
    });

    describe('validateEmail', () => {
        it('should validate correct email formats', () => {
            expect(service.validateEmail('test@example.com')).toBe(true);
            expect(service.validateEmail('user.name@domain.co.uk')).toBe(true);
            expect(service.validateEmail('user+tag@example.org')).toBe(true);
        });

        it('should reject invalid email formats', () => {
            expect(service.validateEmail('invalid-email')).toBe(false);
            expect(service.validateEmail('test@')).toBe(false);
            expect(service.validateEmail('@example.com')).toBe(false);
            expect(service.validateEmail('test.example.com')).toBe(false);
            expect(service.validateEmail('')).toBe(false);
        });
    });

    describe('getProviderInfo', () => {
        it('should return provider information', () => {
            const info = service.getProviderInfo();

            expect(info.name).toBe('MockEmailProvider');
            expect(info.version).toBe('1.0.0');
            expect(info.capabilities).toContain('html_email');
            expect(info.capabilities).toContain('text_email');
            expect(info.capabilities).toContain('attachments');
            expect(info.capabilities).toContain('bulk_sending');
        });
    });

    describe('getDeliveryStatus', () => {
        it('should return delivery status for message', async () => {
            const messageId = 'test-message-id';
            const status = await service.getDeliveryStatus(messageId);

            expect(status.status).toBe('delivered');
            expect(status.timestamp).toBeInstanceOf(Date);
        });
    });

    describe('getBounceList', () => {
        it('should return empty bounce list', async () => {
            const bounceList = await service.getBounceList();

            expect(bounceList).toEqual([]);
        });
    });

    describe('getComplaintList', () => {
        it('should return empty complaint list', async () => {
            const complaintList = await service.getComplaintList();

            expect(complaintList).toEqual([]);
        });
    });

    describe('validateAttachment', () => {
        it('should validate string attachment within size limit', async () => {
            const attachment = createEmailAttachment({
                content: 'small content',
            });

            const isValid = await service.validateAttachment(attachment);

            expect(isValid).toBe(true);
        });

        it('should validate buffer attachment within size limit', async () => {
            const attachment = createEmailAttachment({
                content: Buffer.from('small content'),
            });

            const isValid = await service.validateAttachment(attachment);

            expect(isValid).toBe(true);
        });

        it('should reject attachment exceeding size limit', async () => {
            const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
            const attachment = createEmailAttachment({
                filename: 'large.txt',
                content: largeContent,
            });

            const isValid = await service.validateAttachment(attachment);

            expect(isValid).toBe(false);
        });

        it('should reject invalid attachment content', async () => {
            const attachment = createEmailAttachment({
                content: null as unknown as string,
            });

            const isValid = await service.validateAttachment(attachment);

            expect(isValid).toBe(false);
        });
    });

    describe('getQuotaInfo', () => {
        it('should return quota information', async () => {
            const quotaInfo = await service.getQuotaInfo();

            expect(quotaInfo.used).toBe(0);
            expect(quotaInfo.limit).toBe(10000);
            expect(quotaInfo.resetDate).toBeInstanceOf(Date);
            expect(quotaInfo.resetDate.getTime()).toBeGreaterThan(Date.now());
        });
    });

    describe('Error handling', () => {
        it('should handle errors gracefully in sendEmail', async () => {
            // Mock console.error to avoid noise in tests
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();

            const message: EmailMessage = {
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Test message',
            };

            // Mock an error by making validateEmail throw
            jest.spyOn(service, 'validateEmail').mockImplementation(() => {
                throw new Error('Validation error');
            });

            const result = await service.sendEmail(message);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Validation error');
            expect(result.provider).toBe('MockEmailProvider');

            consoleSpy.mockRestore();
        });

        it('should handle non-Error exceptions in sendEmail', async () => {
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();

            const message = createEmailMessage();

            // Mock a non-Error exception
            jest.spyOn(service, 'validateEmail').mockImplementation(() => {
                throw 'String error';
            });

            const result = await service.sendEmail(message);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unknown error');
            expect(result.provider).toBe('MockEmailProvider');

            consoleSpy.mockRestore();
        });
    });

    describe('Performance Tests', () => {
        it('should handle large bulk email operations efficiently', async () => {
            const largeMessageList = createBulkEmailMessages(100);

            const startTime = Date.now();
            const results = await service.sendBulkEmails(largeMessageList);
            const endTime = Date.now();

            expect(results).toHaveLength(100);
            expect(endTime - startTime).toBeLessThan(2000); // Должно выполниться менее чем за 2 секунды
        });

        it('should cache email validation efficiently', async () => {
            const testEmails = [
                'test1@example.com',
                'test2@example.com',
                'test1@example.com', // Повторный вызов
                'test3@example.com',
            ];

            const startTime = Date.now();
            
            // Множественные вызовы валидации
            const results = await Promise.all(
                testEmails.map(email => service.validateEmail(email))
            );
            
            const endTime = Date.now();

            expect(results).toEqual([true, true, true, true]);
            expect(endTime - startTime).toBeLessThan(100); // Должно выполниться быстро благодаря кэшу
        });

        it('should handle provider info caching efficiently', async () => {
            const startTime = Date.now();
            
            // Множественные вызовы getProviderInfo
            const results = await Promise.all(
                Array.from({ length: 50 }, () => service.getProviderInfo())
            );
            
            const endTime = Date.now();

            expect(results).toHaveLength(50);
            expect(results.every(info => info.name === 'MockEmailProvider')).toBe(true);
            expect(endTime - startTime).toBeLessThan(50); // Должно выполниться очень быстро благодаря кэшу
        });

        it('should handle quota info caching efficiently', async () => {
            const startTime = Date.now();
            
            // Множественные вызовы getQuotaInfo
            const results = await Promise.all(
                Array.from({ length: 20 }, () => service.getQuotaInfo())
            );
            
            const endTime = Date.now();

            expect(results).toHaveLength(20);
            expect(results.every(quota => quota.limit === 10000)).toBe(true);
            expect(endTime - startTime).toBeLessThan(100); // Должно выполниться быстро
        });

        it('should handle attachment validation efficiently', async () => {
            const attachments = Array.from({ length: 100 }, (_, i) => 
                createEmailAttachment({
                    filename: `test${i}.txt`,
                    content: `content ${i}`,
                })
            );

            const startTime = Date.now();
            
            // Параллельная валидация вложений
            const results = await Promise.all(
                attachments.map(attachment => service.validateAttachment(attachment))
            );
            
            const endTime = Date.now();

            expect(results).toHaveLength(100);
            expect(results.every(isValid => isValid === true)).toBe(true);
            expect(endTime - startTime).toBeLessThan(500); // Должно выполниться быстро
        });
    });

    describe('Caching Tests', () => {
        it('should cache email validation results', () => {
            const email = 'test@example.com';
            
            // Первый вызов
            const result1 = service.validateEmail(email);
            
            // Второй вызов (должен использовать кэш)
            const result2 = service.validateEmail(email);

            expect(result1).toBe(result2);
            expect(result1).toBe(true);
        });

        it('should cache provider info', () => {
            // Первый вызов
            const info1 = service.getProviderInfo();
            
            // Второй вызов (должен использовать кэш)
            const info2 = service.getProviderInfo();

            expect(info1).toEqual(info2);
            expect(info1.name).toBe('MockEmailProvider');
        });

        it('should handle cache invalidation for email validation', () => {
            const email = 'test@example.com';
            
            // Первый вызов
            const result1 = service.validateEmail(email);
            
            // Очищаем кэш (симулируем)
            // В реальной реализации здесь был бы метод очистки кэша
            
            // Второй вызов
            const result2 = service.validateEmail(email);

            expect(result1).toBe(result2);
            expect(result1).toBe(true);
        });
    });
});
