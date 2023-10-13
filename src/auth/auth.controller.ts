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
import { JwtGuard } from '../token/jwt.guard';
import { ApiTags } from '@nestjs/swagger';
import { RegistrationSwaggerDecorator } from './decorators/swagger/registration.swagger.decorator';
import { LoginSwaggerDecorator } from './decorators/swagger/login.swagger.decorator';
import { UpdateAccessTokenSwaggerDecorator } from './decorators/swagger/update-access-token.swagger.decorator';
import { LoginCheckSwaggerDecorator } from './decorators/swagger/login-check.swagger.decorator';
import { LoginCheckRequest } from './requests/login-check.request';
import { LogoutSwaggerDecprator } from './decorators/swagger/logout.swagger.decprator';
import { LoginResponse } from './responses/login.response';
import { RegistrationResponse } from './responses/registration.response';
import { UpdateAccessTokenResponse } from './responses/update-access-token.response';
import { LoginCheckResponse } from './responses/login-check.response';
import { LogoutResponse } from './responses/logout.response';

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController {
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

    @LoginCheckSwaggerDecorator()
    @UseGuards(JwtGuard)
    @Get('/login-check')
    public async loginCheck(
        @Req() request: Request,
    ): Promise<LoginCheckResponse> {
        const { id } = request.user as LoginCheckRequest;
        return this.userService.loginCheck(id);
    }

    @LogoutSwaggerDecprator()
    @UseGuards(JwtGuard)
    @Delete('/logout')
    public async logout(
        @Req() request: Request,
        @Body() refresh: RefreshDto,
    ): Promise<LogoutResponse> {
        return this.authService.logout(refresh, request);
    }
}
