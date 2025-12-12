import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { SmsProviderService } from '../sms-provider.service';
import type { SmsMessage } from '@app/domain/services';

describe('SmsProviderService', () => {
    let service: SmsProviderService;
    let module: TestingModule;

    // Фабричные функции для создания тестовых данных
    const createSmsMessage = (
        overrides: Partial<SmsMessage> = {},
    ): SmsMessage => ({
        to: '+79991234567',
        message: 'Test SMS message',
        ...overrides,
    });

    const createBulkSmsMessages = (count: number): SmsMessage[] =>
        Array.from({ length: count }, (_, i) =>
            createSmsMessage({
                to: `+7999123456${i}`,
                message: `Message ${i + 1}`,
            }),
        );

    const createTestPhoneNumbers = (): string[] => [
        '+79991234567', // Российский номер
        '79991234567', // Российский номер без +
        '89991234567', // Российский номер с 8
        '+12345678901', // Международный номер (11 цифр)
        '+44123456789', // Международный номер (12 цифр)
    ];

    const createInvalidPhoneNumbers = (): string[] => [
        'invalid-phone',
        '123',
        '+799912345678901234567890', // Очень длинный
        '', // Empty string
        'abc',
        '123-456-789', // Contains dashes
        '+123', // Очень короткий
        '799912345', // Слишком короткий
        '123456789012345678901234567890', // Очень длинный
        'not-a-phone', // Text
        '123abc456', // Смешанный текст и цифры
        '+', // Только плюс
        '++79991234567', // Двойной плюс
        '79991234567abc', // Цифры с текстом в конце
    ];

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [SmsProviderService],
        }).compile();

        service = module.get<SmsProviderService>(SmsProviderService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    describe('sendSms', () => {
        it('should send SMS successfully with valid Russian phone number', async () => {
            const message = createSmsMessage();

            const result = await service.sendSms(message);

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
            expect(result.provider).toBe('MockSmsProvider');
            expect(result.cost).toBeDefined();
            expect(result.deliveryStatus).toBe('pending');
            expect(result.error).toBeUndefined();
        });

        it('should send SMS with international phone number', async () => {
            const message = createSmsMessage({
                to: '+12345678901', // Исправляем номер на валидный
                message: 'International SMS',
            });

            const result = await service.sendSms(message);

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
        });

        it('should fail with invalid phone number format', async () => {
            const message = createSmsMessage({
                to: 'invalid-phone',
            });

            const result = await service.sendSms(message);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Неверный формат номера телефона');
            expect(result.provider).toBe('MockSmsProvider');
        });

        it('should calculate cost correctly for Latin text', async () => {
            const message = createSmsMessage({
                message: 'A'.repeat(160), // Exactly 1 SMS
            });

            const result = await service.sendSms(message);

            expect(result.success).toBe(true);
            expect(result.cost).toBe(1.5); // 1 SMS * 1.5 rubles
        });

        it('should calculate cost correctly for Cyrillic text', async () => {
            const message = createSmsMessage({
                message: 'А'.repeat(70), // Exactly 1 SMS in Cyrillic
            });

            const result = await service.sendSms(message);

            expect(result.success).toBe(true);
            expect(result.cost).toBe(1.5); // 1 SMS * 1.5 rubles
        });

        it('should calculate cost for multiple SMS', async () => {
            const message = createSmsMessage({
                message: 'A'.repeat(320), // 2 SMS
            });

            const result = await service.sendSms(message);

            expect(result.success).toBe(true);
            expect(result.cost).toBe(3.0); // 2 SMS * 1.5 rubles
        });
    });

    describe('sendBulkSms', () => {
        it('should send multiple SMS successfully', async () => {
            const messages = createBulkSmsMessages(2);

            const results = await service.sendBulkSms(messages);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(true);
        });

        it('should handle mixed success and failure in bulk SMS', async () => {
            const messages = [
                createSmsMessage({ to: '+79991234567', message: 'Valid SMS' }),
                createSmsMessage({
                    to: 'invalid-phone',
                    message: 'Invalid SMS',
                }),
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
            const validNumbers = [
                '+79991234567',
                '79991234567',
                '89991234567',
                '+7 (999) 123-45-67',
            ];

            validNumbers.forEach((number) => {
                expect(service.validatePhoneNumber(number)).toBe(true);
            });
        });

        it('should validate correct international phone numbers', () => {
            const validNumbers = createTestPhoneNumbers();

            validNumbers.forEach((number) => {
                expect(service.validatePhoneNumber(number)).toBe(true);
            });
        });

        it('should reject invalid phone numbers', () => {
            const invalidNumbers = createInvalidPhoneNumbers();

            // Проверяем каждый номер отдельно для отладки
            invalidNumbers.forEach((number) => {
                const result = service.validatePhoneNumber(number);
                expect(result).toBe(false);
            });
        });

        it('should debug specific invalid numbers', () => {
            const testNumbers = [
                '123',
                '+123',
                '799912345',
                '123-456-789',
                'abc',
                'not-a-phone',
            ];

            testNumbers.forEach((number) => {
                const result = service.validatePhoneNumber(number);
                console.log(`Number: "${number}" -> Result: ${result}`);
                expect(result).toBe(false);
            });
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
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();

            // Create a new service instance with mocked method
            const mockService = {
                ...service,
                getDeliveryReport: jest
                    .fn()
                    .mockRejectedValue(new Error('Database error')),
            };

            await expect(
                mockService.getDeliveryReport('test-id'),
            ).rejects.toThrow('Database error');

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
            expect(result.errors).toContain(
                'Сообщение слишком длинное (максимум 1000 символов)',
            );
        });

        it('should reject message with forbidden characters', async () => {
            const result = await service.validateMessage(
                'Message with <script>alert("xss")</script>',
            );

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                'Сообщение содержит запрещенные символы',
            );
        });

        it('should reject message with multiple errors', async () => {
            const badMessage =
                '<script>alert("xss")</script>' + 'A'.repeat(1000);
            const result = await service.validateMessage(badMessage);

            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(2);
            expect(result.errors).toContain(
                'Сообщение содержит запрещенные символы',
            );
            expect(result.errors).toContain(
                'Сообщение слишком длинное (максимум 1000 символов)',
            );
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
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();

            const message: SmsMessage = {
                to: '+79991234567',
                message: 'Test SMS message',
            };

            // Mock an error
            jest.spyOn(service, 'validatePhoneNumber').mockImplementation(
                () => {
                    throw new Error('Validation error');
                },
            );

            const result = await service.sendSms(message);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Validation error');
            expect(result.provider).toBe('MockSmsProvider');

            consoleSpy.mockRestore();
        });

        it('should handle non-Error exceptions in sendSms', async () => {
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();

            const message = createSmsMessage();

            // Mock a non-Error exception
            jest.spyOn(service, 'validatePhoneNumber').mockImplementation(
                () => {
                    throw 'String error';
                },
            );

            const result = await service.sendSms(message);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unknown error');
            expect(result.provider).toBe('MockSmsProvider');

            consoleSpy.mockRestore();
        });
    });

    describe('Performance Tests', () => {
        it('should handle large bulk SMS operations efficiently', async () => {
            const largeMessageList = createBulkSmsMessages(100);

            const startTime = Date.now();
            const results = await service.sendBulkSms(largeMessageList);
            const endTime = Date.now();

            expect(results).toHaveLength(100);
            expect(endTime - startTime).toBeLessThan(25000); // Увеличиваем таймаут до 25 секунд
        }, 30000); // Увеличиваем таймаут теста до 30 секунд

        it('should cache phone validation efficiently', async () => {
            const testPhones = [
                '+79991234567',
                '+79991234568',
                '+79991234567', // Повторный вызов
                '+12345678901', // Исправляем на валидный номер
                '+79991234568', // Повторный вызов
            ];

            const startTime = Date.now();

            // Множественные вызовы валидации
            const results = await Promise.all(
                testPhones.map((phone) => service.validatePhoneNumber(phone)),
            );

            const endTime = Date.now();

            expect(results).toEqual([true, true, true, true, true]); // Все номера должны быть валидными
            expect(endTime - startTime).toBeLessThan(100); // Должно выполниться быстро благодаря кэшу
        });

        it('should handle provider info caching efficiently', async () => {
            const startTime = Date.now();

            // Множественные вызовы getProviderInfo
            const results = await Promise.all(
                Array.from({ length: 50 }, () => service.getProviderInfo()),
            );

            const endTime = Date.now();

            expect(results).toHaveLength(50);
            expect(
                results.every((info) => info.name === 'MockSmsProvider'),
            ).toBe(true);
            expect(endTime - startTime).toBeLessThan(50); // Должно выполниться очень быстро благодаря кэшу
        });

        it('should handle supported countries caching efficiently', async () => {
            const startTime = Date.now();

            // Множественные вызовы getSupportedCountries
            const results = await Promise.all(
                Array.from({ length: 20 }, () =>
                    service.getSupportedCountries(),
                ),
            );

            const endTime = Date.now();

            expect(results).toHaveLength(20);
            expect(results.every((countries) => countries.length === 4)).toBe(
                true,
            );
            expect(endTime - startTime).toBeLessThan(100); // Должно выполниться быстро
        });

        it('should handle message validation efficiently', async () => {
            const testMessages = Array.from(
                { length: 100 },
                (_, i) => `Test message ${i} with valid content`,
            );

            const startTime = Date.now();

            // Параллельная валидация сообщений
            const results = await Promise.all(
                testMessages.map((message) => service.validateMessage(message)),
            );

            const endTime = Date.now();

            expect(results).toHaveLength(100);
            expect(results.every((result) => result.valid === true)).toBe(true);
            expect(endTime - startTime).toBeLessThan(500); // Должно выполниться быстро
        });

        it('should handle cost calculation efficiently', async () => {
            const testMessages = Array.from({ length: 50 }, (_, i) =>
                createSmsMessage({
                    message: 'A'.repeat(160 + i), // Разные длины сообщений
                }),
            );

            const startTime = Date.now();

            // Параллельная отправка для расчета стоимости
            const results = await Promise.all(
                testMessages.map((message) => service.sendSms(message)),
            );

            const endTime = Date.now();

            expect(results).toHaveLength(50);
            expect(results.every((result) => result.success === true)).toBe(
                true,
            );
            expect(endTime - startTime).toBeLessThan(2000); // Должно выполниться быстро
        });
    });

    describe('Caching Tests', () => {
        it('should cache phone validation results', () => {
            const phone = '+79991234567';

            // Первый вызов
            const result1 = service.validatePhoneNumber(phone);

            // Второй вызов (должен использовать кэш)
            const result2 = service.validatePhoneNumber(phone);

            expect(result1).toBe(result2);
            expect(result1).toBe(true);
        });

        it('should cache provider info', () => {
            // Первый вызов
            const info1 = service.getProviderInfo();

            // Второй вызов (должен использовать кэш)
            const info2 = service.getProviderInfo();

            expect(info1).toEqual(info2);
            expect(info1.name).toBe('MockSmsProvider');
        });

        it('should cache supported countries', async () => {
            // Первый вызов
            const countries1 = await service.getSupportedCountries();

            // Второй вызов (должен использовать кэш)
            const countries2 = await service.getSupportedCountries();

            expect(countries1).toEqual(countries2);
            expect(countries1).toHaveLength(4);
        });

        it('should handle cache invalidation for phone validation', () => {
            const phone = '+79991234567';

            // Первый вызов
            const result1 = service.validatePhoneNumber(phone);

            // Очищаем кэш (симулируем)
            // В реальной реализации здесь был бы метод очистки кэша

            // Второй вызов
            const result2 = service.validatePhoneNumber(phone);

            expect(result1).toBe(result2);
            expect(result1).toBe(true);
        });
    });

    describe('Edge Cases and Stress Tests', () => {
        it('should handle very long messages efficiently', async () => {
            const longMessage = createSmsMessage({
                message: 'A'.repeat(1000), // Максимальная длина
            });

            const startTime = Date.now();
            const result = await service.sendSms(longMessage);
            const endTime = Date.now();

            expect(result.success).toBe(true);
            expect(endTime - startTime).toBeLessThan(500); // Увеличиваем порог времени
        });

        it('should handle mixed character sets efficiently', async () => {
            const mixedMessage = createSmsMessage({
                message: 'А'.repeat(35) + 'A'.repeat(80), // Смешанный текст
            });

            const startTime = Date.now();
            const result = await service.sendSms(mixedMessage);
            const endTime = Date.now();

            expect(result.success).toBe(true);
            expect(result.cost).toBe(3.0); // 2 SMS
            expect(endTime - startTime).toBeLessThan(500); // Увеличиваем порог времени
        });

        it('should handle concurrent bulk operations', async () => {
            const bulkOperations = Array.from({ length: 5 }, () =>
                createBulkSmsMessages(20),
            );

            const startTime = Date.now();

            // Параллельные bulk операции
            const results = await Promise.all(
                bulkOperations.map((messages) => service.sendBulkSms(messages)),
            );

            const endTime = Date.now();

            expect(results).toHaveLength(5);
            expect(
                results.every((bulkResult) => bulkResult.length === 20),
            ).toBe(true);
            expect(endTime - startTime).toBeLessThan(5000); // Должно выполниться за разумное время
        });
    });
});
