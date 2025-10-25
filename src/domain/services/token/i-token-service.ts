import type { UserModel, RefreshTokenModel, RoleModel } from '@app/domain/models';
import type { IDecodedAccessToken } from '@app/domain/jwt';
import type { Request } from 'express';

export interface ITokenService {
    generateAccessToken(user: UserModel): Promise<string>;

    generateRefreshToken(user: UserModel, expiresIn: number): Promise<string>;

    getUserFromRefreshTokenPayload(
        payload: IRefreshTokenPayload,
    ): Promise<UserModel>;

    getStoredRefreshTokenFromRefreshTokenPayload(
        payload: IRefreshTokenPayload,
    ): Promise<RefreshTokenModel | null>;

    decodedAccessToken(
        token: string,
        request: Request,
    ): Promise<IDecodedAccessToken>;

    decodeRefreshToken(refreshToken: string): Promise<IRefreshTokenPayload>;

    updateRefreshToken(
        encoded: string,
    ): Promise<{ user: UserModel; refreshToken: RefreshTokenModel }>;

    createAccessTokenFromRefreshToken(
        refreshToken: string,
    ): Promise<{ accessToken: string; user: UserModel }>;

    removeRefreshToken(refreshTokenId: number, userId: number): Promise<number>;

    /**
     * Ротирует refresh токен: удаляет старый, создаёт новый
     * @param encodedRefreshToken - закодированный refresh токен
     * @returns новый access токен, новый refresh токен и пользователя
     * @throws NotFoundException если токен не найден (reuse detection)
     */
    rotateRefreshToken(
        encodedRefreshToken: string,
    ): Promise<{ accessToken: string; refreshToken: string; user: UserModel }>;
}

export interface IRefreshTokenPayload {
    sub: number;
    email: string;
    jti: number;
}

export interface IAccessTokenPayload {
    id: number;
    roles: RoleModel[];
}
