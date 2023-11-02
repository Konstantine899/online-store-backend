import { RegistrationDto } from '../../infrastructure/dto/auth/registration.dto';
import { RegistrationResponse } from '../../infrastructure/responses/auth/registration.response';
import { LoginDto } from '../../infrastructure/dto/auth/login.dto';
import { LoginResponse } from '../../infrastructure/responses/auth/login.response';
import { RefreshDto } from '../../infrastructure/dto/auth/refresh.dto';
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
