import { LoginHistoryModel } from '@app/domain/models';

export interface ILoginHistoryService {
    logSuccessfulLogin(userId: number, ipAddress?: string, userAgent?: string): Promise<LoginHistoryModel>;
    logFailedLogin(userId: number, failureReason: string, ipAddress?: string, userAgent?: string): Promise<LoginHistoryModel>;
    getUserLoginHistory(userId: number, limit?: number, offset?: number): Promise<LoginHistoryModel[]>;
    getRecentLoginsByIp(ipAddress: string, hours?: number): Promise<LoginHistoryModel[]>;
    getFailedLoginsByUser(userId: number, hours?: number): Promise<LoginHistoryModel[]>;
    getUserLoginStats(userId: number): Promise<{
        totalLogins: number;
        successfulLogins: number;
        failedLogins: number;
        lastLoginAt: Date | null;
    }>;
    cleanupOldLoginHistory(daysToKeep?: number): Promise<number>;
}
