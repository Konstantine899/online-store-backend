import { PasswordResetTokenModel } from '@app/domain/models';
import { IPasswordResetTokenRepository } from '@app/domain/repositories';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';

@Injectable()
export class PasswordResetTokenRepository
    implements IPasswordResetTokenRepository
{
    constructor(
        @InjectModel(PasswordResetTokenModel)
        private readonly passwordResetTokenModel: typeof PasswordResetTokenModel,
    ) {}

    /**
     * Создаёт новый токен сброса пароля с tenant изоляцией
     */
    async createToken(
        userId: number,
        token: string,
        expiresAt: Date,
        tenantId?: number,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<PasswordResetTokenModel> {
        return this.passwordResetTokenModel.create({
            userId,
            token,
            expiresAt,
            tenantId: tenantId ?? null,
            ipAddress: ipAddress ?? null,
            userAgent: userAgent ?? null,
            isUsed: false,
            usedAt: null,
        });
    }

    /**
     * Находит токен по значению с учётом tenant isolation
     * Проверку валидности (isUsed, expiresAt) делает вызывающий код через isValid()
     */
    async findValidToken(
        token: string,
        tenantId?: number,
    ): Promise<PasswordResetTokenModel | null> {
        const where: WhereOptions<PasswordResetTokenModel> = {
            token,
        };

        // SaaS tenant isolation
        if (tenantId !== undefined) {
            where.tenantId = tenantId;
        }

        return this.passwordResetTokenModel.findOne({
            where,
        });
    }

    /**
     * Помечает токен как использованный
     */
    async markAsUsed(tokenId: number): Promise<void> {
        await this.passwordResetTokenModel.update(
            {
                isUsed: true,
                usedAt: new Date(),
            },
            {
                where: { id: tokenId },
            },
        );
    }

    /**
     * Удаляет истёкшие токены (cleanup job)
     * Возвращает количество удалённых записей
     */
    async cleanExpiredTokens(tenantId?: number): Promise<number> {
        const where: WhereOptions<PasswordResetTokenModel> = {
            expiresAt: {
                [Op.lt]: new Date(),
            },
        };

        if (tenantId !== undefined) {
            where.tenantId = tenantId;
        }

        const result = await this.passwordResetTokenModel.destroy({ where });
        return result;
    }

    /**
     * Отменяет все неиспользованные токены пользователя
     * Используется при смене пароля или logout
     */
    async revokeUserTokens(userId: number, tenantId?: number): Promise<number> {
        const where: WhereOptions<PasswordResetTokenModel> = {
            userId,
            isUsed: false,
        };

        if (tenantId !== undefined) {
            where.tenantId = tenantId;
        }

        const result = await this.passwordResetTokenModel.update(
            { isUsed: true, usedAt: new Date() },
            { where },
        );

        return result[0]; // количество обновлённых записей
    }
}
