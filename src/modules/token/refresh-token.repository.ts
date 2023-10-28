import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RefreshTokenModel } from './refresh-token.model';
import { UserModel } from '../user/user.model';

interface IRefreshTokenRepository {
    createRefreshToken(
        user: UserModel,
        ttl: number,
    ): Promise<RefreshTokenModel>;

    findRefreshTokenById(id: number): Promise<RefreshTokenModel | null>;

    findListRefreshTokens(userId: number): Promise<RefreshTokenModel[]>;

    removeListRefreshTokens(userId: number): Promise<number>;

    removeRefreshToken(refreshTokenId: number): Promise<number>;
}

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
    constructor(
        @InjectModel(RefreshTokenModel)
        private readonly refreshTokenModel: typeof RefreshTokenModel,
    ) {}

    public async createRefreshToken(
        user: UserModel,
        ttl: number,
    ): Promise<RefreshTokenModel> {
        const refresh_token = new RefreshTokenModel();
        refresh_token.user_id = user.id;
        refresh_token.is_revoked = false;
        const expires = new Date(); // Получаю текущую дату и время
        expires.setTime(expires.getTime() + ttl); // устанавливаю дату окончания действия refresh token
        refresh_token.expires = expires;
        return refresh_token.save();
    }

    public async findRefreshTokenById(
        id: number,
    ): Promise<RefreshTokenModel | null> {
        return this.refreshTokenModel.findOne({
            where: { id },
        });
    }

    public async findListRefreshTokens(
        userId: number,
    ): Promise<RefreshTokenModel[]> {
        return this.refreshTokenModel.findAll({ where: { user_id: userId } });
    }

    public async removeListRefreshTokens(userId: number): Promise<number> {
        return this.refreshTokenModel.destroy({ where: { user_id: userId } });
    }

    public async removeRefreshToken(refreshTokenId: number): Promise<number> {
        return this.refreshTokenModel.destroy({
            where: { id: refreshTokenId },
        });
    }
}
