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

@Injectable()
export class AuthService implements IAuthService {
    constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService,
    ) {}

    public async registration(
        dto: CreateUserDto,
    ): Promise<RegistrationResponse> {
        const candidate = await this.userService.findUserByEmail(dto.email);
        if (candidate) {
            this.badRequest(
                `Пользователь с таким email: ${candidate.email} уже существует`,
            );
        }
        const user = await this.userService.createUser(dto);
        const accessToken = await this.tokenService.generateAccessToken(user);
        const refreshToken = await this.tokenService.generateRefreshToken(
            user,
            60 * 60 * 24 * 30,
        );
        return this.getToken(accessToken, refreshToken);
    }

    public async login(dto: CreateUserDto): Promise<LoginResponse> {
        const user = await this.validateUser(dto);
        const accessToken = await this.tokenService.generateAccessToken(user);
        const refreshToken = await this.tokenService.generateRefreshToken(
            user,
            60 * 60 * 24 * 30,
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
        request.headers.authorization = null; // обнуляю access token
        return {
            status: HttpStatus.OK,
            message: 'success',
        };
    }

    public async updateAccessToken(
        refreshToken: string,
    ): Promise<UpdateAccessTokenResponse> {
        const { accessToken } =
            await this.tokenService.createAccessTokenFromRefreshToken(
                refreshToken,
            );
        return this.getToken(accessToken);
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

    private async validateUser(dto: CreateUserDto): Promise<UserModel> {
        const user = await this.userService.findUserByEmail(dto.email);
        if (!user) {
            this.unauthorized('Не корректный email');
        }
        const password = await bcrypt.compare(dto.password, user.password); // сравниваю пароли
        if (!password) {
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
}
