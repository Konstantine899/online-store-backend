import { CreateUserDto } from '../../../infrastructure/dto/user/create-user.dto';
import { RegistrationResponse } from '../../../infrastructure/responses/auth/registration.response';
import { LoginResponse } from '../../../infrastructure/responses/auth/login.response';
import { RefreshDto } from '../../../infrastructure/dto/auth/refresh.dto';
import { Request } from 'express';
import { LogoutResponse } from '../../../infrastructure/responses/auth/logout.response';
import { UpdateAccessTokenResponse } from '../../../infrastructure/responses/auth/update-access-token.response';

export interface IAuthService {
    registration(dto: CreateUserDto): Promise<RegistrationResponse>;

    login(dto: CreateUserDto): Promise<LoginResponse>;

    logout(refresh: RefreshDto, request: Request): Promise<LogoutResponse>;

    updateAccessToken(refreshToken: string): Promise<UpdateAccessTokenResponse>;
}
