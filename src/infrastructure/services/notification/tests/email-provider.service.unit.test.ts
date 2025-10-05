import { Test, TestingModule } from '@nestjs/testing';
import { EmailProviderService } from '../email-provider.service';
import { EmailMessage, EmailAttachment } from '@app/domain/services';

describe('EmailProviderService', () => {
    let service: EmailProviderService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [EmailProviderService],
        }).compile();

        service = module.get<EmailProviderService>(EmailProviderService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendEmail', () => {
        it('should send email successfully with valid email', async () => {
            const message: EmailMessage = {
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Test message',
            };

            const result = await service.sendEmail(message);

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
            expect(result.provider).toBe('MockEmailProvider');
            expect(result.error).toBeUndefined();
        });

        it('should send email with HTML content', async () => {
            const message: EmailMessage = {
                to: 'test@example.com',
                subject: 'Test Subject',
                html: '<h1>Test HTML</h1>',
            };

            const result = await service.sendEmail(message);

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
        });

        it('should fail with invalid email format', async () => {
            const message: EmailMessage = {
                to: 'invalid-email',
                subject: 'Test Subject',
                text: 'Test message',
            };

            const result = await service.sendEmail(message);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Неверный формат email адреса');
            expect(result.provider).toBe('MockEmailProvider');
        });

        it('should handle email with attachments', async () => {
            const attachment: EmailAttachment = {
                filename: 'test.txt',
                content: 'test content',
                contentType: 'text/plain',
            };

            const message: EmailMessage = {
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Test message',
                attachments: [attachment],
            };

            const result = await service.sendEmail(message);

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
        });

        it('should handle email with attachments', async () => {
            const attachment: EmailAttachment = {
                filename: 'test.txt',
                content: 'test content',
                contentType: 'text/plain',
            };

            const message: EmailMessage = {
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Test message',
                attachments: [attachment],
            };

            const result = await service.sendEmail(message);

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
        });
    });

    describe('sendBulkEmails', () => {
        it('should send multiple emails successfully', async () => {
            const messages: EmailMessage[] = [
                {
                    to: 'test1@example.com',
                    subject: 'Test 1',
                    text: 'Message 1',
                },
                {
                    to: 'test2@example.com',
                    subject: 'Test 2',
                    text: 'Message 2',
                },
            ];

            const results = await service.sendBulkEmails(messages);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(true);
        });

        it('should handle mixed success and failure in bulk emails', async () => {
            const messages: EmailMessage[] = [
                {
                    to: 'test@example.com',
                    subject: 'Valid Email',
                    text: 'Valid message',
                },
                {
                    to: 'invalid-email',
                    subject: 'Invalid Email',
                    text: 'Invalid message',
                },
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
            const attachment: EmailAttachment = {
                filename: 'test.txt',
                content: 'small content',
                contentType: 'text/plain',
            };

            const isValid = await service.validateAttachment(attachment);

            expect(isValid).toBe(true);
        });

        it('should validate buffer attachment within size limit', async () => {
            const attachment: EmailAttachment = {
                filename: 'test.txt',
                content: Buffer.from('small content'),
                contentType: 'text/plain',
            };

            const isValid = await service.validateAttachment(attachment);

            expect(isValid).toBe(true);
        });

        it('should reject attachment exceeding size limit', async () => {
            const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
            const attachment: EmailAttachment = {
                filename: 'large.txt',
                content: largeContent,
                contentType: 'text/plain',
            };

            const isValid = await service.validateAttachment(attachment);

            expect(isValid).toBe(false);
        });

        it('should reject invalid attachment content', async () => {
            const attachment: EmailAttachment = {
                filename: 'test.txt',
                content: null as unknown as string,
                contentType: 'text/plain',
            };

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
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

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
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const message: EmailMessage = {
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Test message',
            };

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
});
