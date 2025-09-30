import { Injectable, Logger } from '@nestjs/common';
import { ILoginHistoryService } from '@app/domain/services/login-history/i-login-history-service';
import { LoginHistoryRepository } from '@app/infrastructure/repositories/login-history/login-history.repository';
import { LoginHistoryModel } from '@app/domain/models';

@Injectable()
export class LoginHistoryService implements ILoginHistoryService {
    private readonly logger = new Logger(LoginHistoryService.name);

    constructor(
        private readonly loginHistoryRepository: LoginHistoryRepository,
    ) {}

    async logSuccessfulLogin(userId: number, ipAddress?: string, userAgent?: string): Promise<LoginHistoryModel> {
        try {
            const loginRecord = await this.loginHistoryRepository.createLoginRecord({
                userId,
                ipAddress,
                userAgent,
                success: true,
                loginAt: new Date(),
            });

            this.logger.log(`Successful login logged for user ${userId} from IP ${ipAddress}`);
            return loginRecord;
        } catch (error) {
            this.logger.error(`Failed to log successful login for user ${userId}:`, error);
            throw error;
        }
    }

    async logFailedLogin(userId: number, failureReason: string, ipAddress?: string, userAgent?: string): Promise<LoginHistoryModel> {
        try {
            const loginRecord = await this.loginHistoryRepository.createLoginRecord({
                userId,
                ipAddress,
                userAgent,
                success: false,
                failureReason,
                loginAt: new Date(),
            });

            this.logger.warn(`Failed login logged for user ${userId} from IP ${ipAddress}: ${failureReason}`);
            return loginRecord;
        } catch (error) {
            this.logger.error(`Failed to log failed login for user ${userId}:`, error);
            throw error;
        }
    }

    async getUserLoginHistory(userId: number, limit = 10, offset = 0): Promise<LoginHistoryModel[]> {
        return this.loginHistoryRepository.findUserLoginHistory(userId, limit, offset);
    }

    async getRecentLoginsByIp(ipAddress: string, hours = 24): Promise<LoginHistoryModel[]> {
        return this.loginHistoryRepository.findRecentLoginsByIp(ipAddress, hours);
    }

    async getFailedLoginsByUser(userId: number, hours = 24): Promise<LoginHistoryModel[]> {
        return this.loginHistoryRepository.findFailedLoginsByUser(userId, hours);
    }

    async getUserLoginStats(userId: number): Promise<{
        totalLogins: number;
        successfulLogins: number;
        failedLogins: number;
        lastLoginAt: Date | null;
    }> {
        const [totalLogins, successfulLogins, failedLogins, recentLogins] = await Promise.all([
            this.loginHistoryRepository.countUserLogins(userId),
            this.loginHistoryRepository.countUserLogins(userId, true),
            this.loginHistoryRepository.countUserLogins(userId, false),
            this.loginHistoryRepository.findUserLoginHistory(userId, 1, 0),
        ]);

        return {
            totalLogins,
            successfulLogins,
            failedLogins,
            lastLoginAt: recentLogins.length > 0 ? recentLogins[0].loginAt : null,
        };
    }

    async cleanupOldLoginHistory(daysToKeep = 90): Promise<number> {
        try {
            const deletedCount = await this.loginHistoryRepository.deleteOldLoginHistory(daysToKeep);
            this.logger.log(`Cleaned up ${deletedCount} old login history records`);
            return deletedCount;
        } catch (error) {
            this.logger.error('Failed to cleanup old login history:', error);
            throw error;
        }
    }
}
