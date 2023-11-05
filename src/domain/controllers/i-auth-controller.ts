import { RegistrationDto, LoginDto, RefreshDto } from '@app/infrastructure/dto';
import { RegistrationResponse } from '../../infrastructure/responses/auth/registration.response';
import { LoginResponse } from '../../infrastructure/responses/auth/login.response';
import { UpdateAccessTokenResponse } from '../../infrastructure/responses/auth/update-access-token.response';
import { Request } from 'express';
import { CheckResponse } from '../../infrastructure/responses/auth/check-response';
import { LogoutResponse } from '../../infrastructure/responses/auth/logout.response';

export interface IAuthController {
    registration(dto: RegistrationDto): Promise<RegistrationResponse>;

    login(dto: LoginDto): Promise<LoginResponse>;

    updateAccessToken(dto: RefreshDto): Promise<UpdateAccessTokenResponse>;

    checkUserAuth(request: Request): Promise<CheckResponse>;

    logout(request: Request, refresh: RefreshDto): Promise<LogoutResponse>;
}
