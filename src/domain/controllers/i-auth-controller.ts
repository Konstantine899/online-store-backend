import { RegistrationDto, LoginDto } from '@app/infrastructure/dto';
import {
    RegistrationResponse,
    LoginResponse,
    UpdateAccessTokenResponse,
    CheckResponse,
    LogoutResponse,
} from '@app/infrastructure/responses';
import { Request, Response } from 'express';

export interface IAuthController {
    registration(dto: RegistrationDto): Promise<RegistrationResponse>;

    login(dto: LoginDto, req: Request, res: Response): Promise<LoginResponse>;

    updateAccessToken(req: Request): Promise<UpdateAccessTokenResponse>;

    checkUserAuth(request: Request): Promise<CheckResponse>;

    logout(req: Request, res: Response): Promise<LogoutResponse>;
}
