import { PasswordResetTokenModel } from '@app/domain/models';

/**
 * Интерфейс репозитория для password reset tokens
 */
export interface IPasswordResetTokenRepository {
    /**
     * Создаёт новый токен сброса пароля
     * @param userId - ID пользователя
     * @param token - сгенерированный токен
     * @param expiresAt - время истечения
     * @param tenantId - ID тенанта (для SaaS)
     * @param ipAddress - IP адрес запроса
     * @param userAgent - User agent
     * @returns созданный токен
     */
    createToken(
        userId: number,
        token: string,
        expiresAt: Date,
        tenantId?: number,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<PasswordResetTokenModel>;

    /**
     * Находит валидный токен (не использован, не истёк, с tenant изоляцией)
     * @param token - токен для поиска
     * @param tenantId - ID тенанта (для SaaS)
     * @returns найденный токен или null
     */
    findValidToken(
        token: string,
        tenantId?: number,
    ): Promise<PasswordResetTokenModel | null>;

    /**
     * Помечает токен как использованный
     * @param tokenId - ID токена
     */
    markAsUsed(tokenId: number): Promise<void>;

    /**
     * Удаляет истёкшие токены (cleanup job)
     * @param tenantId - ID тенанта (опционально)
     */
    cleanExpiredTokens(tenantId?: number): Promise<number>;

    /**
     * Удаляет все неиспользованные токены пользователя
     * @param userId - ID пользователя
     * @param tenantId - ID тенанта
     */
    revokeUserTokens(userId: number, tenantId?: number): Promise<number>;
}
