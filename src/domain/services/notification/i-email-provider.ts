export interface EmailMessage {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    replyTo?: string;
    attachments?: EmailAttachment[];
}

export interface EmailAttachment {
    filename: string;
    content: string | Buffer;
    contentType?: string;
    encoding?: string;
}

export interface EmailSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider?: string;
}

export interface IEmailProvider {
    sendEmail(message: EmailMessage): Promise<EmailSendResult>;
    sendBulkEmails(messages: EmailMessage[]): Promise<EmailSendResult[]>;
    validateEmail(email: string): boolean;
    getProviderInfo(): {
        name: string;
        version: string;
        capabilities: string[];
    };
}
