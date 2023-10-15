import {
    HttpStatus,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserModel } from '../user/user.model';
import { SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { RefreshTokenRepository } from './refresh-token.repository';
import { UserRepository } from '../user/user.repository';
import { RefreshTokenModel } from './refresh-token.model';
import { RoleModel } from '../role/role.model';

export interface IRefreshTokenPayload {
    sub: number;
    email: string;

    jti: number;
}

export interface IAccessTokenPayload {
    id: number;
    roles: RoleModel[];
}

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly userRepository: UserRepository,
    ) {}

    public async generateAccessToken(user: UserModel): Promise<string> {
        const payload: IAccessTokenPayload = { id: user.id, roles: user.roles };
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
        return { user, refreshToken };
    }

    public async createAccessTokenFromRefreshToken(
        refreshToken: string,
    ): Promise<{ accessToken: string; user: UserModel }> {
        const { user } = await this.updateRefreshToken(refreshToken);
        const accessToken = await this.generateAccessToken(user);
        return { accessToken, user };
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

    private notFound(message: string): void {
        throw new NotFoundException({
            status: HttpStatus.NOT_FOUND,
            message,
        });
    }
}
