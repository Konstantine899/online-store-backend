import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegistrationDto } from './dto/registration.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UserService } from '../user/user.service';
import { ApiTags } from '@nestjs/swagger';
import { RegistrationSwaggerDecorator } from './decorators/swagger/registration.swagger.decorator';
import { LoginSwaggerDecorator } from './decorators/swagger/login.swagger.decorator';
import { UpdateAccessTokenSwaggerDecorator } from './decorators/swagger/update-access-token.swagger.decorator';
import { CheckUserAuthSwaggerDecorator } from './decorators/swagger/check-user-auth-swagger-decorator';
import { LogoutSwaggerDecorator } from './decorators/swagger/logout.swagger.decorator';
import { LoginResponse } from './responses/login.response';
import { RegistrationResponse } from './responses/registration.response';
import { UpdateAccessTokenResponse } from './responses/update-access-token.response';
import { CheckResponse } from './responses/check-response';
import { LogoutResponse } from './responses/logout.response';
import { UserModel } from '../user/user.model';
import { AuthGuard } from './auth.guard';

interface IAuthController {
    registration(dto: RegistrationDto): Promise<RegistrationResponse>;

    login(dto: LoginDto): Promise<LoginResponse>;

    updateAccessToken(dto: RefreshDto): Promise<UpdateAccessTokenResponse>;

    checkUserAuth(request: Request): Promise<CheckResponse>;

    logout(request: Request, refresh: RefreshDto): Promise<LogoutResponse>;
}

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController implements IAuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) {}

    @RegistrationSwaggerDecorator()
    @HttpCode(201)
    @Post('/registration')
    public async registration(
        @Body() dto: RegistrationDto,
    ): Promise<RegistrationResponse> {
        return this.authService.registration(dto);
    }

    @LoginSwaggerDecorator()
    @HttpCode(200)
    @Post('/login')
    public async login(@Body() dto: LoginDto): Promise<LoginResponse> {
        return this.authService.login(dto);
    }

    @UpdateAccessTokenSwaggerDecorator()
    @HttpCode(201)
    @Post('/refresh')
    public async updateAccessToken(
        @Body() dto: RefreshDto,
    ): Promise<UpdateAccessTokenResponse> {
        return this.authService.updateAccessToken(dto.refreshToken);
    }

    @CheckUserAuthSwaggerDecorator()
    @UseGuards(AuthGuard)
    @Get('/check')
    public async checkUserAuth(
        @Req() request: Request,
    ): Promise<CheckResponse> {
        const { id } = request.user as UserModel;
        return this.userService.checkUserAuth(id);
    }

    @LogoutSwaggerDecorator()
    @UseGuards(AuthGuard)
    @Delete('/logout')
    public async logout(
        @Req() request: Request,
        @Body() refresh: RefreshDto,
    ): Promise<LogoutResponse> {
        return this.authService.logout(refresh, request);
    }
}
