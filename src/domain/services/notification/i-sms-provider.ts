export interface SmsMessage {
    to: string;
    message: string;
    from?: string;
    priority?: 'low' | 'normal' | 'high';
    deliveryReport?: boolean;
}

export interface SmsSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider?: string;
    cost?: number;
    deliveryStatus?: 'pending' | 'delivered' | 'failed' | 'unknown';
}

export interface SmsDeliveryReport {
    messageId: string;
    status: 'delivered' | 'failed' | 'pending';
    timestamp: Date;
    error?: string;
    cost?: number;
}

export interface ISmsProvider {
    sendSms(message: SmsMessage): Promise<SmsSendResult>;
    sendBulkSms(messages: SmsMessage[]): Promise<SmsSendResult[]>;
    validatePhoneNumber(phone: string): boolean;
    getDeliveryReport(messageId: string): Promise<SmsDeliveryReport | null>;
    getProviderInfo(): {
        name: string;
        version: string;
        capabilities: string[];
    };
    getBalance(): Promise<number>;
}
