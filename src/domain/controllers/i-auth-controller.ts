import { RegistrationDto, LoginDto, RefreshDto } from '@app/infrastructure/dto';
import {
    RegistrationResponse,
    LoginResponse,
    UpdateAccessTokenResponse,
    CheckResponse,
    LogoutResponse,
} from '@app/infrastructure/responses';
import { Request } from 'express';

export interface IAuthController {
    registration(dto: RegistrationDto): Promise<RegistrationResponse>;

    login(dto: LoginDto): Promise<LoginResponse>;

    updateAccessToken(dto: RefreshDto): Promise<UpdateAccessTokenResponse>;

    checkUserAuth(request: Request): Promise<CheckResponse>;

    logout(request: Request, refresh: RefreshDto): Promise<LogoutResponse>;
}
