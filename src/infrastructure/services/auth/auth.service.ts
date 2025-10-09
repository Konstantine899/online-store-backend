import { UserModel } from '@app/domain/models';
import { IAuthResponse } from '@app/domain/responses';
import { IAuthService } from '@app/domain/services';
import {
    createLogger,
    maskPII,
} from '@app/infrastructure/common/utils/logging';
import { CreateUserDto, RefreshDto } from '@app/infrastructure/dto';
import { PasswordResetTokenRepository } from '@app/infrastructure/repositories/password-reset-token/password-reset-token.repository';
import {
    LoginResponse,
    LogoutResponse,
    RegistrationResponse,
    UpdateAccessTokenResponse,
} from '@app/infrastructure/responses';
import {
    BadRequestException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Request } from 'express';
import { TokenService } from '../token/token.service';
import { UserService } from '../user/user.service';

interface IUpdateAccessTokenResponse extends UpdateAccessTokenResponse {
    refreshToken?: string; // Опционально для внутреннего использования
}

// removed unused types

@Injectable()
export class AuthService implements IAuthService {
    private readonly logger = createLogger('AuthService');

    constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService,
        private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    ) {}

    public async registration(
        dto: CreateUserDto,
    ): Promise<RegistrationResponse> {
        const user = await this.userService.createUser(dto);
        const accessToken = await this.tokenService.generateAccessToken(user);
        const refreshToken = await this.tokenService.generateRefreshToken(
            user,
            60 * 60 * 24 * 30,
        );

        // Бизнес-логирование: регистрация пользователя (info level)
        this.logger.info(
            {
                userId: user.id,
                email: maskPII(user.email),
                roles: user.roles?.map((r) => r.role),
            },
            'Пользователь успешно зарегистрирован',
        );

        return this.getToken(accessToken, refreshToken);
    }

    public async login(
        dto: CreateUserDto,
        request?: Request,
    ): Promise<LoginResponse> {
        const user = await this.validateUser(dto, request);

        // Логируем успешный вход
        const ipAddress = request?.ip;
        const userAgent = request?.get('User-Agent');
        await this.userService.updateLastLoginAt(user.id, ipAddress, userAgent);

        const accessToken = await this.tokenService.generateAccessToken(user);
        const refreshToken = await this.tokenService.generateRefreshToken(
            user,
            60 * 60 * 24 * 30,
        );

        // Бизнес-логирование: успешный логин (info level)
        this.logger.info(
            {
                userId: user.id,
                email: maskPII(user.email),
                roles: user.roles?.map((r) => r.role),
            },
            'Пользователь успешно вошёл в систему',
        );

        return this.getToken(accessToken, refreshToken);
    }

    public async logout(
        refresh: RefreshDto,
        request: Request,
    ): Promise<LogoutResponse> {
        const payload = await this.tokenService.decodeRefreshToken(
            refresh.refreshToken,
        );
        await this.tokenService.removeRefreshToken(payload.jti, payload.sub);
        request.headers.authorization = undefined;
        return {
            status: HttpStatus.OK,
            message: 'success',
        };
    }

    public async updateAccessToken(
        refreshToken: string,
    ): Promise<IUpdateAccessTokenResponse> {
        try {
            const { accessToken, refreshToken: newRefreshToken } =
                await this.tokenService.rotateRefreshToken(refreshToken);

            return {
                type: 'Bearer',
                accessToken,
                refreshToken: newRefreshToken, // Возвращаем новый refresh для cookie
            };
        } catch (error) {
            // Логируем ошибку ротации токена (warn level - не критично)
            this.logger.warn(
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                },
                'Token rotation failed',
            );
            // Пробрасываем все ошибки наверх - пусть контроллер решает что делать
            throw error;
        }
    }

    private async validateUser(
        dto: CreateUserDto,
        request?: Request,
    ): Promise<UserModel> {
        const user = await this.userService.findUserByEmail(dto.email);
        if (!user) {
            // Логируем неудачную попытку входа (пользователь не найден)
            await this.userService.logFailedLogin(
                0,
                'User not found',
                request?.ip,
                request?.get('User-Agent'),
            );
            this.unauthorized('Не корректный email');
        }
        const password = await bcrypt.compare(dto.password, user.password); // сравниваю пароли
        if (!password) {
            // Логируем неудачную попытку входа (неверный пароль)
            await this.userService.logFailedLogin(
                user.id,
                'Invalid password',
                request?.ip,
                request?.get('User-Agent'),
            );
            this.unauthorized('Не корректный пароль');
        }
        return this.userService.findAuthenticatedUser(user.id);
    }

    private unauthorized(message: string): void {
        throw new UnauthorizedException({
            status: HttpStatus.UNAUTHORIZED,
            message,
        });
    }

    private badRequest(message: string): void {
        throw new BadRequestException({
            status: HttpStatus.BAD_REQUEST,
            message,
        });
    }

    private getToken(
        accessToken: string,
        refreshToken?: string,
    ): IAuthResponse {
        return {
            type: 'Bearer',
            accessToken,
            ...(refreshToken ? { refreshToken } : {}),
        };
    }

    // ============================================================
    // PASSWORD RESET METHODS
    // ============================================================

    /**
     * Генерирует токен сброса пароля и "отправляет" email (mock)
     * @param email - email пользователя
     * @param tenantId - ID тенанта (для SaaS изоляции)
     * @param ipAddress - IP адрес запроса (для аудита)
     * @param userAgent - User agent (для аудита)
     */
    async forgotPassword(
        email: string,
        tenantId?: number,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<void> {
        // Всегда возвращаем success (не раскрываем есть ли такой email)
        const user = await this.userService.findUserByEmail(email);

        if (!user) {
            // Security: не раскрываем что email не найден
            this.logger.info(
                { email: maskPII(email), ipAddress },
                'Password reset requested for non-existent email',
            );
            return; // возвращаем success для защиты от user enumeration
        }

        // Генерируем secure random token (32 bytes = 64 hex символа)
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

        // Отменяем все предыдущие неиспользованные токены пользователя
        await this.passwordResetTokenRepository.revokeUserTokens(
            user.id,
            tenantId,
        );

        // Создаём новый токен
        await this.passwordResetTokenRepository.createToken(
            user.id,
            token,
            expiresAt,
            tenantId,
            ipAddress,
            userAgent,
        );

        // Email mock (console.log для MVP)
        this.sendPasswordResetEmail(user.email, token);

        this.logger.info(
            {
                userId: user.id,
                email: maskPII(user.email),
                tenantId,
                expiresAt,
            },
            'Password reset token generated',
        );
    }

    /**
     * Сбрасывает пароль по токену
     * @param token - токен сброса пароля
     * @param newPassword - новый пароль
     * @param tenantId - ID тенанта (для SaaS изоляции)
     */
    async resetPassword(
        token: string,
        newPassword: string,
        tenantId?: number,
    ): Promise<void> {
        // Находим валидный токен с tenant isolation
        const resetToken =
            await this.passwordResetTokenRepository.findValidToken(
                token,
                tenantId,
            );

        if (!resetToken || !resetToken.isValid()) {
            this.logger.warn(
                { token: token.substring(0, 8) + '***', tenantId },
                'Invalid or expired password reset token',
            );
            this.unauthorized(
                'Токен сброса пароля некорректен или истёк. Запросите новый.',
            );
        }

        // Хэшируем новый пароль
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Обновляем пароль пользователя
        await this.userService.updatePassword(resetToken.userId, passwordHash);

        // Помечаем токен как использованный
        await this.passwordResetTokenRepository.markAsUsed(resetToken.id);

        // Удаляем все refresh токены пользователя (force logout)
        await this.tokenService.revokeAllUserTokens(resetToken.userId);

        this.logger.info(
            {
                userId: resetToken.userId,
                email: maskPII(resetToken.user?.email),
                tenantId,
            },
            'Password successfully reset, all sessions revoked',
        );
    }

    /**
     * Email mock - логирует в console вместо реальной отправки
     * TODO: заменить на реальный email provider (nodemailer)
     */
    private sendPasswordResetEmail(email: string, token: string): void {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 PASSWORD RESET EMAIL (MOCK)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To: ${email}
Subject: Сброс пароля

Здравствуйте!

Вы запросили сброс пароля. Перейдите по ссылке:

${resetLink}

Ссылка действительна 15 минут.

Если вы не запрашивали сброс пароля, проигнорируйте это письмо.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
    }
}
