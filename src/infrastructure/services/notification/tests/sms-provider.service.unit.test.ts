import { Test, TestingModule } from '@nestjs/testing';
import { SmsProviderService } from '../sms-provider.service';
import { SmsMessage } from '@app/domain/services';

describe('SmsProviderService', () => {
    let service: SmsProviderService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SmsProviderService],
        }).compile();

        service = module.get<SmsProviderService>(SmsProviderService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendSms', () => {
        it('should send SMS successfully with valid Russian phone number', async () => {
            const message: SmsMessage = {
                to: '+79991234567',
                message: 'Test SMS message',
            };

            const result = await service.sendSms(message);

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
            expect(result.provider).toBe('MockSmsProvider');
            expect(result.cost).toBeDefined();
            expect(result.deliveryStatus).toBe('pending');
            expect(result.error).toBeUndefined();
        });

        it('should send SMS with international phone number', async () => {
            const message: SmsMessage = {
                to: '+1234567890',
                message: 'International SMS',
            };

            const result = await service.sendSms(message);

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
        });

        it('should fail with invalid phone number format', async () => {
            const message: SmsMessage = {
                to: 'invalid-phone',
                message: 'Test SMS message',
            };

            const result = await service.sendSms(message);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Неверный формат номера телефона');
            expect(result.provider).toBe('MockSmsProvider');
        });

        it('should calculate cost correctly for Latin text', async () => {
            const message: SmsMessage = {
                to: '+79991234567',
                message: 'A'.repeat(160), // Exactly 1 SMS
            };

            const result = await service.sendSms(message);

            expect(result.success).toBe(true);
            expect(result.cost).toBe(1.5); // 1 SMS * 1.5 rubles
        });

        it('should calculate cost correctly for Cyrillic text', async () => {
            const message: SmsMessage = {
                to: '+79991234567',
                message: 'А'.repeat(70), // Exactly 1 SMS in Cyrillic
            };

            const result = await service.sendSms(message);

            expect(result.success).toBe(true);
            expect(result.cost).toBe(1.5); // 1 SMS * 1.5 rubles
        });

        it('should calculate cost for multiple SMS', async () => {
            const message: SmsMessage = {
                to: '+79991234567',
                message: 'A'.repeat(320), // 2 SMS
            };

            const result = await service.sendSms(message);

            expect(result.success).toBe(true);
            expect(result.cost).toBe(3.0); // 2 SMS * 1.5 rubles
        });
    });

    describe('sendBulkSms', () => {
        it('should send multiple SMS successfully', async () => {
            const messages: SmsMessage[] = [
                {
                    to: '+79991234567',
                    message: 'Message 1',
                },
                {
                    to: '+79991234568',
                    message: 'Message 2',
                },
            ];

            const results = await service.sendBulkSms(messages);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(true);
        });

        it('should handle mixed success and failure in bulk SMS', async () => {
            const messages: SmsMessage[] = [
                {
                    to: '+79991234567',
                    message: 'Valid SMS',
                },
                {
                    to: 'invalid-phone',
                    message: 'Invalid SMS',
                },
            ];

            const results = await service.sendBulkSms(messages);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(false);
            expect(results[1].error).toBe('Неверный формат номера телефона');
        });

        it('should handle empty bulk SMS list', async () => {
            const results = await service.sendBulkSms([]);

            expect(results).toHaveLength(0);
        });
    });

    describe('validatePhoneNumber', () => {
        it('should validate correct Russian phone numbers', () => {
            expect(service.validatePhoneNumber('+79991234567')).toBe(true);
            expect(service.validatePhoneNumber('79991234567')).toBe(true);
            expect(service.validatePhoneNumber('89991234567')).toBe(true);
            expect(service.validatePhoneNumber('+7 (999) 123-45-67')).toBe(true);
        });

        it('should validate correct international phone numbers', () => {
            expect(service.validatePhoneNumber('+1234567890')).toBe(true);
            expect(service.validatePhoneNumber('+44123456789')).toBe(true);
            expect(service.validatePhoneNumber('+8612345678901')).toBe(true);
        });

        it('should reject invalid phone numbers', () => {
            expect(service.validatePhoneNumber('invalid-phone')).toBe(false);
            expect(service.validatePhoneNumber('123')).toBe(false);
            expect(service.validatePhoneNumber('+7999123456789')).toBe(false); // Too long
            expect(service.validatePhoneNumber('')).toBe(false);
        });
    });

    describe('getDeliveryReport', () => {
        it('should return delivery report for message', async () => {
            const messageId = 'test-message-id';
            const report = await service.getDeliveryReport(messageId);

            expect(report).toBeDefined();
            expect(report?.messageId).toBe(messageId);
            expect(report?.status).toBe('delivered');
            expect(report?.timestamp).toBeInstanceOf(Date);
            expect(report?.cost).toBe(1.5);
        });

        it('should handle errors in getDeliveryReport', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Create a new service instance with mocked method
            const mockService = {
                ...service,
                getDeliveryReport: jest.fn().mockRejectedValue(new Error('Database error'))
            };

            const report = await mockService.getDeliveryReport('test-id');

            expect(report).toBeNull();

            consoleSpy.mockRestore();
        });
    });

    describe('getProviderInfo', () => {
        it('should return provider information', () => {
            const info = service.getProviderInfo();

            expect(info.name).toBe('MockSmsProvider');
            expect(info.version).toBe('1.0.0');
            expect(info.capabilities).toContain('sms_sending');
            expect(info.capabilities).toContain('bulk_sms');
            expect(info.capabilities).toContain('delivery_reports');
            expect(info.capabilities).toContain('international_sms');
        });
    });

    describe('getBalance', () => {
        it('should return mock balance', async () => {
            const balance = await service.getBalance();

            expect(balance).toBe(1000.0);
        });
    });

    describe('getSmsHistory', () => {
        it('should return empty SMS history', async () => {
            const history = await service.getSmsHistory();

            expect(history).toEqual([]);
        });

        it('should return empty SMS history for specific phone', async () => {
            const history = await service.getSmsHistory('+79991234567', 50);

            expect(history).toEqual([]);
        });
    });

    describe('getBlacklist', () => {
        it('should return empty blacklist', async () => {
            const blacklist = await service.getBlacklist();

            expect(blacklist).toEqual([]);
        });
    });

    describe('addToBlacklist', () => {
        it('should add phone to blacklist', async () => {
            const result = await service.addToBlacklist('+79991234567');

            expect(result).toBe(true);
        });
    });

    describe('removeFromBlacklist', () => {
        it('should remove phone from blacklist', async () => {
            const result = await service.removeFromBlacklist('+79991234567');

            expect(result).toBe(true);
        });
    });

    describe('getStatistics', () => {
        it('should return mock statistics', async () => {
            const stats = await service.getStatistics('7d');

            expect(stats.sent).toBe(150);
            expect(stats.delivered).toBe(145);
            expect(stats.failed).toBe(5);
            expect(stats.cost).toBe(225.0);
        });

        it('should return statistics for different period', async () => {
            const stats = await service.getStatistics('30d');

            expect(stats.sent).toBe(150);
            expect(stats.delivered).toBe(145);
            expect(stats.failed).toBe(5);
            expect(stats.cost).toBe(225.0);
        });
    });

    describe('validateMessage', () => {
        it('should validate correct message', async () => {
            const result = await service.validateMessage('Valid SMS message');

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject message that is too long', async () => {
            const longMessage = 'A'.repeat(1001);
            const result = await service.validateMessage(longMessage);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Сообщение слишком длинное (максимум 1000 символов)');
        });

        it('should reject message with forbidden characters', async () => {
            const result = await service.validateMessage('Message with <script>alert("xss")</script>');

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Сообщение содержит запрещенные символы');
        });

        it('should reject message with multiple errors', async () => {
            const badMessage = '<script>alert("xss")</script>' + 'A'.repeat(1000);
            const result = await service.validateMessage(badMessage);

            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(2);
            expect(result.errors).toContain('Сообщение содержит запрещенные символы');
            expect(result.errors).toContain('Сообщение слишком длинное (максимум 1000 символов)');
        });
    });

    describe('getSupportedCountries', () => {
        it('should return list of supported countries', async () => {
            const countries = await service.getSupportedCountries();

            expect(countries).toHaveLength(4);
            expect(countries[0]).toEqual({
                code: 'RU',
                name: 'Россия',
                cost: 1.5,
            });
            expect(countries[1]).toEqual({
                code: 'BY',
                name: 'Беларусь',
                cost: 2.0,
            });
        });
    });

    describe('Error handling', () => {
        it('should handle errors gracefully in sendSms', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const message: SmsMessage = {
                to: '+79991234567',
                message: 'Test SMS message',
            };

            // Mock an error
            jest.spyOn(service, 'validatePhoneNumber').mockImplementation(() => {
                throw new Error('Validation error');
            });

            const result = await service.sendSms(message);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Validation error');
            expect(result.provider).toBe('MockSmsProvider');

            consoleSpy.mockRestore();
        });

        it('should handle non-Error exceptions in sendSms', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const message: SmsMessage = {
                to: '+79991234567',
                message: 'Test SMS message',
            };

            // Mock a non-Error exception
            jest.spyOn(service, 'validatePhoneNumber').mockImplementation(() => {
                throw 'String error';
            });

            const result = await service.sendSms(message);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unknown error');
            expect(result.provider).toBe('MockSmsProvider');

            consoleSpy.mockRestore();
        });
    });
});
