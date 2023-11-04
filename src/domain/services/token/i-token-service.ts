import { UserModel, RefreshTokenModel, RoleModel } from '@app/domain/models';

export interface ITokenService {
    generateAccessToken(user: UserModel): Promise<string>;

    generateRefreshToken(user: UserModel, expiresIn: number): Promise<string>;

    getUserFromRefreshTokenPayload(
        payload: IRefreshTokenPayload,
    ): Promise<UserModel>;

    getStoredRefreshTokenFromRefreshTokenPayload(
        payload: IRefreshTokenPayload,
    ): Promise<RefreshTokenModel | null>;

    decodeRefreshToken(refreshToken: string): Promise<IRefreshTokenPayload>;

    updateRefreshToken(
        encoded: string,
    ): Promise<{ user: UserModel; refreshToken: RefreshTokenModel }>;

    createAccessTokenFromRefreshToken(
        refreshToken: string,
    ): Promise<{ accessToken: string; user: UserModel }>;

    removeRefreshToken(refreshTokenId: number, userId: number): Promise<number>;
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