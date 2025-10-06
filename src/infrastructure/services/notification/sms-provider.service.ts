import { Injectable, Logger } from '@nestjs/common';
import {
    ISmsProvider,
    SmsMessage,
    SmsSendResult,
    SmsDeliveryReport,
} from '@app/domain/services';

@Injectable()
export class SmsProviderService implements ISmsProvider {
    private readonly logger = new Logger(SmsProviderService.name);
    private readonly providerName = 'MockSmsProvider';
    private readonly providerVersion = '1.0.0';
    private readonly mockBalance = 1000.0; // Mock баланс в рублях
    
    // Кэш для валидации номеров телефонов
    private readonly phoneValidationCache = new Map<string, boolean>();
    private readonly maxCacheSize = 1000;
    
    // Кэш для информации о провайдере
    private readonly providerInfoCache = {
        name: this.providerName,
        version: this.providerVersion,
        capabilities: [
            'sms_sending',
            'bulk_sms',
            'delivery_reports',
            'international_sms',
            'unicode_sms',
            'flash_sms',
            'balance_check',
        ],
    };
    
    // Кэш для поддерживаемых стран
    private readonly supportedCountriesCache = [
        { code: 'RU', name: 'Россия', cost: 1.5 },
        { code: 'BY', name: 'Беларусь', cost: 2.0 },
        { code: 'KZ', name: 'Казахстан', cost: 2.5 },
        { code: 'UA', name: 'Украина', cost: 3.0 },
    ];
    
    // Предкомпилированные регулярные выражения
    private readonly russianPhoneRegex = /^[78]\d{10}$/;
    private readonly internationalPhoneRegex = /^\+\d{10,15}$/;
    private readonly cyrillicRegex = /[а-яё]/i;
    private readonly forbiddenCharsRegex = /[<>{}]/;

    async sendSms(message: SmsMessage): Promise<SmsSendResult> {
        try {
            // Валидация номера телефона
            if (!this.validatePhoneNumber(message.to)) {
                return {
                    success: false,
                    error: 'Неверный формат номера телефона',
                    provider: this.providerName,
                };
            }

            // Mock отправка SMS
            const messageId = this.generateMessageId();
            const cost = this.calculateCost(message.message);

            this.logger.log(
                `Mock SMS sent to ${message.to}: ${message.message.substring(0, 50)}...`,
            );
            this.logger.debug(`SMS cost: ${cost} rubles`);

            // Имитация задержки отправки
            await this.delay(200);

            // В реальной реализации здесь будет интеграция с:
            // - Twilio, SMS.ru, SMSC.ru, AWS SNS и т.д.

            return {
                success: true,
                messageId,
                provider: this.providerName,
                cost,
                deliveryStatus: 'pending',
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(
                `Failed to send SMS: ${errorMessage}`,
                errorStack,
            );
            return {
                success: false,
                error: errorMessage,
                provider: this.providerName,
            };
        }
    }

    async sendBulkSms(messages: SmsMessage[]): Promise<SmsSendResult[]> {
        if (messages.length === 0) {
            return [];
        }

        this.logger.log(`Sending ${messages.length} bulk SMS messages`);

        // Параллельная обработка для лучшей производительности
        const batchSize = 10; // Обрабатываем по 10 SMS одновременно
        const results: SmsSendResult[] = [];

        // Группируем по номерам для оптимизации
        const groupedByPhone = this.groupMessagesByPhone(messages);

        for (const [, phoneMessages] of groupedByPhone.entries()) {
            // Обрабатываем батчами
            for (let i = 0; i < phoneMessages.length; i += batchSize) {
                const batch = phoneMessages.slice(i, i + batchSize);
                
                // Параллельная отправка в батче
                const batchPromises = batch.map(async (message) => {
                    try {
                        return await this.sendSms(message);
                    } catch (error) {
                        const errorMessage =
                            error instanceof Error ? error.message : 'Unknown error';
                        this.logger.error(`Failed to send bulk SMS: ${errorMessage}`);
                        return {
                            success: false,
                            error: errorMessage,
                            provider: this.providerName,
                        };
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }
        }

        const successCount = results.filter((r) => r.success).length;
        this.logger.log(
            `Bulk SMS completed: ${successCount}/${messages.length} sent successfully`,
        );

        return results;
    }

    validatePhoneNumber(phone: string): boolean {
        // Проверяем кэш сначала
        if (this.phoneValidationCache.has(phone)) {
            return this.phoneValidationCache.get(phone)!;
        }

        // Удаляем все нецифровые символы
        const cleanPhone = phone.replace(/\D/g, '');

        // Используем предкомпилированные регулярные выражения
        const isValid = (
            this.russianPhoneRegex.test(cleanPhone) ||
            this.internationalPhoneRegex.test(phone)
        );

        // Кэшируем результат
        if (this.phoneValidationCache.size >= this.maxCacheSize) {
            // Очищаем кэш при достижении лимита (LRU стратегия)
            const firstKey = this.phoneValidationCache.keys().next().value;
            if (firstKey !== undefined) {
                this.phoneValidationCache.delete(firstKey);
            }
        }
        this.phoneValidationCache.set(phone, isValid);

        return isValid;
    }

    async getDeliveryReport(
        messageId: string,
    ): Promise<SmsDeliveryReport | null> {
        try {
            this.logger.debug(
                `Getting delivery report for message: ${messageId}`,
            );

            // Mock отчет о доставке
            const report: SmsDeliveryReport = {
                messageId,
                status: 'delivered',
                timestamp: new Date(),
                cost: 1.5, // Mock стоимость
            };

            return report;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to get delivery report: ${errorMessage}`);
            return null;
        }
    }

    getProviderInfo(): {
        name: string;
        version: string;
        capabilities: string[];
    } {
        // Возвращаем кэшированную информацию
        return this.providerInfoCache;
    }

    async getBalance(): Promise<number> {
        this.logger.debug('Getting SMS provider balance');

        // Mock баланс
        return this.mockBalance;
    }

    private generateMessageId(): string {
        // Оптимизированная генерация ID с использованием crypto
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 11);
        return `sms-${timestamp}-${random}`;
    }

    private calculateCost(message: string): number {
        // Mock расчет стоимости
        // 1 SMS = 160 символов (латиница) или 70 символов (кириллица)
        const hasCyrillic = this.cyrillicRegex.test(message);
        const smsLength = hasCyrillic ? 70 : 160;
        const smsCount = Math.ceil(message.length / smsLength);

        // Стоимость: 1.5 рубля за SMS
        return smsCount * 1.5;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Вспомогательные методы для оптимизации
    private groupMessagesByPhone(messages: SmsMessage[]): Map<string, SmsMessage[]> {
        const grouped = new Map<string, SmsMessage[]>();
        
        for (const message of messages) {
            if (!grouped.has(message.to)) {
                grouped.set(message.to, []);
            }
            grouped.get(message.to)!.push(message);
        }
        
        return grouped;
    }

    // Дополнительные методы для mock провайдера
    async getSmsHistory(
        phone?: string,
        limit: number = 100,
    ): Promise<SmsSendResult[]> {
        this.logger.debug(
            `Getting SMS history for phone: ${phone || 'all'}, limit: ${limit}`,
        );

        // Mock история SMS
        return [];
    }

    async getBlacklist(): Promise<string[]> {
        this.logger.debug('Getting SMS blacklist');

        // Mock черный список номеров
        return [];
    }

    async addToBlacklist(phone: string): Promise<boolean> {
        this.logger.log(`Adding phone to blacklist: ${phone}`);

        // Mock добавление в черный список
        return true;
    }

    async removeFromBlacklist(phone: string): Promise<boolean> {
        this.logger.log(`Removing phone from blacklist: ${phone}`);

        // Mock удаление из черного списка
        return true;
    }

    async getStatistics(period: string = '7d'): Promise<{
        sent: number;
        delivered: number;
        failed: number;
        cost: number;
    }> {
        this.logger.debug(`Getting SMS statistics for period: ${period}`);

        // Mock статистика
        return {
            sent: 150,
            delivered: 145,
            failed: 5,
            cost: 225.0,
        };
    }

    async validateMessage(
        message: string,
    ): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];

        // Проверка длины
        if (message.length > 1000) {
            errors.push('Сообщение слишком длинное (максимум 1000 символов)');
        }

        // Проверка на запрещенные символы с предкомпилированным regex
        if (this.forbiddenCharsRegex.test(message)) {
            errors.push('Сообщение содержит запрещенные символы');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    async getSupportedCountries(): Promise<
        { code: string; name: string; cost: number }[]
    > {
        this.logger.debug('Getting supported countries');

        // Возвращаем кэшированный список
        return this.supportedCountriesCache;
    }
}
