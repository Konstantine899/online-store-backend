import {
    EmailAttachment,
    EmailMessage,
    EmailSendResult,
    IEmailProvider,
} from '@app/domain/services';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailProviderService implements IEmailProvider {
    private readonly logger = new Logger(EmailProviderService.name);
    private readonly providerName = 'MockEmailProvider';
    private readonly providerVersion = '1.0.0';

    // Кэш для валидации email
    private readonly emailValidationCache = new Map<string, boolean>();
    private readonly maxCacheSize = 1000;

    // Кэш для информации о провайдере
    private readonly providerInfoCache = {
        name: this.providerName,
        version: this.providerVersion,
        capabilities: [
            'html_email',
            'text_email',
            'attachments',
            'bulk_sending',
            'delivery_reports',
            'template_rendering',
        ],
    };

    async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
        try {
            // Валидация email
            if (!this.validateEmail(message.to)) {
                return {
                    success: false,
                    error: 'Неверный формат email адреса',
                    provider: this.providerName,
                };
            }

            // Mock отправка email
            const messageId = this.generateMessageId();

            this.logger.log(
                `Mock email sent to ${message.to}: ${message.subject}`,
            );
            this.logger.debug(`Email content: ${message.html ?? message.text}`);

            // Имитация задержки отправки
            await this.delay(100);

            // В реальной реализации здесь будет интеграция с:
            // - SendGrid, Mailgun, AWS SES, Nodemailer и т.д.

            return {
                success: true,
                messageId,
                provider: this.providerName,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(
                `Failed to send email: ${errorMessage}`,
                errorStack,
            );
            return {
                success: false,
                error: errorMessage,
                provider: this.providerName,
            };
        }
    }

    async sendBulkEmails(messages: EmailMessage[]): Promise<EmailSendResult[]> {
        if (messages.length === 0) {
            return [];
        }

        this.logger.log(`Sending ${messages.length} bulk emails`);

        // Параллельная обработка для лучшей производительности
        const batchSize = 10; // Обрабатываем по 10 писем одновременно
        const results: EmailSendResult[] = [];

        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);

            // Параллельная отправка в батче
            const batchPromises = batch.map(async (message) => {
                try {
                    return await this.sendEmail(message);
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : 'Unknown error';
                    this.logger.error(
                        `Failed to send bulk email: ${errorMessage}`,
                    );
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

        const successCount = results.filter((r) => r.success).length;
        this.logger.log(
            `Bulk email completed: ${successCount}/${messages.length} sent successfully`,
        );

        return results;
    }

    validateEmail(email: string): boolean {
        // Проверяем кэш сначала
        const cached = this.emailValidationCache.get(email);
        if (cached !== undefined) {
            return cached;
        }

        // Валидация email с оптимизированным regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);

        // Кэшируем результат
        if (this.emailValidationCache.size >= this.maxCacheSize) {
            // Очищаем кэш при достижении лимита (LRU стратегия)
            const firstKey = this.emailValidationCache.keys().next().value;
            if (firstKey !== undefined) {
                this.emailValidationCache.delete(firstKey);
            }
        }
        this.emailValidationCache.set(email, isValid);

        return isValid;
    }

    getProviderInfo(): {
        name: string;
        version: string;
        capabilities: string[];
    } {
        // Возвращаем кэшированную информацию
        return this.providerInfoCache;
    }

    private generateMessageId(): string {
        // Оптимизированная генерация ID с использованием crypto
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 11);
        return `mock-${timestamp}-${random}`;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Дополнительные методы для mock провайдера
    async getDeliveryStatus(
        messageId: string,
    ): Promise<{ status: string; timestamp: Date }> {
        this.logger.debug(`Getting delivery status for message: ${messageId}`);

        // Mock статус доставки
        return {
            status: 'delivered',
            timestamp: new Date(),
        };
    }

    async getBounceList(): Promise<string[]> {
        this.logger.debug('Getting bounce list');

        // Mock список отказов
        return [];
    }

    async getComplaintList(): Promise<string[]> {
        this.logger.debug('Getting complaint list');

        // Mock список жалоб
        return [];
    }

    async validateAttachment(attachment: EmailAttachment): Promise<boolean> {
        // Проверка размера (mock: максимум 10MB)
        const maxSize = 10 * 1024 * 1024;

        // Оптимизированная проверка размера
        const contentLength =
            typeof attachment.content === 'string'
                ? attachment.content.length
                : Buffer.isBuffer(attachment.content)
                  ? attachment.content.length
                  : 0;

        return contentLength > 0 && contentLength <= maxSize;
    }

    async getQuotaInfo(): Promise<{
        used: number;
        limit: number;
        resetDate: Date;
    }> {
        // Mock информация о квоте (кэшированная)
        const resetTime = Date.now() + 24 * 60 * 60 * 1000; // через 24 часа
        return {
            used: 0,
            limit: 10000,
            resetDate: new Date(resetTime),
        };
    }
}
