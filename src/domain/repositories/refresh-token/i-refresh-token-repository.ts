import { UserModel } from '../../models/user.model';
import { RefreshTokenModel } from '../../models/refresh-token.model';

export interface IRefreshTokenRepository {
    createRefreshToken(
        user: UserModel,
        ttl: number,
    ): Promise<RefreshTokenModel>;

    findRefreshTokenById(id: number): Promise<RefreshTokenModel | null>;

    findListRefreshTokens(userId: number): Promise<RefreshTokenModel[]>;

    removeListRefreshTokens(userId: number): Promise<number>;

    removeRefreshToken(refreshTokenId: number): Promise<number>;
}
