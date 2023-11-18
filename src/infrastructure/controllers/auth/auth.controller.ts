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
import { AuthService, UserService } from '@app/infrastructure/services';
import { RegistrationDto, LoginDto, RefreshDto } from '@app/infrastructure/dto';
import { ApiTags } from '@nestjs/swagger';
import {
    RegistrationSwaggerDecorator,
    LogoutSwaggerDecorator,
    LoginSwaggerDecorator,
    CheckUserAuthSwaggerDecorator,
    UpdateAccessTokenSwaggerDecorator,
} from '@app/infrastructure/common/decorators';

import {
    LoginResponse,
    RegistrationResponse,
    UpdateAccessTokenResponse,
    CheckResponse,
    LogoutResponse,
} from '@app/infrastructure/responses';

import { AuthGuard } from '@app/infrastructure/common/guards';
import { IAuthController } from '@app/domain/controllers';
import { IDecodedAccessToken } from '@app/domain/jwt';

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
    @UseGuards(AuthGuard)
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
        const { id } = request.user as IDecodedAccessToken;
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
