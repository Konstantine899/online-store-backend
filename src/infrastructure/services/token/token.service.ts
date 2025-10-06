import {
    HttpStatus,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignOptions, TokenExpiredError } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import {
    RefreshTokenRepository,
    UserRepository,
} from '@app/infrastructure/repositories';
import { RefreshTokenModel, UserModel } from '@app/domain/models';
import {
    IAccessTokenPayload,
    IRefreshTokenPayload,
    ITokenService,
} from '@app/domain/services';
import { IDecodedAccessToken } from '@app/domain/jwt';
import { JwtSettings } from '@app/infrastructure/config/jwt';
import { Request } from 'express';

@Injectable()
export class TokenService implements ITokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly userRepository: UserRepository,
    ) {}

    public async generateAccessToken(user: UserModel): Promise<string> {
        const payload: IAccessTokenPayload = {
            id: user.id,
            roles: user.roles,
        };
        const options: SignOptions = {
            subject: String(user.id),
        };
        return this.jwtService.signAsync(payload, options);
    }

    public async generateRefreshToken(
        user: UserModel,
        expiresIn: number,
    ): Promise<string> {
        const refresh_token =
            await this.refreshTokenRepository.createRefreshToken(
                user,
                expiresIn,
            );
        const options: SignOptions = {
            subject: String(user.id),
            jwtid: String(refresh_token.id),
        };
        return this.jwtService.signAsync({}, options);
    }

    //Метод получения пользователя из payload refresh token
    public async getUserFromRefreshTokenPayload(
        payload: IRefreshTokenPayload,
    ): Promise<UserModel> {
        const subjectId = payload.sub;
        if (!subjectId) {
            throw new UnprocessableEntityException(
                'Не верный формат refresh token',
            );
        }
        return this.userRepository.findUser(subjectId);
    }

    // получаю сохраненный refresh token из refresh token payload
    public async getStoredRefreshTokenFromRefreshTokenPayload(
        payload: IRefreshTokenPayload,
    ): Promise<RefreshTokenModel | null> {
        const refreshTokenId = payload.jti;
        if (!refreshTokenId) {
            throw new UnprocessableEntityException(
                'id refresh token не получен из payload',
            );
        }
        return this.refreshTokenRepository.findRefreshTokenById(refreshTokenId);
    }

    public async decodedAccessToken(
        token: string,
        request: Request,
    ): Promise<IDecodedAccessToken> {
        return (request.user = await this.jwtService.verifyAsync(token, {
            secret: JwtSettings().jwtSecretKey,
        }));
    }

    //декодирую refresh token
    public async decodeRefreshToken(
        refreshToken: string,
    ): Promise<IRefreshTokenPayload> {
        try {
            return await this.jwtService.verifyAsync(refreshToken);
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new UnprocessableEntityException(
                    'Срок действия refresh token истек',
                );
            } else {
                throw new UnprocessableEntityException(
                    'Не верный формат refresh token',
                );
            }
        }
    }

    // метод обновления refresh token
    public async updateRefreshToken(
        encoded: string,
    ): Promise<{ user: UserModel; refreshToken: RefreshTokenModel }> {
        const payload = await this.decodeRefreshToken(encoded);
        const refreshToken =
            await this.getStoredRefreshTokenFromRefreshTokenPayload(payload);
        if (!refreshToken) {
            this.notFound('Refresh token не найден в БД');
        }
        const user = await this.getUserFromRefreshTokenPayload(payload);
        if (!user) {
            throw new UnprocessableEntityException(
                'Не верный формат refresh token',
            );
        }
        return {
            user,
            refreshToken: refreshToken!,
        };
    }

    public async createAccessTokenFromRefreshToken(
        refreshToken: string,
    ): Promise<{ accessToken: string; user: UserModel }> {
        const { user } = await this.updateRefreshToken(refreshToken);
        const accessToken = await this.generateAccessToken(user);
        return {
            accessToken,
            user,
        };
    }

    // Возвращает синхронный хэш refresh токена для сохранения в БД
    public hashRefreshToken(encoded: string): string {
        // Соль по умолчанию 10; синхронный чтобы вызывать без await там, где удобно
        return bcrypt.hashSync(encoded, 10);
    }

    // Возвращает дату истечения refresh токена из его payload (поле exp)
    public getRefreshExpiresAt(encoded: string): Date | undefined {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decoded: any = this.jwtService.decode(encoded);
        if (decoded && typeof decoded === 'object' && decoded.exp) {
            // exp в секундах от Unix epoch
            return new Date(decoded.exp * 1000);
        }
        return undefined;
    }

    public async removeRefreshToken(
        refreshTokenId: number,
        userId: number,
    ): Promise<number> {
        const listRefreshTokens =
            await this.refreshTokenRepository.findListRefreshTokens(userId);
        if (listRefreshTokens.length > 1) {
            return this.refreshTokenRepository.removeListRefreshTokens(userId);
        }
        return this.refreshTokenRepository.removeRefreshToken(refreshTokenId);
    }

    public async rotateRefreshToken(
        encodedRefreshToken: string,
    ): Promise<{ accessToken: string; refreshToken: string; user: UserModel }> {
        const payload = await this.decodeRefreshToken(encodedRefreshToken);
        const userId = Number(payload.sub);
        const tokenId = Number(payload.jti);

        if (!userId || !tokenId) {
            throw new UnprocessableEntityException(
                'Invalid refresh token payload',
            );
        }

        // Ищем токен в БД
        const storedToken =
            await this.refreshTokenRepository.findRefreshTokenById(tokenId);

        if (!storedToken) {
            // Удаляем ВСЕ refresh токены пользователя для безопасности
            await this.refreshTokenRepository
                .removeListRefreshTokens(userId)
                .catch(() => {
                    // Игнорируем ошибки при удалении
                });
            throw new NotFoundException(
                'Refresh token not found or already used (possible theft detected)',
            );
        }
        // Проверяем, что токен принадлежит правильному пользователю
        if (storedToken.user_id !== userId) {
            throw new UnprocessableEntityException('Token user mismatch');
        }
        //  Проверяем срок действия (если есть поле expires)
        if (storedToken.expires && storedToken.expires <= new Date()) {
            await this.refreshTokenRepository.removeRefreshToken(tokenId);
            throw new UnprocessableEntityException('Refresh token expired');
        }
        //  Удаляем старый токен (одноразовость)
        await this.refreshTokenRepository.removeRefreshToken(tokenId);

        // Загружаем пользователя
        const user = await this.userRepository.findUserByPkId(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        // Создаём новый refresh токен
        const ttlSeconds = 60 * 60 * 24 * 30; // 30 дней (можно вынести в конфиг)
        const newRefreshTokenRecord =
            await this.refreshTokenRepository.createRefreshToken(
                user,
                ttlSeconds,
            );
        // Подписываем новый refresh токен
        const newRefreshTokenOptions: SignOptions = {
            subject: String(user.id),
            jwtid: String(newRefreshTokenRecord.id),
        };
        const newRefreshToken = await this.jwtService.signAsync(
            {},
            newRefreshTokenOptions,
        );

        // Генерируем новый access токен
        const accessToken = await this.generateAccessToken(user);

        return {
            accessToken,
            refreshToken: newRefreshToken,
            user,
        };
    }

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }
}
