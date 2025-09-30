import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LoginHistoryModel, ILoginHistoryCreationAttributes } from '@app/domain/models';
import { Op } from 'sequelize';

export interface ILoginHistoryRepository {
    createLoginRecord(data: ILoginHistoryCreationAttributes): Promise<LoginHistoryModel>;
    findUserLoginHistory(userId: number, limit?: number, offset?: number): Promise<LoginHistoryModel[]>;
    findRecentLoginsByIp(ipAddress: string, hours?: number): Promise<LoginHistoryModel[]>;
    findFailedLoginsByUser(userId: number, hours?: number): Promise<LoginHistoryModel[]>;
    countUserLogins(userId: number, success?: boolean): Promise<number>;
    deleteOldLoginHistory(daysToKeep?: number): Promise<number>;
}

@Injectable()
export class LoginHistoryRepository implements ILoginHistoryRepository {
    constructor(
        @InjectModel(LoginHistoryModel)
        private readonly loginHistoryModel: typeof LoginHistoryModel,
    ) {}

    async createLoginRecord(data: ILoginHistoryCreationAttributes): Promise<LoginHistoryModel> {
        const loginRecord = await this.loginHistoryModel.create({
            userId: data.userId,
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null,
            success: data.success ?? true,
            failureReason: data.failureReason || null,
            loginAt: data.loginAt || new Date(),
        });

        return loginRecord;
    }

    async findUserLoginHistory(userId: number, limit = 10, offset = 0): Promise<LoginHistoryModel[]> {
        return this.loginHistoryModel.findAll({
            where: { userId },
            order: [['loginAt', 'DESC']],
            limit,
            offset,
        });
    }

    async findRecentLoginsByIp(ipAddress: string, hours = 24): Promise<LoginHistoryModel[]> {
        const since = new Date();
        since.setHours(since.getHours() - hours);

        return this.loginHistoryModel.findAll({
            where: {
                ipAddress,
                loginAt: {
                    [Op.gte]: since,
                },
            },
            order: [['loginAt', 'DESC']],
        });
    }

    async findFailedLoginsByUser(userId: number, hours = 24): Promise<LoginHistoryModel[]> {
        const since = new Date();
        since.setHours(since.getHours() - hours);

        return this.loginHistoryModel.findAll({
            where: {
                userId,
                success: false,
                loginAt: {
                    [Op.gte]: since,
                },
            },
            order: [['loginAt', 'DESC']],
        });
    }

    async countUserLogins(userId: number, success?: boolean): Promise<number> {
        const where: { userId: number; success?: boolean } = { userId };
        if (success !== undefined) {
            where.success = success;
        }

        return this.loginHistoryModel.count({ where });
    }

    async deleteOldLoginHistory(daysToKeep = 90): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const deletedCount = await this.loginHistoryModel.destroy({
            where: {
                loginAt: {
                    [Op.lt]: cutoffDate,
                },
            },
        });

        return deletedCount;
    }
}
