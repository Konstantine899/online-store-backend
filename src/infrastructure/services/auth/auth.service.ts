import {
    BadRequestException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto, RefreshDto } from '@app/infrastructure/dto';
import * as bcrypt from 'bcrypt';
import { UserModel } from '@app/domain/models';
import { TokenService } from '../token/token.service';
import { Request } from 'express';
import {
    LogoutResponse,
    LoginResponse,
    UpdateAccessTokenResponse,
    RegistrationResponse,
} from '@app/infrastructure/responses';
import { IAuthResponse } from '@app/domain/responses';
import { IAuthService } from '@app/domain/services';
import { createLogger, maskPII } from '@app/infrastructure/common/utils/logging';

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
                    error: error instanceof Error ? error.message : String(error),
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
}
