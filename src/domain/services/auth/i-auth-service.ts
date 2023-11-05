import { CreateUserDto, RefreshDto } from '@app/infrastructure/dto';
import {
    RegistrationResponse,
    LoginResponse,
    LogoutResponse,
    UpdateAccessTokenResponse,
} from '@app/infrastructure/responses';
import { Request } from 'express';

export interface IAuthService {
    registration(dto: CreateUserDto): Promise<RegistrationResponse>;

    login(dto: CreateUserDto): Promise<LoginResponse>;

    logout(refresh: RefreshDto, request: Request): Promise<LogoutResponse>;

    updateAccessToken(refreshToken: string): Promise<UpdateAccessTokenResponse>;
}
